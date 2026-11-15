"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Eye,
  Heart,
  ExternalLink,
  Trash2,
  Archive,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { AdminBlogListItem } from "@/types";
import { formatDate, getCardGradient } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/contexts/ConfirmContext";

export default function AdminBlogsPage() {
  const { success, error: toastError, info } = useToast();
  const { confirm } = useConfirm();
  const [blogs, setBlogs] = useState<AdminBlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PUBLISHED" | "ARCHIVED" | "ALL">("PUBLISHED");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
      });
      if (search.trim()) {
        params.set("q", search.trim());
      }

      const res = await fetch(`/api/admin/blogs?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setBlogs(json.data);
        setTotalPages(json.meta.totalPages || 1);
        setTotal(json.meta.total || 0);
      } else {
        toastError(json.message || "Failed to retrieve articles");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, toastError]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleToggleFeature = async (id: string, current: boolean) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isFeatured: !current }),
      });
      if (res.ok) {
        setBlogs((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isFeatured: !current } : b))
        );
        success(!current ? "Article featured on homepage!" : "Article unfeatured.");
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to update feature status");
      }
    } catch {
      toastError("Error updating feature status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "PUBLISHED" | "ARCHIVED") => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        success(newStatus === "ARCHIVED" ? "Article archived and hidden from public feed." : "Article restored and published!");
        fetchBlogs();
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to change article status");
      }
    } catch {
      toastError("Error changing status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Delete Article Permanently",
      message: `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
      confirmText: "Delete Article",
      variant: "danger",
    });
    if (!ok) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/blogs?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        success("Article permanently deleted.");
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to delete article");
      }
    } catch {
      toastError("Error deleting article");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Article Moderation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage public visibility, featured stories, and content governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBlogs()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-accent transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Privacy Notice Banner ──────────────────────────────── */}
      <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
        <AlertCircle size={15} className="shrink-0" />
        <span>
          <strong>Privacy Guard Active:</strong> In accordance with user privacy standards, unpublished drafts are 100% private to authors and are never shown here.
        </span>
      </div>

      {/* ── Filter & Search Toolbar ────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.05] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("PUBLISHED");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "PUBLISHED"
                ? "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Published
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ARCHIVED");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "ARCHIVED"
                ? "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Archived / Hidden
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            All Public ({total})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, summary, or author…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* ── Articles Table ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.01] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-4 sm:px-6">Article</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Featured</th>
                <th className="py-3.5 px-4">Engagement</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-accent mb-2" />
                    Loading articles…
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    No articles found matching your criteria.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr
                    key={blog.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition"
                  >
                    {/* Title & Metadata */}
                    <td className="py-4 px-4 sm:px-6 max-w-xs">
                      <div className="flex items-start gap-3">
                        {blog.coverImage ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                            <Image
                              src={blog.coverImage}
                              alt={blog.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-br shrink-0 ${getCardGradient(
                              blog.id
                            )}`}
                          />
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {blog.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {formatDate(blog.createdAt)}
                            </span>
                            {blog.readingTime && (
                              <span>• {blog.readingTime}m read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(blog.author.name || blog.author.username || "A")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {blog.author.name || blog.author.username}
                          </p>
                          <p className="text-[10px] text-gray-400">@{blog.author.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {blog.status === "PUBLISHED" ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                          ARCHIVED
                        </span>
                      )}
                    </td>

                    {/* Feature Switch */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(blog.id, blog.isFeatured)}
                        disabled={actionLoadingId === blog.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                          blog.isFeatured
                            ? "bg-accent/15 text-accent border-accent/30 hover:bg-accent/25"
                            : "bg-transparent text-gray-400 border-gray-200 dark:border-white/10 hover:border-accent hover:text-accent"
                        }`}
                      >
                        {blog.isFeatured ? "✦ Featured" : "Feature"}
                      </button>
                    </td>

                    {/* Engagement */}
                    <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1" title="Views">
                          <Eye size={12} /> {blog.views}
                        </span>
                        <span className="flex items-center gap-1" title="Likes">
                          <Heart size={12} /> {blog._count?.likes || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/blogs/${blog.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-accent hover:border-accent transition"
                          title="Preview article"
                        >
                          <ExternalLink size={13} />
                        </Link>

                        {blog.status === "PUBLISHED" ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(blog.id, "ARCHIVED")}
                            disabled={actionLoadingId === blog.id}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition cursor-pointer"
                            title="Archive / Hide from public feed"
                          >
                            <Archive size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(blog.id, "PUBLISHED")}
                            disabled={actionLoadingId === blog.id}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition cursor-pointer"
                            title="Restore / Publish article"
                          >
                            <RefreshCw size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(blog.id, blog.title)}
                          disabled={actionLoadingId === blog.id}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                          title="Delete article"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
