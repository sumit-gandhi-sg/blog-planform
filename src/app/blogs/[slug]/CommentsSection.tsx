"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Heart, CornerDownRight, Trash2, Send, Loader2 } from "lucide-react";
import type { CommentItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CommentCardProps {
  comment: CommentItem;
  blogId: string;
  onReplySuccess: (parentId: string, reply: CommentItem) => void;
  onDeleteSuccess: (commentId: string, parentId?: string | null) => void;
  isReply?: boolean;
}

function CommentCard({
  comment,
  blogId,
  onReplySuccess,
  onDeleteSuccess,
  isReply = false,
}: CommentCardProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [hasLiked, setHasLiked] = useState(comment.hasLiked || false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?.id === comment.authorId;
  const isAdmin = user?.role === "ADMIN";
  const canDelete = isAuthor || isAdmin;

  const handleToggleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like comments.");
      return;
    }

    setLikeLoading(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setHasLiked(data.liked);
        setLikesCount(data.totalLikes);
      } else {
        toast.error(data.message || "Failed to update like");
      }
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to reply.");
      return;
    }

    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: comment.parentId || comment.id, // Nest under top-level parent
        }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        onReplySuccess(comment.parentId || comment.id, data.comment);
        setReplyContent("");
        setIsReplying(false);
        toast.success("Reply posted!");
      } else {
        toast.error(data.message || "Failed to post reply");
      }
    } catch {
      toast.error("Network error posting reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleteSuccess(comment.id, comment.parentId);
        toast.success("Comment deleted");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete comment");
      }
    } catch {
      toast.error("Network error deleting comment");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("group flex flex-col gap-2 rounded-2xl p-4 transition-all", isReply ? "bg-gray-50/70 dark:bg-white/[0.02]" : "bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(comment.author.name || comment.author.username || "A")[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {comment.author.name || comment.author.username}
              </span>
              <span className="text-xs text-gray-400">@{comment.author.username}</span>
            </div>
            <span className="text-[11px] text-gray-400">{timeAgo(comment.createdAt)}</span>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer border-none bg-transparent"
            title="Delete comment"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>

      {/* Content */}
      <p className="m-0 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-10">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pl-10 pt-1 text-xs text-gray-500">
        <button
          onClick={handleToggleLike}
          disabled={likeLoading}
          className={cn(
            "flex items-center gap-1.5 font-medium transition-colors cursor-pointer border-none bg-transparent p-0",
            hasLiked ? "text-rose-500 font-semibold" : "hover:text-rose-500 text-gray-400"
          )}
        >
          <Heart size={13} className={cn("transition-transform", hasLiked && "fill-rose-500 text-rose-500 scale-110")} />
          <span>{likesCount}</span>
        </button>

        {!isReply && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-accent transition-colors cursor-pointer border-none bg-transparent p-0"
          >
            <CornerDownRight size={13} />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <form onSubmit={handlePostReply} className="mt-3 pl-10 flex flex-col gap-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Reply to @${comment.author.username}…`}
            rows={2}
            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none transition"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer bg-transparent border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReply || !replyContent.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition disabled:opacity-40 cursor-pointer border-none"
            >
              {submittingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
              <span>Reply</span>
            </button>
          </div>
        </form>
      )}

      {/* Render Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 pl-6 sm:pl-10 flex flex-col gap-2 border-l-2 border-gray-100 dark:border-white/[0.05] ml-4 sm:ml-5">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              blogId={blogId}
              onReplySuccess={onReplySuccess}
              onDeleteSuccess={onDeleteSuccess}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ blogId }: { blogId: string }) {
  const { user } = useAuth();
  const toast = useToast();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setComments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to post a comment.");
      return;
    }

    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setNewContent("");
        toast.success("Comment posted!");
      } else {
        toast.error(data.message || "Failed to post comment");
      }
    } catch {
      toast.error("Network error posting comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySuccess = (parentId: string, reply: CommentItem) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), reply],
          };
        }
        return c;
      })
    );
  };

  const handleDeleteSuccess = (commentId: string, parentId?: string | null) => {
    if (parentId) {
      // Deleted a nested reply
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== commentId),
            };
          }
          return c;
        })
      );
    } else {
      // Deleted a top-level comment
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <section className="mt-16 pt-10 border-t border-gray-200 dark:border-white/[0.07]">
      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="m-0 text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
          <MessageSquare size={20} className="text-accent" />
          <span>Discussion ({totalCount})</span>
        </h2>
      </div>

      {/* Top Comment Input */}
      {user ? (
        <form onSubmit={handlePostTopComment} className="mb-8 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user.name || user.username || "U")[0].toUpperCase()}
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What are your thoughts on this architecture or analysis?"
              rows={3}
              className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none transition"
            />
          </div>
          <div className="flex justify-end pl-12">
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition disabled:opacity-40 cursor-pointer border-none shadow-sm"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
              <span>Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 text-center bg-gray-50/50 dark:bg-white/[0.02]">
          <p className="m-0 text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sign in to join the conversation and share insights with the community.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition no-underline shadow-sm"
          >
            Sign in to comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 size={20} className="animate-spin text-accent" />
          <span className="text-sm">Loading discussion…</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm">No comments yet. Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              blogId={blogId}
              onReplySuccess={handleReplySuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default CommentsSection;
