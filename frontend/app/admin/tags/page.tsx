'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Tag } from '@/lib/types';
import { TagBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Tags, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  ArrowLeft,
  Search,
  Palette
} from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
  '#06B6D4', '#6366F1', '#EC4899', '#64748B', '#14B8A6'
];

export default function TagManagePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await api.getTags();
      setTags(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadTags();
    }
  }, [isAuthenticated]);

  const openCreateModal = () => {
    setEditingTag(null);
    setFormName('');
    setFormColor('#3B82F6');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.tagName);
    setFormColor(tag.color || '#3B82F6');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = 'Tag Name is required.';
    } else if (formName.trim().length > 50) {
      errors.name = 'Tag Name cannot exceed 50 characters.';
    }

    if (formColor && !/^#([A-Fa-f0-9]{6})$/.test(formColor)) {
      errors.color = 'Must be a valid hex color (e.g. #3B82F6).';
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
        tagName: formName,
        color: formColor || undefined,
      };

      if (editingTag) {
        await api.updateTag(editingTag.tagId, payload);
        showToast('Tag updated successfully', 'success');
      } else {
        await api.createTag(payload);
        showToast('Tag created successfully', 'success');
      }
      setIsModalOpen(false);
      loadTags();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTag) return;
    try {
      setDeleting(true);
      await api.deleteTag(deleteTag.tagId);
      showToast('Tag deleted successfully', 'success');
      setDeleteTag(null);
      loadTags();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete tag', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredTags = tags.filter((t) =>
    t.tagName.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Tags className="w-8 h-8 text-indigo-600" />
            Tag Management (CRUD)
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Create, customize colors, and manage tags across tasks
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by tag name..."
          className="w-full px-4 py-2 pl-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading tags...</p>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No tags found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Tag Name</th>
                  <th className="py-3 px-4">Badge Preview</th>
                  <th className="py-3 px-4">Color Code</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredTags.map((tag) => (
                  <tr key={tag.tagId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">#{tag.tagId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-zinc-100">
                      {tag.tagName}
                    </td>
                    <td className="py-3.5 px-4">
                      <TagBadge tag={tag} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-xs"
                          style={{ backgroundColor: tag.color || '#64748B' }}
                        />
                        <span>{tag.color || 'Default (#64748B)'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(tag)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Tag"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTag(tag)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Delete Tag"
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
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Tag Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. frontend, high-priority..."
              maxLength={50}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                formErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
              }`}
            />
            {formErrors.name && <p className="text-xs text-rose-600">{formErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-500" />
              Tag Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-zinc-700 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                placeholder="#3B82F6"
                maxLength={7}
                className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
              />
              <div className="pl-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border"
                  style={{
                    backgroundColor: `${formColor}20`,
                    borderColor: `${formColor}60`,
                    color: formColor,
                  }}
                >
                  Preview
                </span>
              </div>
            </div>
            {formErrors.color && <p className="text-xs text-rose-600">{formErrors.color}</p>}

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-xs text-slate-400 block mb-1.5">Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className="w-6 h-6 rounded-full border border-slate-200 shadow-xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
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
              {editingTag ? 'Update Tag' : 'Create Tag'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTag}
        onClose={() => setDeleteTag(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Tag"
        message={`Are you sure you want to delete tag "${deleteTag?.tagName}"? Note: Tags used by any tasks cannot be deleted.`}
      />
    </div>
  );
}
