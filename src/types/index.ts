// ── Shared Types for Next.js Blog Platform ────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  role: "USER" | "ADMIN" | string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface BlogAuthor {
  id: string;
  username: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
}

export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Blog {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content?: string;
  coverImage?: string | null;
  published: boolean;
  publishedAt?: string | null;
  status: BlogStatus;
  isFeatured: boolean;
  readingTime?: number | null;
  views: number;
  tags: Tag[];
  author: BlogAuthor;
  likesCount?: number;
  hasLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogsResponse {
  success: boolean;
  message: string;
  data: Blog[];
  meta: BlogsMeta;
}

// ── Comment Types ──────────────────────────────────────────────

export interface CommentAuthor {
  id: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface CommentItem {
  id: string;
  content: string;
  blogId: string;
  authorId: string;
  author: CommentAuthor;
  parentId?: string | null;
  replies?: CommentItem[];
  likesCount: number;
  hasLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Bookmark & Reading History Types ───────────────────────────

export interface BookmarkItem {
  id: string;
  blogId: string;
  blog: Blog;
  createdAt: string;
}

export interface ReadingHistoryItem {
  id: string;
  blogId: string;
  blog: Blog;
  viewedAt: string;
}

// ── Admin System Types ─────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalPublishedBlogs: number;
  totalArchivedBlogs: number;
  totalDraftsCount: number; // Anonymous count only
  totalViews: number;
  totalLikes: number;
  totalTags: number;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  _count: {
    blogs: number;
  };
}

export interface AdminBlogListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverImage?: string | null;
  status: "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  views: number;
  readingTime?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  tags: Tag[];
  _count: {
    likes: number;
  };
}

export interface AdminTagListItem {
  id: string;
  name: string;
  _count: {
    blogs: number;
  };
}
