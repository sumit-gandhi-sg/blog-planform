"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Feather,
  PenLine,
  LogOut,
  BookOpen,
  Shield,
  Bookmark,
  History,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ui/ThemeToggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const initials = (user?.name || user?.username || "U")[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#16171d]/80 transition-colors">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 sm:py-3">
        {/* Left: Brand + Navigation links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/blogs"
            prefetch={true}
            className="flex items-center gap-2.5 text-inherit no-underline group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.35)] group-hover:scale-105 transition-transform">
              <Feather className="w-4 h-4 text-white stroke-[2.2px]" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-br from-accent to-accent-dark bg-clip-text text-transparent">
              Inkwell
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/blogs"
              prefetch={true}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline",
                pathname === "/blogs" || pathname === "/"
                  ? "text-accent bg-accent/10 font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              )}
            >
              Explore
            </Link>

            {user && (
              <Link
                href="/my-blogs"
                prefetch={true}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline",
                  pathname.startsWith("/my-blogs")
                    ? "text-accent bg-accent/10 font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                )}
              >
                My Stories
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Quick Badge (Desktop) */}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  prefetch={true}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/25 bg-purple-500/10 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20 no-underline"
                  title="Admin Control Panel"
                >
                  <Shield size={13} className="stroke-[2.2]" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Primary CTA: Write */}
              <Link
                href="/write"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-white text-xs sm:text-sm font-semibold shadow-[0_3px_12px_rgba(124,58,237,0.3)] hover:opacity-95 hover:shadow-[0_4px_16px_rgba(124,58,237,0.4)] active:scale-95 transition-all no-underline"
              >
                <PenLine size={14} className="stroke-[2.2]" />
                <span>Write</span>
              </Link>

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className={cn(
                    "flex items-center gap-1.5 p-1 rounded-full border transition-all cursor-pointer bg-transparent",
                    dropdownOpen
                      ? "border-accent ring-2 ring-accent/20"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                  )}
                  title="Account menu"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-accent to-accent-dark text-white text-xs font-bold shadow-sm">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-gray-400 dark:text-gray-500 transition-transform duration-200 hidden sm:block mr-0.5",
                      dropdownOpen && "rotate-180 text-accent"
                    )}
                  />
                </button>

                {/* Dropdown Menu Flyout */}
                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#1a1b24] border border-gray-200 dark:border-white/10 shadow-2xl p-2 z-50 transition-all origin-top-right focus:outline-none"
                  >
                    {/* User Identity Header */}
                    <div className="p-3 mb-1 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-accent to-accent-dark text-white text-xs font-bold">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name || user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.name || user.username}
                          </p>
                          <p className="m-0 text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
                            user.role === "ADMIN"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                          )}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/write"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors no-underline"
                      >
                        <PenLine size={15} className="text-accent" />
                        <span>Write a Story</span>
                      </Link>

                      <Link
                        href="/my-blogs"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors no-underline"
                      >
                        <BookOpen size={15} className="text-gray-400 dark:text-gray-500" />
                        <span>My Stories</span>
                      </Link>

                      <Link
                        href="/profile?tab=bookmarks"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors no-underline"
                      >
                        <Bookmark size={15} className="text-amber-500" />
                        <span>Saved Bookmarks</span>
                      </Link>

                      <Link
                        href="/profile?tab=history"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors no-underline"
                      >
                        <History size={15} className="text-blue-500" />
                        <span>Reading History</span>
                      </Link>

                      <Link
                        href="/profile?tab=settings"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors no-underline"
                      >
                        <Settings size={15} className="text-gray-400 dark:text-gray-500" />
                        <span>Profile & Settings</span>
                      </Link>
                    </div>

                    {/* Admin Link (if ADMIN) */}
                    {user.role === "ADMIN" && (
                      <div className="pt-1 border-t border-gray-100 dark:border-white/[0.06]">
                        <Link
                          href="/admin"
                          prefetch={true}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors no-underline"
                        >
                          <Shield size={15} />
                          <span>Admin Control Panel</span>
                        </Link>
                      </div>
                    )}

                    {/* Sign Out Button */}
                    <div className="pt-1 mt-1 border-t border-gray-100 dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <LogOut size={15} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                prefetch={true}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-accent transition-colors no-underline"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                prefetch={true}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-sm font-semibold text-white shadow-[0_2px_10px_rgba(124,58,237,0.3)] hover:opacity-95 active:scale-95 transition-all no-underline"
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