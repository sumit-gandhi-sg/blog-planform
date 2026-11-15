"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  Eye,
  Heart,
  TrendingUp,
  Tag as TagIcon,
  ArrowUpRight,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { AdminStats } from "@/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

interface DashboardData {
  stats: AdminStats;
  recentBlogs: any[];
  recentUsers: any[];
}

export default function AdminOverviewPage() {
  const { success, error: toastError } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load admin statistics");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleFeature = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isFeatured: !current }),
      });
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentBlogs: prev.recentBlogs.map((b) =>
              b.id === id ? { ...b, isFeatured: !current } : b
            ),
          };
        });
        success(!current ? "Article featured on homepage!" : "Article unfeatured.");
      } else {
        toastError("Failed to update feature status");
      }
    } catch (err) {
      toastError("Failed to update feature status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-sm">Aggregating platform metrics…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
        <p className="font-semibold">{error || "Failed to load dashboard data"}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, recentBlogs, recentUsers } = data;

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Platform Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Real-time metrics, active readership, and content moderation snapshot.
        </p>
      </div>

      {/* ── KPI Metric Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Community
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalUsers.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {stats.verifiedUsers} verified
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Registered writers & contributors
          </p>
        </div>

        {/* Published Articles */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Published Articles
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalPublishedBlogs.toLocaleString()}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              +{stats.totalDraftsCount} drafts in progress
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Live on the public reading feed
          </p>
        </div>

        {/* Total Views */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Readership
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalViews.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp size={12} /> reads
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Global article page views
          </p>
        </div>

        {/* Community Likes */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Reactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <Heart size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalLikes.toLocaleString()}
            </span>
            <span className="text-xs text-pink-500 font-medium">
              likes
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Reader engagement & applause
          </p>
        </div>
      </div>

      {/* ── Two-Column Data Section ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Public Articles (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Recently Published Articles
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Privacy protected: User drafts remain private to authors.
              </p>
            </div>
            <Link
              href="/admin/blogs"
              className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 no-underline"
            >
              Manage all <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {recentBlogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No public articles yet.</div>
            ) : (
              recentBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        {blog.status}
                      </span>
                      {blog.isFeatured && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent flex items-center gap-0.5">
                          ✦ Featured
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        by @{blog.author?.username || "writer"}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {blog.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={11} /> {blog._count?.likes || 0}
                      </span>
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(blog.id, blog.isFeatured)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        blog.isFeatured
                          ? "border-accent/30 text-accent bg-accent/5 hover:bg-accent/10"
                          : "border-gray-200 dark:border-white/10 text-gray-500 hover:text-accent"
                      }`}
                      title={blog.isFeatured ? "Remove from Hero" : "Feature on Hero"}
                    >
                      {blog.isFeatured ? "Featured ✦" : "Feature"}
                    </button>

                    <Link
                      href={`/blogs/${blog.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-accent hover:border-accent transition"
                      title="View on site"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Joined Users (1 Col) */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              New Members
            </h2>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 no-underline"
            >
              All users <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/[0.05] flex-1">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No users found.</div>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(u.name || u.username || "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {u.name || u.username}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {u.role === "ADMIN" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                        USER
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
