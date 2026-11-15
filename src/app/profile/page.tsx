"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  History,
  Settings,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Camera,
  Save,
  Loader2,
  ExternalLink,
  Shield,
  User as UserIcon,
  Tag as TagIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { cn, formatDate, getCardGradient } from "@/lib/utils";
import type { BookmarkItem, ReadingHistoryItem } from "@/types";

type ProfileTab = "bookmarks" | "history" | "settings";

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>("bookmarks");

  // Sync tab from URL query if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "bookmarks" || tabParam === "history" || tabParam === "settings") {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Profile Settings Form State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync profile fields from auth user
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // Auth Redirect Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  // Fetch Bookmarks
  const fetchBookmarks = useCallback(async () => {
    setBookmarksLoading(true);
    try {
      const res = await fetch("/api/user/bookmarks");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setBookmarks(json.data);
      }
    } catch {
      toast.error("Failed to load bookmarks");
    } finally {
      setBookmarksLoading(false);
    }
  }, [toast]);

  // Fetch History
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/user/history");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setHistory(json.data);
      }
    } catch {
      toast.error("Failed to load reading history");
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  // Load Tab Data on Tab Switch
  useEffect(() => {
    if (!user) return;
    if (activeTab === "bookmarks") fetchBookmarks();
    if (activeTab === "history") fetchHistory();
  }, [activeTab, user, fetchBookmarks, fetchHistory]);

  // Handle Remove Bookmark
  const handleRemoveBookmark = async (blogId: string) => {
    try {
      const res = await fetch(`/api/blogs/${blogId}/bookmark`, { method: "POST" });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.blogId !== blogId));
        toast.success("Bookmark removed");
      }
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  // Handle Remove Single History Item
  const handleRemoveHistoryItem = async (historyId: string) => {
    try {
      const res = await fetch(`/api/user/history?id=${historyId}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== historyId));
        toast.success("Item removed from history");
      }
    } catch {
      toast.error("Failed to remove item");
    }
  };

  // Handle Clear All History
  const handleClearAllHistory = async () => {
    const ok = await confirm({
      title: "Clear Reading History",
      message: "Are you sure you want to clear your entire reading history? This cannot be undone.",
      confirmText: "Clear History",
      variant: "danger",
    });
    if (!ok) return;

    setClearingHistory(true);
    try {
      const res = await fetch("/api/user/history", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
        toast.success("Reading history cleared");
      }
    } catch {
      toast.error("Failed to clear reading history");
    } finally {
      setClearingHistory(false);
    }
  };

  // Handle Avatar Image Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size exceeds 5MB limit");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.url) {
        setAvatarUrl(json.url);
        toast.success("Avatar image uploaded!");
      } else {
        toast.error(json.message || "Failed to upload image");
      }
    } catch {
      toast.error("Network error uploading image");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Save Profile Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          bio: bio.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        await refreshUser();
        toast.success("Profile updated successfully!");
      } else {
        toast.error(json.message || "Failed to update profile");
      }
    } catch {
      toast.error("Network error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* ── Profile Header ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#16171d] py-12 px-4">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[80px] opacity-15 bg-[radial-gradient(circle,#7c3aed,#38bdf8)] pointer-events-none"
        />

        <div className="relative mx-auto max-w-4xl flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-accent/40 shadow-md">
                <Image
                  src={avatarUrl}
                  alt={user.name || user.username}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {(user.name || user.username || "U")[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => {
                setActiveTab("settings");
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-accent text-white shadow-md hover:bg-accent-dark transition cursor-pointer border-2 border-white dark:border-[#16171d]"
              title="Change avatar"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h1 className="m-0 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {user.name || user.username}
              </h1>
              {user.role === "ADMIN" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
                  <Shield size={11} /> Admin
                </span>
              )}
            </div>

            <p className="m-0 text-sm text-gray-400 mb-3">@{user.username} • {user.email}</p>

            {user.bio ? (
              <p className="m-0 text-sm text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed mb-4">
                {user.bio}
              </p>
            ) : (
              <p className="m-0 text-xs text-gray-400 italic mb-4">
                No bio added yet. Add a short bio in settings.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-accent" />
                <Link href="/my-blogs" className="hover:underline text-inherit no-underline">
                  My Articles
                </Link>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Bookmark size={13} className="text-amber-500" />
                <span>{bookmarks.length} Bookmarks</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <History size={13} className="text-blue-500" />
                <span>{history.length} History</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#16171d]/50 sticky top-[61px] z-30 backdrop-blur-md">
        <div className="mx-auto max-w-4xl flex items-center justify-start gap-1 px-4">
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={cn(
              "flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer bg-transparent",
              activeTab === "bookmarks"
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Bookmark size={16} />
            <span>Saved Bookmarks ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer bg-transparent",
              activeTab === "history"
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <History size={16} />
            <span>Reading History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer bg-transparent",
              activeTab === "settings"
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Settings size={16} />
            <span>Profile Settings</span>
          </button>
        </div>
      </div>

      {/* ── Tab Contents ──────────────────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* 1. Bookmarks Tab */}
        {activeTab === "bookmarks" && (
          <div>
            {bookmarksLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                <Loader2 size={22} className="animate-spin text-accent" />
                <span className="text-sm">Loading saved articles…</span>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8">
                <Bookmark size={36} className="mx-auto text-amber-500/50 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  No bookmarks saved yet
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
                  Save interesting technical deep-dives to read later by clicking the bookmark icon on any article.
                </p>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition no-underline shadow-sm"
                >
                  Explore articles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarks.map(({ id: bookmarkId, blog }) => (
                  <div
                    key={bookmarkId}
                    className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] overflow-hidden flex flex-col transition hover:border-accent/40 hover:shadow-md"
                  >
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="p-4 flex flex-col flex-1 no-underline text-inherit"
                    >
                      {blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {blog.tags.slice(0, 2).map((t) => (
                            <span
                              key={t.id}
                              className="text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-accent transition mb-2">
                        {blog.title}
                      </h3>

                      {blog.summary && (
                        <p className="m-0 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
                          {blog.summary}
                        </p>
                      )}

                      <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 dark:border-white/[0.05]">
                        <span>@{blog.author.username}</span>
                        {blog.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {blog.readingTime}m
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Quick remove action */}
                    <button
                      onClick={() => handleRemoveBookmark(blog.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer border-none bg-white/80 dark:bg-black/60 shadow-sm"
                      title="Remove bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Reading History Tab */}
        {activeTab === "history" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="m-0 text-xs text-gray-400">
                Articles you have read recently on this account
              </p>
              {history.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  disabled={clearingHistory}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition cursor-pointer border-none bg-transparent font-medium"
                >
                  {clearingHistory ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  <span>Clear All History</span>
                </button>
              )}
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                <Loader2 size={22} className="animate-spin text-accent" />
                <span className="text-sm">Loading reading history…</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8">
                <History size={36} className="mx-auto text-blue-500/50 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  No reading history yet
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
                  As you read technical articles and threat breakdowns, they will automatically be recorded here.
                </p>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition no-underline shadow-sm"
                >
                  Start reading
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map(({ id: historyId, blog, viewedAt }) => (
                  <div
                    key={historyId}
                    className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] transition hover:border-accent/40"
                  >
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="flex-1 min-w-0 no-underline text-inherit"
                    >
                      <h3 className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-accent transition mb-1">
                        {blog.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Read {timeAgo(viewedAt)}</span>
                        <span>•</span>
                        <span>by @{blog.author.username}</span>
                        {blog.readingTime && (
                          <>
                            <span>•</span>
                            <span>{blog.readingTime} min read</span>
                          </>
                        )}
                      </div>
                    </Link>

                    <button
                      onClick={() => handleRemoveHistoryItem(historyId)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer border-none bg-transparent"
                      title="Remove from history"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Profile Settings Tab */}
        {activeTab === "settings" && (
          <form
            onSubmit={handleSaveProfile}
            className="p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] flex flex-col gap-6"
          >
            <div>
              <h2 className="m-0 text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                Profile Customization
              </h2>
              <p className="m-0 text-xs text-gray-400">
                Update your public profile display name, avatar picture, and bio.
              </p>
            </div>

            {/* Avatar Uploader */}
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent/30 shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xl font-bold">
                    {(name || user.username || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-accent hover:text-accent transition cursor-pointer bg-white dark:bg-white/[0.04]"
                >
                  {uploadingAvatar ? (
                    <Loader2 size={13} className="animate-spin text-accent" />
                  ) : (
                    <Camera size={13} />
                  )}
                  <span>{uploadingAvatar ? "Uploading…" : "Upload Avatar Picture"}</span>
                </button>
                <span className="text-[11px] text-gray-400">JPG, PNG, WebP up to 5MB</span>
              </div>
            </div>

            {/* Display Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linus Torvalds"
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Short Bio
                </label>
                <span className="text-[11px] text-gray-400">{bio.length}/500</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about your engineering background, systems security focus, or research interests…"
                rows={4}
                maxLength={500}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none transition"
              />
            </div>

            {/* Read-Only Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
              <div>
                <label className="text-[11px] font-medium text-gray-400">Username</label>
                <p className="m-0 text-sm font-mono text-gray-600 dark:text-gray-400">
                  @{user.username}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-400">Account Email</label>
                <p className="m-0 text-sm font-mono text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition disabled:opacity-50 cursor-pointer border-none shadow-sm"
              >
                {savingProfile ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
