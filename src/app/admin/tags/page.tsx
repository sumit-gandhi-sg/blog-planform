"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tag as TagIcon,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { AdminTagListItem } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/contexts/ConfirmContext";

export default function AdminTagsPage() {
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();
  const [tags, setTags] = useState<AdminTagListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tags");
      const json = await res.json();
      if (res.ok && json.success) {
        setTags(json.data);
      } else {
        toastError(json.message || "Failed to fetch tags");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNewTagName("");
        success(`Tag "${json.data?.name || newTagName}" created successfully!`);
        fetchTags();
      } else {
        toastError(json.message || "Failed to create tag");
      }
    } catch {
      toastError("Error creating tag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string, blogCount: number) => {
    const warning =
      blogCount > 0
        ? `"${name}" is currently attached to ${blogCount} article(s). Deleting it will detach it from all articles.`
        : `Are you sure you want to permanently delete the tag "${name}"?`;

    const ok = await confirm({
      title: "Delete Tag",
      message: warning,
      confirmText: "Delete Tag",
      variant: blogCount > 0 ? "warning" : "danger",
    });
    if (!ok) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/tags?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== id));
        success(`Tag "${name}" deleted.`);
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to delete tag");
      }
    } catch {
      toastError("Error deleting tag");
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
            Tag & Taxonomy Governance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize platform topics, curate tags, and review article distribution.
          </p>
        </div>

        <button
          onClick={() => fetchTags()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-accent transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Create New Tag Form ────────────────────────────────── */}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
          Create New Official Tag
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Add official categories for writers to discover when composing articles.
        </p>

        <form onSubmit={handleCreateTag} className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="e.g. Next.js, Cloud, DevOps…"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            disabled={submitting}
            className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={submitting || !newTagName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Add Tag
          </button>
        </form>
      </div>

      {/* ── Tag Grid ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          Existing Tags ({tags.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <Loader2 size={24} className="animate-spin mx-auto text-accent mb-2" />
            Loading tags…
          </div>
        ) : tags.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No tags found. Add one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="p-3 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                    <TagIcon size={12} className="text-accent shrink-0" />
                    <span className="truncate">{tag.name}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-1">
                    <FileText size={10} /> {tag._count.blogs} article{tag._count.blogs !== 1 ? "s" : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id, tag.name, tag._count.blogs)}
                  disabled={actionLoadingId === tag.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                  title="Delete tag"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
