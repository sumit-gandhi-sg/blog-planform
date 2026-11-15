"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Tag as TagIcon,
  Calendar,
  Clock,
  Eye,
  SlidersHorizontal,
  X,
  ArrowUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { Blog, Tag, BlogsMeta } from "@/types";
import { cn, formatDate, getCardGradient } from "@/lib/utils";
import { useSlidingInfiniteScroll } from "@/hooks/useSlidingInfiniteScroll";

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
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
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
const LIMIT = 6; // 6 cards per chunk (2 rows of 3)

interface BlogsFeedClientProps {
  initialBlogs: Blog[];
  initialMeta: BlogsMeta;
  initialTags: Tag[];
}

export default function BlogsFeedClient({
  initialBlogs,
  initialMeta,
  initialTags,
}: BlogsFeedClientProps) {
  const [tags] = useState<Tag[]>(initialTags);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Page fetching function passed to the infinite scroll hook
  const fetchPage = useCallback(
    async (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(LIMIT));
      params.set("sortBy", sortBy);
      params.set("order", "desc");
      if (selectedTags.length) params.set("tags", selectedTags.join(","));
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/blogs?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load blogs");
      return {
        items: (json.data ?? []) as Blog[],
        total: (json.meta?.total ?? 0) as number,
      };
    },
    [sortBy, selectedTags, debouncedSearch]
  );

  // Smooth Continuous Infinite Scroll
  const {
    renderedPages,
    activePages,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    totalRenderedItems,
    error,
    bottomSentinelRef,
  } = useSlidingInfiniteScroll<Blog>({
    initialItems: initialBlogs,
    initialTotal: initialMeta.total,
    limit: LIMIT,
    fetchPage,
    resetDeps: [selectedTags, debouncedSearch, sortBy],
  });

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showBackToTop = activePages.length > 1;

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
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-accent mb-3 flex items-center justify-center gap-1.5">
            <Sparkles size={14} /> Inkwell Tech Feed
          </p>
          <h1 className="m-0 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
            Stories worth reading
          </h1>
          <p className="m-0 text-base text-gray-500 dark:text-gray-400 mb-8">
            Discover articles, tutorials, and vulnerability disclosures from our engineering community.
          </p>

          <div className="relative mx-auto max-w-lg">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="blogs-search"
              type="text"
              placeholder="Search articles by title or topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Filters Bar ─────────────────────────────────────────────────── */}
      <div className="border-y border-gray-200/80 dark:border-white/[0.07] bg-gray-50/50 dark:bg-white/[0.015] py-4 px-4 sticky top-[61px] z-30 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium shrink-0">
            <TagIcon size={13} />
            Filter:
          </div>

          {tags.map((tag) => (
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
          ))}

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
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent"
                )}
              >
                {opt === "createdAt" ? "Latest" : "Popular"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Blog Grid Section ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 relative">
        {error && (
          <div className="text-center py-20 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : total === 0 ? (
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
          <div>
            {/* ── Continuous Rendered Page Chunks ── */}
            <div className="flex flex-col gap-6">
              {renderedPages.map(({ pageNumber, items }) => (
                <div
                  key={`page-group-${pageNumber}`}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {items.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
              ))}
            </div>

            {/* ── Bottom Sentinel: Senses scroll-down to fetch next chunk ── */}
            <div ref={bottomSentinelRef} className="h-10 w-full" aria-hidden="true" />

            {/* ── Loading Spinner for next chunk ── */}
            {isLoadingMore && (
              <div className="mt-8 flex flex-col items-center justify-center gap-2 text-gray-400 py-6">
                <Loader2 size={24} className="animate-spin text-accent" />
                <span className="text-xs font-medium">Loading more articles…</span>
              </div>
            )}

            {/* ── Feed End Status ── */}
            {!hasMore && total > 0 && !isLoadingMore && (
              <div className="mt-12 text-center py-8 border-t border-gray-100 dark:border-white/[0.05]">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  ✨ You have reached the end of the feed
                </p>
                <p className="text-xs text-gray-400">
                  Total {total} articles loaded ({totalRenderedItems} displayed)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Floating "Back to Top" Button ──────────────────────────────── */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-accent text-white shadow-lg hover:bg-accent-dark transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer border-none"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </section>
    </div>
  );
}
