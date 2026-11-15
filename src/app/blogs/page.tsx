import prisma from "@/lib/prisma";
import BlogsFeedClient from "./BlogsFeedClient";
import type { Blog, Tag } from "@/types";
import { withMemoryCache } from "@/lib/memoryCache";

export const revalidate = 60; // Incremental Static Regeneration: cached for 60 seconds

export default async function BlogsPage() {
  let initialBlogs: Blog[] = [];
  let total = 0;
  let tags: Tag[] = [];

  try {
    const cachedData = await withMemoryCache("blogs_initial_ssr", 30, async () => {
      const [blogs, count, fetchedTags] = await Promise.all([
        prisma.blog.findMany({
          where: { status: "PUBLISHED", published: true },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            coverImage: true,
            published: true,
            publishedAt: true,
            status: true,
            isFeatured: true,
            readingTime: true,
            views: true,
            createdAt: true,
            updatedAt: true,
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
          orderBy: { createdAt: "desc" },
          take: 9,
        }),
        prisma.blog.count({
          where: { status: "PUBLISHED", published: true },
        }),
        prisma.tag.findMany({
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        total: count,
        tags: fetchedTags,
        blogs: blogs.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          summary: b.summary,
          coverImage: b.coverImage,
          published: b.published,
          publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
          status: b.status,
          isFeatured: b.isFeatured,
          readingTime: b.readingTime,
          views: b.views,
          tags: b.tags,
          author: b.author,
          likesCount: b._count.likes,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        })),
      };
    });

    initialBlogs = cachedData.blogs;
    total = cachedData.total;
    tags = cachedData.tags;
  } catch (error) {
    console.warn("Failed to fetch blogs for SSR/ISR at build/runtime, falling back to client fetch:", error);
  }

  const initialMeta = {
    total,
    page: 1,
    limit: 9,
    totalPages: Math.ceil(total / 9) || 1,
  };

  return (
    <BlogsFeedClient
      initialBlogs={initialBlogs}
      initialMeta={initialMeta}
      initialTags={tags}
    />
  );
}
