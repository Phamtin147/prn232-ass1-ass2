'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Account } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { 
  Users, 
  ArrowLeft, 
  UserCheck, 
  Trash2, 
  Edit3, 
  Search, 
  Loader2, 
  ShieldAlert
} from 'lucide-react';

export default function AdminAccountsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  // Delete Dialog State
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        showToast('Access denied: Admin role required (HTTP 403 Forbidden).', 'error');
        router.push('/admin');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router, showToast]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.getAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load accounts';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAccounts();
    }
  }, [isAuthenticated, isAdmin]);

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormFullName(acc.fullName);
    setFormRole(acc.role);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setUpdating(true);
      await api.updateAccount(editingAccount.accountId, {
        fullName: formFullName.trim(),
        role: formRole,
      });
      showToast(`Account #${editingAccount.accountId} updated successfully`, 'success');
      setIsEditModalOpen(false);
      loadAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      showToast(msg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;

    try {
      setDeleting(true);
      await api.deleteAccount(deleteAccount.accountId);
      showToast('Account deleted successfully', 'success');
      setDeleteAccount(null);
      loadAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = accounts.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || (!isAdmin && isAuthenticated)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Users className="w-8 h-8 text-red-600" />
            System Accounts Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Admin-only module: Inspect registered accounts, modify user privileges, and manage system access.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name or email..."
          className="w-full px-4 py-2 pl-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Accounts Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading accounts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 w-28">Role</th>
                  <th className="py-3 px-4 w-36">Created Date</th>
                  <th className="py-3 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filtered.map((acc) => {
                  const isCurrentLoggedUser = acc.accountId === user?.accountId;
                  return (
                    <tr key={acc.accountId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">#{acc.accountId}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        {acc.fullName}
                        {isCurrentLoggedUser && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400 font-mono text-xs">
                        {acc.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            acc.role === 1
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {acc.role === 1 ? <ShieldAlert className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {acc.role === 1 ? 'Admin (1)' : 'Staff (0)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-zinc-400">
                        {new Date(acc.createdDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit Account / Change Role"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteAccount(acc)}
                          disabled={isCurrentLoggedUser}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isCurrentLoggedUser ? "Cannot delete own logged-in account" : "Delete Account"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Account #${editingAccount?.accountId}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Role Permission
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>0 - Staff (Full CRUD on Projects, Tasks, Departments, Tags)</option>
              <option value={1}>1 - Admin (All Staff permissions + Account Management)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updating}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Account"
        message={`Are you sure you want to delete account "${deleteAccount?.fullName}" (${deleteAccount?.email})? If this account has created tasks, deletion will be rejected.`}
      />
    </div>
  );
}
