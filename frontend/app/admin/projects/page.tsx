'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project, Department } from '@/lib/types';
import { ProjectStatusBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FolderKanban, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  ArrowLeft,
  Search,
  Calendar
} from 'lucide-react';

export default function ProjectManagePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<number>(0);
  const [formDeptId, setFormDeptId] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, deptsData] = await Promise.all([
        api.getProjects(),
        api.getDepartments(),
      ]);
      setProjects(projectsData);
      setDepartments(deptsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load projects', 'error');
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
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormStatus(0);
    setFormDeptId(departments[0]?.departmentId || 0);
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormName(project.projectName);
    setFormDesc(project.description || '');
    setFormStartDate(project.startDate);
    setFormEndDate(project.endDate || '');
    setFormStatus(project.status);
    setFormDeptId(project.departmentId);
    setFormIsActive(project.isActive);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = 'Project Name is required.';
    } else if (formName.trim().length > 200) {
      errors.name = 'Project Name cannot exceed 200 characters.';
    }

    if (!formStartDate) {
      errors.startDate = 'Start Date is required.';
    }

    if (!formDeptId || formDeptId <= 0) {
      errors.deptId = 'Please select a valid Department.';
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
        projectName: formName,
        description: formDesc || undefined,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        status: formStatus,
        departmentId: formDeptId,
        isActive: formIsActive,
      };

      if (editingProject) {
        await api.updateProject(editingProject.projectId, payload);
        showToast('Project updated successfully', 'success');
      } else {
        await api.createProject(payload);
        showToast('Project created successfully', 'success');
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
    if (!deleteProject) return;
    try {
      setDeleting(true);
      await api.deleteProject(deleteProject.projectId);
      showToast('Project deleted successfully', 'success');
      setDeleteProject(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.departmentName && p.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <FolderKanban className="w-8 h-8 text-indigo-600" />
            Project Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Create, edit, and manage projects across all departments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by project or department..."
          className="w-full px-4 py-2 pl-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No projects found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredProjects.map((project) => (
                  <tr key={project.projectId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">#{project.projectId}</td>
                    <td className="py-3.5 px-4">
                      <Link href={`/projects/${project.projectId}`} className="font-semibold text-slate-900 dark:text-zinc-100 hover:text-indigo-600 hover:underline">
                        {project.projectName}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{project.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-medium">
                        {project.departmentName || `Dept #${project.departmentId}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{project.startDate} &rarr; {project.endDate || 'Ongoing'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(project)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteProject(project)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Delete Project"
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
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Mobile App Redesign"
              maxLength={200}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            />
            {formErrors.name && <p className="text-xs text-rose-600">{formErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={formDeptId}
              onChange={(e) => setFormDeptId(Number(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.deptId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            >
              <option value="0">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            {formErrors.deptId && <p className="text-xs text-rose-600">{formErrors.deptId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.startDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                }`}
              />
              {formErrors.startDate && <p className="text-xs text-rose-600">{formErrors.startDate}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Project Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="0">Not Started</option>
              <option value="1">In Progress</option>
              <option value="2">Completed</option>
              <option value="3">On Hold</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Objective and details of the project..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {editingProject && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="projIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="projIsActive" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Is Active
              </label>
            </div>
          )}

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
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Project"
        message={`Are you sure you want to delete project "${deleteProject?.projectName}"? Note: Projects with linked tasks cannot be deleted.`}
      />
    </div>
  );
}
