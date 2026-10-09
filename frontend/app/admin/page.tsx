'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Stats } from '@/lib/types';
import { 
  Building2, 
  FolderKanban, 
  CheckSquare, 
  Tags, 
  Users, 
  ArrowRight,
  ShieldAlert,
  Layers
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      api.getStats()
        .then((data) => setStats(data))
        .catch(() => {})
        .finally(() => setLoadingStats(false));
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Departments',
      count: stats?.departmentsCount ?? 0,
      icon: Building2,
      href: '/admin/departments',
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Projects',
      count: stats?.projectsCount ?? 0,
      icon: FolderKanban,
      href: '/admin/projects',
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
      title: 'Tasks',
      count: stats?.tasksCount ?? 0,
      icon: CheckSquare,
      href: '/admin/tasks',
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Tags',
      count: stats?.tagsCount ?? 0,
      icon: Tags,
      href: '/admin/tags',
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              PRN232 Assignment 2
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              }`}
            >
              {isAdmin ? 'Admin Mode' : 'Staff Mode'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Management Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Welcome back, <strong className="text-gray-700 dark:text-zinc-300">{user?.fullName}</strong> ({user?.email}). Manage system entities with JWT authentication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
          >
            My Profile
          </Link>
          {isAdmin && (
            <Link
              href="/admin/accounts"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              Manage Accounts
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${card.bgColor} ${card.textColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-indigo-400">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{card.title}</p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {loadingStats ? (
                    <span className="inline-block w-8 h-8 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                  ) : (
                    card.count
                  )}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Manage {card.title} &rarr;
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operations Hub */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Management Modules</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Protected CRUD workflows</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/admin/departments"
              className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex items-center gap-3"
            >
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Departments</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Add, edit, remove depts</p>
              </div>
            </Link>

            <Link
              href="/admin/projects"
              className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex items-center gap-3"
            >
              <FolderKanban className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Projects</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Create &amp; schedule projects</p>
              </div>
            </Link>

            <Link
              href="/admin/tasks"
              className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex items-center gap-3"
            >
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Tasks</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Manage tasks &amp; tags</p>
              </div>
            </Link>

            <Link
              href="/admin/tags"
              className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex items-center gap-3"
            >
              <Tags className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Tags</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Category color markers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Administration Hub */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Security &amp; Access</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Role-based permission controls</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">User Accounts Control</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Admin-exclusive interface to list accounts, alter user roles, and purge obsolete profiles.
                </p>
              </div>
              {isAdmin ? (
                <Link
                  href="/admin/accounts"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors whitespace-nowrap"
                >
                  Manage Users
                </Link>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Admin Only
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Audit Trail Logging</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  CreatedByID &amp; UpdatedByID automatically recorded for all Task and Project operations.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
