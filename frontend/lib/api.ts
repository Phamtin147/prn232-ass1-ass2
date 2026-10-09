import {
  Department,
  DepartmentDetail,
  Project,
  ProjectDetail,
  Task,
  Tag,
  Stats,
  Account,
  AuthResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

function getStoredRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function refreshAccessToken(): Promise<string | null> {
  const currentRefreshToken = getStoredRefreshToken();
  if (!currentRefreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }

    const data: AuthResponse = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.account));
    return data.token;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options?: RequestInit, isRetry = false): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401 && !isRetry && !endpoint.includes('/api/auth/login') && !endpoint.includes('/api/auth/refresh-token')) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(request<T>(endpoint, options, true)),
          reject: (err) => reject(err),
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;

    if (newToken) {
      processQueue(null, newToken);
      return request<T>(endpoint, options, true);
    } else {
      processQueue(new Error('Session expired'), null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/profile')) {
          window.location.href = '/login';
        }
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.errors) {
        errorMessage = Object.values(errorData.errors).flat().join(', ');
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // ignore
    }
    const err = new Error(errorMessage) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth & Profile
  async register(data: { fullName: string; email: string; password: string }): Promise<Account> {
    return request<Account>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  async getProfile(): Promise<Account> {
    return request<Account>('/api/auth/profile');
  },
  async updateProfile(data: { fullName: string }): Promise<Account> {
    return request<Account>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Account Management (Admin only)
  async getAccounts(): Promise<Account[]> {
    return request<Account[]>('/api/accounts');
  },
  async getAccountById(id: number): Promise<Account> {
    return request<Account>(`/api/accounts/${id}`);
  },
  async updateAccount(id: number, data: { fullName?: string; role?: number }): Promise<Account> {
    return request<Account>(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteAccount(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  // Stats
  async getStats(): Promise<Stats> {
    try {
      return await request<Stats>('/api/stats');
    } catch {
      const [departments, projects, tasks, tags] = await Promise.all([
        api.getDepartments().catch(() => []),
        api.getProjects().catch(() => []),
        api.getTasks().catch(() => []),
        api.getTags().catch(() => []),
      ]);
      return {
        departmentsCount: departments.length,
        projectsCount: projects.length,
        tasksCount: tasks.length,
        tagsCount: tags.length,
      };
    }
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    return request<Department[]>('/api/departments');
  },
  async getDepartmentById(id: number): Promise<DepartmentDetail> {
    return request<DepartmentDetail>(`/api/departments/${id}`);
  },
  async createDepartment(data: { departmentName: string; departmentDescription: string; isActive?: boolean }): Promise<Department> {
    return request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateDepartment(id: number, data: { departmentName: string; departmentDescription: string; isActive: boolean }): Promise<Department> {
    return request<Department>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteDepartment(id: number): Promise<void> {
    return request<void>(`/api/departments/${id}`, {
      method: 'DELETE',
    });
  },
  async searchDepartments(name: string): Promise<Department[]> {
    return request<Department[]>(`/api/departments/search?name=${encodeURIComponent(name)}`);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>('/api/projects');
  },
  async getProjectById(id: number): Promise<ProjectDetail> {
    return request<ProjectDetail>(`/api/projects/${id}`);
  },
  async getProjectsByDepartment(deptId: number): Promise<Project[]> {
    return request<Project[]>(`/api/projects/department/${deptId}`);
  },
  async createProject(data: {
    projectName: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: number;
    departmentId: number;
    isActive?: boolean;
  }): Promise<Project> {
    return request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateProject(
    id: number,
    data: {
      projectName: string;
      description?: string;
      startDate: string;
      endDate?: string;
      status: number;
      departmentId: number;
      isActive: boolean;
    }
  ): Promise<Project> {
    return request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteProject(id: number): Promise<void> {
    return request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
  async filterProjects(name?: string, status?: number, departmentId?: number): Promise<Project[]> {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (status !== undefined && status !== null) params.append('status', status.toString());
    if (departmentId) params.append('departmentId', departmentId.toString());
    return request<Project[]>(`/api/projects/search?${params.toString()}`);
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    return request<Task[]>('/api/tasks');
  },
  async getTaskById(id: number): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`);
  },
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return request<Task[]>(`/api/tasks/project/${projectId}`);
  },
  async createTask(data: {
    title: string;
    description?: string;
    status: number;
    priority: number;
    dueDate?: string;
    projectId: number;
    tagIds?: number[];
  }): Promise<Task> {
    return request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateTask(
    id: number,
    data: {
      title: string;
      description?: string;
      status: number;
      priority: number;
      dueDate?: string;
      projectId: number;
      tagIds?: number[];
    }
  ): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteTask(id: number): Promise<void> {
    return request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },
  async filterTasks(params: {
    title?: string;
    status?: number;
    priority?: number;
    projectId?: number;
    tagId?: number;
  }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params.title) query.append('title', params.title);
    if (params.status !== undefined && params.status !== null) query.append('status', params.status.toString());
    if (params.priority !== undefined && params.priority !== null) query.append('priority', params.priority.toString());
    if (params.projectId) query.append('projectId', params.projectId.toString());
    if (params.tagId) query.append('tagId', params.tagId.toString());
    return request<Task[]>(`/api/tasks/search?${query.toString()}`);
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    return request<Tag[]>('/api/tags');
  },
  async createTag(data: { tagName: string; color?: string }): Promise<Tag> {
    return request<Tag>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateTag(id: number, data: { tagName: string; color?: string }): Promise<Tag> {
    return request<Tag>(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteTag(id: number): Promise<void> {
    return request<void>(`/api/tags/${id}`, {
      method: 'DELETE',
    });
  },
};
