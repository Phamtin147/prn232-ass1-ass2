'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CheckSquare, 
  Building2, 
  FolderKanban, 
  Tags, 
  Search, 
  Settings, 
  Menu, 
  X, 
  Layers,
  Users,
  User,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview', icon: Layers },
    { href: '/departments', label: 'Departments', icon: Building2 },
    { href: '/search', label: 'Search Tasks', icon: Search },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin Dashboard', icon: Settings },
    { href: '/admin/departments', label: 'Manage Departments', icon: Building2 },
    { href: '/admin/projects', label: 'Manage Projects', icon: FolderKanban },
    { href: '/admin/tasks', label: 'Manage Tasks', icon: CheckSquare },
    { href: '/admin/tags', label: 'Manage Tags', icon: Tags },
    ...(isAdmin ? [{ href: '/admin/accounts', label: 'Manage Accounts', icon: Users }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-indigo-600 dark:text-indigo-400">
              <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-gray-900 dark:text-white">TaskTrack</span>
            </Link>

            {/* Desktop Public Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action: Auth / Admin */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Admin Management Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAdminDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-200 transition-colors border border-gray-200 dark:border-zinc-800"
                  >
                    <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Management</span>
                    {isAdmin && (
                      <span className="ml-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </button>

                  {adminDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAdminDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                          Protected Management
                        </div>
                        {adminLinks.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setAdminDropdownOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors ${
                                isActive ? 'bg-indigo-50/70 text-indigo-600 font-medium' : ''
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Profile link */}
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    pathname === '/profile'
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                  title="Your Profile"
                >
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold max-w-[120px] truncate">{user?.fullName}</span>
                </Link>

                {/* Logout button */}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-zinc-800 px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-zinc-950">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                >
                  <Icon className="w-5 h-5 text-indigo-600" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-gray-200 dark:border-zinc-800 space-y-1">
              <div className="px-3 py-1 flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Logged in as: {user?.fullName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isAdmin ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isAdmin ? 'Admin' : 'Staff'}
                </span>
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
              >
                <User className="w-5 h-5 text-indigo-600" />
                Profile &amp; Password
              </Link>
              {adminLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                  >
                    <Icon className="w-5 h-5 text-indigo-600" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-center font-medium bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-zinc-200"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-center font-medium bg-indigo-600 text-white"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
