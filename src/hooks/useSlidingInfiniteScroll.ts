"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseSlidingInfiniteScrollOptions<T> {
  initialItems: T[];
  initialTotal: number;
  limit: number;
  maxActivePages?: number; // Maximum number of page chunks kept in the DOM at once (e.g. 2 or 3)
  fetchPage: (page: number) => Promise<{ items: T[]; total: number }>;
  resetDeps: any[]; // Dependencies that reset the feed (e.g. search, filters, sorting)
}

export interface RenderedPage<T> {
  pageNumber: number;
  items: T[];
}

export function useSlidingInfiniteScroll<T extends { id: string | number }>({
  initialItems,
  initialTotal,
  limit,
  maxActivePages = 3,
  fetchPage,
  resetDeps,
}: UseSlidingInfiniteScrollOptions<T>) {
  // In-memory page cache (avoids any network trips when scrolling back up)
  const pageCache = useRef<Map<number, T[]>>(new Map());
  // Exact measured DOM heights for each page group in pixels
  const pageHeights = useRef<Map<number, number>>(new Map());

  // Active page numbers currently mounted in the DOM (e.g. [1], [1, 2], [2, 3])
  const [activePages, setActivePages] = useState<number[]>([1]);
  // Top spacer height in pixels to preserve scroll position when top pages are unmounted
  const [topSpacerHeight, setTopSpacerHeight] = useState<number>(0);

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
  const currentLowestPage = activePages.length > 0 ? Math.min(...activePages) : 1;
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
        pageHeights.current.clear();
        pageCache.current.set(1, result.items);

        setTotal(result.total);
        setActivePages([1]);
        setTopSpacerHeight(0);
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

  // ── Load Next Page (Scroll Down) ───────────────────────────────────────────
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
        const updated = [...prevPages, nextPage];

        // If active pages exceed maxActivePages, unmount the oldest top page
        if (updated.length > maxActivePages) {
          const removedPage = updated[0];
          // Use exact measured height or fallback to estimated height
          const removedHeight = pageHeights.current.get(removedPage) || 800;

          setTopSpacerHeight((prevHeight) => prevHeight + removedHeight);
          return updated.slice(1);
        }

        return updated;
      });
    } catch (err: any) {
      console.error("Error loading next page:", err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentHighestPage, hasMore, isLoading, isLoadingMore, maxActivePages, fetchPage]);

  // ── Load Previous Page (Scroll Up) ─────────────────────────────────────────
  const loadPrevPage = useCallback(async () => {
    if (isFetchingRef.current || isLoading || currentLowestPage <= 1) return;

    const prevPage = currentLowestPage - 1;
    isFetchingRef.current = true;

    try {
      let items = pageCache.current.get(prevPage);

      if (!items) {
        const result = await fetchPage(prevPage);
        items = result.items;
        pageCache.current.set(prevPage, items);
      }

      // Exact height to subtract from the top spacer
      const restoredHeight = pageHeights.current.get(prevPage) || 800;

      setActivePages((prevPages) => {
        const updated = [prevPage, ...prevPages];

        // Subtract the restored page height from the top spacer
        setTopSpacerHeight((prevHeight) => Math.max(0, prevHeight - restoredHeight));

        // If active pages exceed buffer, unmount bottom page to keep memory bounded
        if (updated.length > maxActivePages) {
          return updated.slice(0, -1);
        }

        return updated;
      });
    } catch (err: any) {
      console.error("Error restoring previous page:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentLowestPage, isLoading, maxActivePages, fetchPage]);

  // ── Bottom Sentinel (Triggers Next Page Fetch) ─────────────────────────────
  const bottomObserverRef = useRef<IntersectionObserver | null>(null);
  const bottomSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (bottomObserverRef.current) bottomObserverRef.current.disconnect();

      if (node) {
        bottomObserverRef.current = new IntersectionObserver(
          (entries) => {
            const first = entries[0];
            if (first && first.isIntersecting && hasMore && !isFetchingRef.current) {
              loadNextPage();
            }
          },
          {
            rootMargin: "400px 0px 400px 0px", // Pre-fetch 400px before bottom is reached
            threshold: 0,
          }
        );
        bottomObserverRef.current.observe(node);
      }
    },
    [hasMore, loadNextPage]
  );

  // ── Top Sentinel (Triggers Previous Page Mount) ────────────────────────────
  const topObserverRef = useRef<IntersectionObserver | null>(null);
  const topSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (topObserverRef.current) topObserverRef.current.disconnect();

      if (node && topSpacerHeight > 0) {
        topObserverRef.current = new IntersectionObserver(
          (entries) => {
            const first = entries[0];
            if (first && first.isIntersecting && currentLowestPage > 1 && !isFetchingRef.current) {
              loadPrevPage();
            }
          },
          {
            rootMargin: "300px 0px 0px 0px", // Pre-restore 300px before top boundary is hit
            threshold: 0,
          }
        );
        topObserverRef.current.observe(node);
      }
    },
    [topSpacerHeight, currentLowestPage, loadPrevPage]
  );

  // ── Measure Dynamic Height for a Page Group ────────────────────────────────
  const measurePageRef = useCallback(
    (pageNumber: number) => (node: HTMLElement | null) => {
      if (node) {
        const height = node.getBoundingClientRect().height;
        if (height > 0) {
          pageHeights.current.set(pageNumber, height);
        }
      }
    },
    []
  );

  // Compile the list of active pages and their items for rendering
  const renderedPages: RenderedPage<T>[] = activePages.map((pageNum) => ({
    pageNumber: pageNum,
    items: pageCache.current.get(pageNum) || [],
  }));

  const totalRenderedItems = renderedPages.reduce((acc, p) => acc + p.items.length, 0);

  return {
    renderedPages,
    activePages,
    topSpacerHeight,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    totalRenderedItems,
    error,
    bottomSentinelRef,
    topSentinelRef,
    measurePageRef,
    loadNextPage,
  };
}
