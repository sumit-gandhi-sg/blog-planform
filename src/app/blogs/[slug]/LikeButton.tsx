"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface LikeButtonProps {
  blogId: string;
  initialLikes: number;
}

export function LikeButton({ blogId, initialLikes }: LikeButtonProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(`/api/blogs/${blogId}/like`)
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.hasLiked === "boolean") setHasLiked(data.hasLiked);
        })
        .catch(() => {});
    } else {
      setHasLiked(false);
    }
  }, [user, blogId]);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like this article.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setHasLiked(data.liked);
        setLikes(data.totalLikes);
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border",
        hasLiked
          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-200 dark:border-rose-900 shadow-sm"
          : "bg-white dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-rose-300 hover:text-rose-500"
      )}
      aria-label={hasLiked ? "Unlike article" : "Like article"}
    >
      <Heart
        size={16}
        className={cn(
          "transition-transform",
          hasLiked && "fill-rose-500 text-rose-500 scale-110",
          loading && "animate-pulse"
        )}
      />
      <span>{likes}</span>
    </button>
  );
}

export default LikeButton;
