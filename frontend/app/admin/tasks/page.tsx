'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Task, Project, Tag } from '@/lib/types';
import { TaskStatusBadge, TaskPriorityBadge, TagBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  CheckSquare, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  ArrowLeft,
  Search,
  Calendar,
  FolderKanban
} from 'lucide-react';

export default function TaskManagePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<number>(0);
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formDueDate, setFormDueDate] = useState('');
  const [formProjectId, setFormProjectId] = useState<number>(0);
  const [formTagIds, setFormTagIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData, tagsData] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getTags(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
      setTags(tagsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormStatus(0);
    setFormPriority(1);
    setFormDueDate('');
    setFormProjectId(projects[0]?.projectId || 0);
    setFormTagIds([]);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate || '');
    setFormProjectId(task.projectId);
    setFormTagIds(task.tags?.map((t) => t.tagId) || []);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleTagToggle = (tagId: number) => {
    setFormTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formTitle.trim()) {
      errors.title = 'Title is required.';
    } else if (formTitle.trim().length > 300) {
      errors.title = 'Title cannot exceed 300 characters.';
    }

    if (!formProjectId || formProjectId <= 0) {
      errors.projectId = 'Please select a valid Project.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle,
        description: formDesc || undefined,
        status: formStatus,
        priority: formPriority,
        dueDate: formDueDate || undefined,
        projectId: formProjectId,
        tagIds: formTagIds,
      };

      if (editingTask) {
        await api.updateTask(editingTask.taskId, payload);
        showToast('Task updated successfully', 'success');
      } else {
        await api.createTask(payload);
        showToast('Task created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    try {
      setDeleting(true);
      await api.deleteTask(deleteTask.taskId);
      showToast('Task soft-deleted successfully (marked inactive)', 'success');
      setDeleteTask(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.projectName && t.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === Number(statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <CheckSquare className="w-8 h-8 text-indigo-600" />
            Task Management (CRUD)
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Create, modify, multi-tag, and soft-delete tasks
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Search Bar & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by title, project, description..."
            className="w-full px-4 py-2 pl-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Status Filter buttons */}
        <div className="flex items-center p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-300 shrink-0">
          <span className="px-2.5 py-1 text-slate-400 font-normal">Status:</span>
          {[
            { id: 'all', label: 'All' },
            { id: '0', label: 'To Do' },
            { id: '1', label: 'In Progress' },
            { id: '2', label: 'Done' },
            { id: '3', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === st.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No active tasks found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-24">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredTasks.map((task) => (
                  <tr key={task.taskId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">#{task.taskId}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link href={`/tasks/${task.taskId}`} className="font-semibold text-slate-900 dark:text-zinc-100 hover:text-indigo-600 hover:underline">
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{task.projectName || `Project #${task.projectId}`}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {task.tags && task.tags.length > 0 ? (
                          task.tags.map((tg) => <TagBadge key={tg.tagId} tag={tg} />)
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <TaskPriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {task.dueDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Task"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTask(task)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Soft-Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Implement user login flow"
              maxLength={300}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            />
            {formErrors.title && <p className="text-xs text-rose-600">{formErrors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Parent Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(Number(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.projectId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            >
              <option value="0">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
            {formErrors.projectId && <p className="text-xs text-rose-600">{formErrors.projectId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="0">To Do</option>
                <option value="1">In Progress</option>
                <option value="2">Done</option>
                <option value="3">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Priority
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
                <option value="3">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Due Date
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Task details and acceptance criteria..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Multi-Select Tags */}
          <div className="space-y-2 pt-1">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Select Tags (Multi-select)
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 max-h-36 overflow-y-auto">
              {tags.map((tag) => {
                const isSelected = formTagIds.includes(tag.tagId);
                return (
                  <button
                    key={tag.tagId}
                    type="button"
                    onClick={() => handleTagToggle(tag.tagId)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color || '#64748B' }}
                    />
                    {tag.tagName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Soft-Delete Task"
        message={`Are you sure you want to soft-delete task "${deleteTask?.title}"? The task will be archived (IsActive = false).`}
      />
    </div>
  );
}
