"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather, PenLine, LogOut, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ui/ThemeToggle";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#16171d]/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
        {/* Brand */}
        <Link
          href="/blogs"
          prefetch={true}
          className="flex items-center gap-2.5 text-inherit no-underline"
        >
          <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.4)]">
            <Feather className="w-4 h-4 text-white stroke-[2.2px]" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-br from-accent to-accent-dark bg-clip-text text-transparent">
            Inkwell
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/write"
                prefetch={true}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:border-accent hover:text-accent no-underline"
              >
                <PenLine size={14} />
                Write
              </Link>

              <Link
                href="/my-blogs"
                prefetch={true}
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:border-accent hover:text-accent no-underline"
                title="My Articles"
              >
                <BookOpen size={14} />
                <span className="max-w-[100px] truncate">{user.username || user.email}</span>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium transition-all hover:border-accent hover:text-accent dark:border-white/10 dark:hover:border-accent cursor-pointer"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                prefetch={true}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium transition-all hover:border-accent hover:text-accent dark:border-white/10 dark:hover:border-accent no-underline text-inherit"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                prefetch={true}
                className="rounded-xl bg-gradient-to-br from-accent to-accent-dark px-3.5 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)] transition-all hover:opacity-90 no-underline"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
