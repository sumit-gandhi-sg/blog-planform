"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FileText,
  Users,
  Tag as TagIcon,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/blogs", label: "Articles", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tags", label: "Tags", icon: TagIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/sign-in?redirect=/admin");
      } else if (user.role !== "ADMIN") {
        router.push("/blogs");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-sm">Verifying administrator credentials…</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Shield size={36} className="text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
        <p className="text-sm">You do not have permission to view the admin control panel.</p>
        <Link
          href="/blogs"
          className="mt-2 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Return to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/20">
      {/* ── Admin Sub-header ────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#16171d]/90 backdrop-blur-md sticky top-[61px] z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
              <Shield size={14} className="stroke-[2.5]" />
              Admin Portal
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">|</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              Logged in as <strong className="text-gray-700 dark:text-gray-200">@{user.username}</strong>
            </span>
          </div>

          {/* Navigation Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-underline whitespace-nowrap",
                    isActive
                      ? "bg-accent text-white shadow-sm font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

            <Link
              href="/blogs"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-accent no-underline transition"
              title="View Public Feed"
            >
              <ExternalLink size={13} />
              <span className="hidden md:inline">Public Feed</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
