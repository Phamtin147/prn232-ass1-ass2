export interface Department {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
  projects?: Project[];
}

export interface DepartmentDetail extends Department {
  projects: Project[];
}

export interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: number; // 0: Not Started, 1: In Progress, 2: Completed, 3: On Hold
  departmentId: number;
  departmentName?: string;
  isActive: boolean;
  createdDate: string;
  createdById?: number;
  updatedById?: number;
  tasks?: Task[];
}

export interface ProjectDetail extends Project {
  tasks: Task[];
}

export interface Tag {
  tagId: number;
  tagName: string;
  color?: string;
}

export interface Task {
  taskId: number;
  title: string;
  description?: string;
  status: number; // 0: To Do, 1: In Progress, 2: Done, 3: Cancelled
  priority: number; // 0: Low, 1: Medium, 2: High, 3: Critical
  dueDate?: string;
  projectId: number;
  projectName?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  createdById?: number;
  updatedById?: number;
  tags: Tag[];
}

export interface Stats {
  departmentsCount: number;
  projectsCount: number;
  tasksCount: number;
  tagsCount?: number;
}

export interface Account {
  accountId: number;
  fullName: string;
  email: string;
  role: number; // 0 = Staff, 1 = Admin
  createdDate: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  account: Account;
}
