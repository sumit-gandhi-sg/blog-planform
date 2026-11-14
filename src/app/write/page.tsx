"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, X, Tag as TagIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-2xl border border-gray-200 dark:border-white/[0.07] flex items-center justify-center text-sm text-gray-400 animate-pulse bg-gray-50/50 dark:bg-white/[0.01]">
        Loading writing canvas…
      </div>
    ),
  }
);
import type { Tag } from "@/types";
import { cn } from "@/lib/utils";

export default function WritePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // UI State
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?redirect=/write");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setTags(json.data);
      })
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, []);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setTags((prev) => [...prev, json.data]);
        setSelectedTagIds((prev) => [...prev, json.data.id]);
        setNewTagName("");
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCoverUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setCoverImage(json.url);
      } else {
        setError(json.message || "Failed to upload cover image.");
      }
    } catch {
      setError("Cover image upload failed. Please try again.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      setError("Please enter an article title.");
      return;
    }
    if (!content || content === "<p></p>") {
      setError("Please add content to your article.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || undefined,
          content,
          coverImage: coverImage || undefined,
          tags: selectedTagIds,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save article");

      if (status === "PUBLISHED" && data.blog?.slug) {
        router.push(`/blogs/${data.blog.slug}`);
      } else {
        router.push("/my-blogs");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-4xl">
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors no-underline"
          >
            <ArrowLeft size={16} /> Exit Editor
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSubmit("DRAFT")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium hover:border-accent hover:text-accent transition disabled:opacity-50 cursor-pointer"
            >
              <Save size={15} />
              Save Draft
            </button>

            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white text-sm font-semibold shadow-[0_4px_14px_rgba(124,58,237,0.4)] hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Publish
            </button>
          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Cover Image Section ──────────────────────────────── */}
        <div className="mb-6">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleCoverUpload}
          />

          {coverImage ? (
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden group border border-gray-200 dark:border-white/10">
              <img src={coverImage} alt="Cover preview" className="h-full w-full object-cover" />
              <button
                onClick={() => setCoverImage("")}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                title="Remove cover"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-accent/50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-accent transition cursor-pointer"
            >
              {coverUploading ? (
                <Loader2 size={22} className="animate-spin text-accent" />
              ) : (
                <>
                  <ImageIcon size={22} />
                  <span className="text-xs font-semibold">Add Cover Image</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Title & Summary ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            placeholder="Title of your article…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />

          <input
            type="text"
            placeholder="Add a brief subtitle or summary (optional)…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full text-lg bg-transparent border-none outline-none text-gray-500 dark:text-gray-400 placeholder:text-gray-400"
          />
        </div>

        {/* ── Tags Selector Bar ───────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTagPanel(!showTagPanel)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:border-accent hover:text-accent transition cursor-pointer"
          >
            <TagIcon size={12} />
            {selectedTagIds.length ? `${selectedTagIds.length} tags selected` : "Add tags"}
          </button>

          {selectedTagIds.map((id) => {
            const tag = tags.find((t) => t.id === id);
            if (!tag) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => toggleTag(id)}
                  className="hover:opacity-75 cursor-pointer border-none bg-transparent p-0 text-accent"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>

        {/* ── Tag Selection Drawer ────────────────────────────── */}
        {showTagPanel && (
          <div className="mb-6 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Select or create tags
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1 rounded-full border transition cursor-pointer",
                    selectedTagIds.includes(tag.id)
                      ? "bg-accent text-white border-accent"
                      : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent"
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                placeholder="New tag name…"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16171d] outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-accent text-white hover:opacity-90 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* ── TipTap Rich Text Editor ─────────────────────────── */}
        <RichTextEditor
          value={content}
          onChange={(html) => setContent(html)}
          placeholder="Tell your story…"
          minHeight="500px"
        />
      </div>
    </div>
  );
}
