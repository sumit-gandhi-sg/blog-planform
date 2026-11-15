"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseSlidingInfiniteScrollOptions<T> {
  initialItems: T[];
  initialTotal: number;
  limit: number;
  fetchPage: (page: number) => Promise<{ items: T[]; total: number }>;
  resetDeps: any[]; // Dependencies that reset the feed (search, tags, sorting)
}

export interface RenderedPage<T> {
  pageNumber: number;
  items: T[];
}

export function useSlidingInfiniteScroll<T extends { id: string | number }>({
  initialItems,
  initialTotal,
  limit,
  fetchPage,
  resetDeps,
}: UseSlidingInfiniteScrollOptions<T>) {
  // In-memory page cache so already loaded pages are never refetched
  const pageCache = useRef<Map<number, T[]>>(new Map());

  // Active loaded page numbers (e.g. [1], [1, 2], [1, 2, 3])
  const [activePages, setActivePages] = useState<number[]>([1]);
  const [total, setTotal] = useState<number>(initialTotal);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef(true);
  const isFetchingRef = useRef(false);

  // Initialize cache with server-rendered initial items on mount
  if (pageCache.current.size === 0 && initialItems.length > 0) {
    pageCache.current.set(1, initialItems);
  }

  const maxPage = Math.max(1, Math.ceil(total / limit));
  const currentHighestPage = activePages.length > 0 ? Math.max(...activePages) : 1;
  const hasMore = currentHighestPage < maxPage;

  // ── Reset feed when search, filters, or sort change ──────────────────────────
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let isCancelled = false;
    async function handleReset() {
      setIsLoading(true);
      setError(null);
      isFetchingRef.current = true;

      try {
        const result = await fetchPage(1);
        if (isCancelled) return;

        pageCache.current.clear();
        pageCache.current.set(1, result.items);

        setTotal(result.total);
        setActivePages([1]);
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to load articles");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      }
    }

    handleReset();

    return () => {
      isCancelled = true;
    };
  }, resetDeps); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load Next Page (Smooth Continuous Scroll Down) ─────────────────────────
  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current || isLoadingMore || isLoading || !hasMore) return;

    const nextPage = currentHighestPage + 1;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      let items = pageCache.current.get(nextPage);

      if (!items) {
        const result = await fetchPage(nextPage);
        items = result.items;
        pageCache.current.set(nextPage, items);
        setTotal(result.total);
      }

      setActivePages((prevPages) => {
        if (prevPages.includes(nextPage)) return prevPages;
        return [...prevPages, nextPage];
      });
    } catch (err: any) {
      console.error("Error loading next page:", err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentHighestPage, hasMore, isLoading, isLoadingMore, fetchPage]);

  // ── Bottom Sentinel (Triggers Next Page Fetch When Approaching Bottom) ─────
  const bottomObserverRef = useRef<IntersectionObserver | null>(null);
  const bottomSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (bottomObserverRef.current) {
        bottomObserverRef.current.disconnect();
      }

      if (node && hasMore) {
        bottomObserverRef.current = new IntersectionObserver(
          (entries) => {
            const first = entries[0];
            if (first && first.isIntersecting && !isFetchingRef.current) {
              loadNextPage();
            }
          },
          {
            rootMargin: "300px 0px 300px 0px", // Trigger 300px before reaching bottom
            threshold: 0,
          }
        );
        bottomObserverRef.current.observe(node);
      }
    },
    [hasMore, loadNextPage]
  );

  // Compile active pages and their items for rendering
  const renderedPages: RenderedPage<T>[] = activePages.map((pageNum) => ({
    pageNumber: pageNum,
    items: pageCache.current.get(pageNum) || [],
  }));

  const totalRenderedItems = renderedPages.reduce((acc, p) => acc + p.items.length, 0);

  return {
    renderedPages,
    activePages,
    topSpacerHeight: 0,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    totalRenderedItems,
    error,
    bottomSentinelRef,
    topSentinelRef: () => {},
    measurePageRef: () => () => {},
    loadNextPage,
  };
}
