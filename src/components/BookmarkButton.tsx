"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface BookmarkButtonProps {
  blogId: string;
  initialBookmarked?: boolean;
  className?: string;
  size?: number;
  showText?: boolean;
}

export function BookmarkButton({
  blogId,
  initialBookmarked = false,
  className,
  size = 16,
  showText = false,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !initialBookmarked) {
      fetch(`/api/blogs/${blogId}/bookmark`)
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.isBookmarked === "boolean") {
            setIsBookmarked(data.isBookmarked);
          }
        })
        .catch(() => {});
    }
  }, [user, blogId, initialBookmarked]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to bookmark articles.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsBookmarked(data.isBookmarked);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to update bookmark");
      }
    } catch {
      toast.error("Network error updating bookmark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={loading}
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark article"}
      className={cn(
        "inline-flex items-center gap-1.5 transition-all cursor-pointer border rounded-xl",
        showText
          ? cn(
              "px-3.5 py-2 text-sm font-semibold",
              isBookmarked
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-200 dark:border-amber-900 shadow-sm"
                : "bg-white dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-amber-300 hover:text-amber-500"
            )
          : cn(
              "p-2 rounded-xl",
              isBookmarked
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-white/80 dark:bg-black/40 text-gray-400 hover:text-amber-500 border-gray-200 dark:border-white/10"
            ),
        className
      )}
    >
      <Bookmark
        size={size}
        className={cn(
          "transition-transform",
          isBookmarked && "fill-amber-500 text-amber-500 scale-110",
          loading && "animate-pulse"
        )}
      />
      {showText && <span>{isBookmarked ? "Saved" : "Save"}</span>}
    </button>
  );
}

export default BookmarkButton;
