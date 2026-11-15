"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, PenLine, Trash2, ExternalLink, Calendar, Eye, Heart, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Blog } from "@/types";
import { formatDate } from "@/lib/utils";

export default function MyBlogsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?redirect=/my-blogs");
    }
  }, [user, authLoading, router]);

  const loadMyBlogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/blogs/me");
      const json = await res.json();
      if (res.ok && json.data) {
        setBlogs(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMyBlogs();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        success("Article deleted successfully");
      } else {
        toastError("Failed to delete article");
      }
    } catch {
      toastError("Error deleting article");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-gray-400">
        Loading articles…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Articles
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your drafts, publications, and readership statistics.
          </p>
        </div>

        <Link
          href="/write"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white font-semibold text-sm shadow-[0_4px_14px_rgba(124,58,237,0.4)] hover:opacity-90 no-underline transition"
        >
          <Plus size={16} /> New Article
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <BookOpen size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            No articles yet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            You haven't written any articles yet. Start sharing your ideas!
          </p>
          <Link
            href="/write"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold no-underline"
          >
            <PenLine size={14} /> Write your first article
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      blog.status === "PUBLISHED"
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {blog.status}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(blog.publishedAt || blog.createdAt)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {blog.title}
                </h3>

                {blog.summary && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                    {blog.summary}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {blog.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {blog.likesCount || 0} likes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {blog.status === "PUBLISHED" && (
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-accent hover:border-accent transition"
                    title="View Public Post"
                  >
                    <ExternalLink size={16} />
                  </Link>
                )}

                <button
                  onClick={() => handleDelete(blog.id)}
                  disabled={deletingId === blog.id}
                  className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-red-500 hover:border-red-300 transition cursor-pointer"
                  title="Delete Post"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
