import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Eye, Tag as TagIcon } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { cn, formatDate, getCardGradient } from "@/lib/utils";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { LikeButton } from "./LikeButton";
import { ViewTracker } from "./ViewTracker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ── Dynamic SEO Metadata (Open Graph & Twitter Cards) ──────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!blog || blog.status !== "PUBLISHED") {
    return { title: "Article Not Found | Inkwell" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkwell.blog";
  const url = `${appUrl}/blogs/${blog.slug}`;
  const title = blog.title;
  const description = blog.summary || blog.title;
  const image = blog.coverImage || `${appUrl}/hero.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: (blog.publishedAt || blog.createdAt).toISOString(),
      authors: [blog.author.name || blog.author.username],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ── Main Page (Server Component) ──────────────────────────────
export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      tags: true,
      _count: { select: { likes: true } },
    },
  });

  if (!blog || blog.status !== "PUBLISHED") {
    notFound();
  }

  // Check if current user has liked
  const currentUser = await getCurrentUser();
  let hasLiked = false;
  if (currentUser) {
    const like = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId: currentUser.id,
          blogId: blog.id,
        },
      },
    });
    hasLiked = !!like;
  }

  const gradient = getCardGradient(blog.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkwell.blog";

  // Google Article Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.summary || blog.title,
    image: blog.coverImage ? [blog.coverImage] : undefined,
    datePublished: (blog.publishedAt || blog.createdAt).toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: blog.author.name || blog.author.username,
      url: `${appUrl}/author/${blog.author.username}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Inkwell",
      logo: {
        "@type": "ImageObject",
        url: `${appUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${appUrl}/blogs/${blog.slug}`,
    },
  };

  return (
    <article className="min-h-screen">
      <ViewTracker slug={blog.slug} />

      {/* JSON-LD Script for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Cover Banner ────────────────────────────────────────── */}
      {blog.coverImage ? (
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className={cn("h-56 sm:h-72 w-full bg-gradient-to-br", gradient)} />
      )}

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* ── Back Link ───────────────────────────────────────── */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors mb-8 no-underline"
        >
          <ArrowLeft size={15} /> Back to all articles
        </Link>

        {/* ── Tags ───────────────────────────────────────────── */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blogs?tags=${encodeURIComponent(tag.name)}`}
                className="text-xs font-semibold bg-accent/10 text-accent px-3 py-1 rounded-full no-underline hover:bg-accent/20 transition-colors"
              >
                <span className="flex items-center gap-1">
                  <TagIcon size={10} /> {tag.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Title ──────────────────────────────────────────── */}
        <h1 className="m-0 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-4">
          {blog.title}
        </h1>

        {/* ── Summary / Subtitle ─────────────────────────────── */}
        {blog.summary && (
          <p className="m-0 text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            {blog.summary}
          </p>
        )}

        {/* ── Meta row ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 py-5 border-y border-gray-200 dark:border-white/[0.07] mb-8">
          {/* Author */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(blog.author.name || blog.author.username || "A")[0].toUpperCase()}
            </div>
            <div>
              <p className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {blog.author.name || blog.author.username}
              </p>
              <p className="m-0 text-xs text-gray-400">@{blog.author.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {formatDate(blog.publishedAt || blog.createdAt)}
            </span>
            {blog.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {blog.readingTime} min read
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye size={13} />
              {blog.views.toLocaleString()} views
            </span>

            {/* Like Counter and Action */}
            <LikeButton
              blogId={blog.id}
              initialLikes={blog._count.likes}
              initialHasLiked={hasLiked}
            />
          </div>
        </div>

        {/* ── Sanitized Content (Safe from Stored XSS) ────────── */}
        <SafeHtml html={blog.content} />

        {/* ── Footer Navigation ──────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/[0.07] flex items-center justify-between">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline no-underline"
          >
            <ArrowLeft size={15} /> Back to feed
          </Link>

          <LikeButton
            blogId={blog.id}
            initialLikes={blog._count.likes}
            initialHasLiked={hasLiked}
          />
        </div>
      </div>
    </article>
  );
}
