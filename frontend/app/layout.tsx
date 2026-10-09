import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";

import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "TaskTrack - Team & Task Management App",
  description: "PRN232 Assignment 2 - Task & Team Management with JWT Authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-6 text-center text-xs text-slate-500 dark:text-zinc-500">
              PRN232 Assignment 2 &bull; TaskTrack &bull; ASP.NET Core &amp; Next.js
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
