'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Department } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  ArrowLeft,
  Search
} from 'lucide-react';

export default function DepartmentManagePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ name?: string; desc?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDepartments();
    }
  }, [isAuthenticated]);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormName('');
    setFormDesc('');
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.departmentName);
    setFormDesc(dept.departmentDescription);
    setFormIsActive(dept.isActive);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { name?: string; desc?: string } = {};
    if (!formName.trim()) {
      errors.name = 'Department Name is required.';
    } else if (formName.trim().length > 100) {
      errors.name = 'Department Name cannot exceed 100 characters.';
    }

    if (!formDesc.trim()) {
      errors.desc = 'Department Description is required.';
    } else if (formDesc.trim().length > 300) {
      errors.desc = 'Department Description cannot exceed 300 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (editingDept) {
        await api.updateDepartment(editingDept.departmentId, {
          departmentName: formName,
          departmentDescription: formDesc,
          isActive: formIsActive,
        });
        showToast('Department updated successfully', 'success');
      } else {
        await api.createDepartment({
          departmentName: formName,
          departmentDescription: formDesc,
          isActive: formIsActive,
        });
        showToast('Department created successfully', 'success');
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    try {
      setDeleting(true);
      await api.deleteDepartment(deleteDept.departmentId);
      showToast('Department deleted successfully', 'success');
      setDeleteDept(null);
      loadDepartments();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete department', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.departmentDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/departments" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Departments
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-indigo-600" />
            Department Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Create, modify, and delete organizational departments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name or description..."
          className="w-full px-4 py-2 pl-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading departments...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No departments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 w-24">Status</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredDepts.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">#{dept.departmentId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-zinc-100">
                      <Link href={`/departments/${dept.departmentId}`} className="hover:text-indigo-600 hover:underline">
                        {dept.departmentName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400 max-w-md truncate">
                      {dept.departmentDescription}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        dept.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Department"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteDept(dept)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Delete Department"
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
        title={editingDept ? 'Edit Department' : 'Create New Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Engineering, Marketing..."
              maxLength={100}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.name
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            />
            {formErrors.name && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Brief summary of responsibilities..."
              maxLength={300}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.desc
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            />
            {formErrors.desc && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{formErrors.desc}</p>
            )}
          </div>

          {editingDept && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="deptIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="deptIsActive" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
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
              {editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDept}
        onClose={() => setDeleteDept(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Department"
        message={`Are you sure you want to delete department "${deleteDept?.departmentName}"? Note: Departments with linked projects cannot be deleted.`}
      />
    </div>
  );
}
