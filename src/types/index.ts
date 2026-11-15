// ── Shared Types for Next.js Blog Platform ────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
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
