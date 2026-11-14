"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Tag as TagIcon,
  Calendar,
  Clock,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { Blog, Tag, BlogsMeta } from "@/types";
import { cn, formatDate, getCardGradient } from "@/lib/utils";

function readingLabel(mins?: number | null) {
  if (!mins) return null;
  return `${mins} min read`;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200 dark:bg-white/[0.06]" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-white/[0.06]" />
          <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-white/[0.06]" />
        </div>
        <div className="h-5 w-3/4 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div className="flex justify-between mt-1">
          <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/[0.06]" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function BlogCard({ blog }: { blog: Blog }) {
  const gradient = getCardGradient(blog.id);

  return (
    <Link
      href={`/blogs/${blog.slug}`}
      prefetch={true}
      className="group rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] overflow-hidden flex flex-col no-underline text-inherit transition-all duration-300 hover:border-accent/50 hover:shadow-[0_8px_32px_rgba(124,58,237,0.12)] hover:-translate-y-0.5"
    >
      {blog.coverImage ? (
        <img
          src={blog.coverImage}
          alt={blog.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className={cn("h-44 w-full bg-gradient-to-br flex items-end p-4", gradient)}>
          {blog.isFeatured && (
            <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
              ✦ Featured
            </span>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col gap-2.5 flex-1">
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-[11px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <h2 className="m-0 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-accent transition-colors">
          {blog.title}
        </h2>

        {blog.summary && (
          <p className="m-0 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {blog.summary}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {(blog.author.name || blog.author.username || "A")[0].toUpperCase()}
            </div>
            <span>{blog.author.name || blog.author.username}</span>
          </div>
          <div className="flex items-center gap-3">
            {readingLabel(blog.readingTime) && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {readingLabel(blog.readingTime)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye size={11} />
              {blog.views}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(blog.publishedAt || blog.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

type SortOption = "createdAt" | "views";
const LIMIT = 9;

export default function BlogsFeedPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [meta, setMeta] = useState<BlogsMeta | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [selectedTags, debouncedSearch, sortBy]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setTags(json.data);
      })
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, []);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(LIMIT));
      params.set("sortBy", sortBy);
      params.set("order", "desc");
      if (selectedTags.length) params.set("tags", selectedTags.join(","));
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/blogs?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load blogs");
      setBlogs(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to load blogs.");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, selectedTags, debouncedSearch]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 px-4 text-center bg-white dark:bg-[#16171d]">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[80px] opacity-20 bg-[radial-gradient(circle,#aa3bff,#7c3aed)] pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-20 bg-[radial-gradient(circle,#38bdf8,#6366f1)] pointer-events-none"
        />

        <div className="relative mx-auto max-w-2xl animate-slide-up">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-accent mb-3">
            Inkwell Blog
          </p>
          <h1 className="m-0 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
            Stories worth reading
          </h1>
          <p className="m-0 text-base text-gray-500 dark:text-gray-400 mb-8">
            Discover articles, tutorials, and insights from our community of writers.
          </p>

          <div className="relative mx-auto max-w-lg">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="blogs-search"
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="border-y border-gray-200/80 dark:border-white/[0.07] bg-gray-50/50 dark:bg-white/[0.015] py-4 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium shrink-0">
            <TagIcon size={13} />
            Filter:
          </div>

          {tagsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-7 w-16 rounded-full bg-gray-200 dark:bg-white/[0.06] animate-pulse"
              />
            ))
          ) : (
            tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer",
                  selectedTags.includes(tag.name)
                    ? "bg-accent text-white border-accent shadow-[0_2px_8px_rgba(124,58,237,0.3)]"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent"
                )}
              >
                {tag.name}
              </button>
            ))
          )}

          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <X size={12} /> Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={13} className="text-gray-400" />
            {(["createdAt", "views"] as SortOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer",
                  sortBy === opt
                    ? "bg-accent text-white border-accent"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent"
                )}
              >
                {opt === "createdAt" ? "Latest" : "Popular"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Blog Grid ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {error && (
          <div className="text-center py-20 text-red-500 dark:text-red-400 text-sm">
            {error} —{" "}
            <button onClick={fetchBlogs} className="underline cursor-pointer">
              retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
              No articles found
            </h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filters to find what you are looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500 font-medium px-2">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
