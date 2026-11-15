import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            coverImage: true,
            status: true,
            readingTime: true,
            views: true,
            createdAt: true,
            publishedAt: true,
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
            tags: true,
            _count: {
              select: { likes: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = bookmarks
      .filter((b) => b.blog && b.blog.status === "PUBLISHED")
      .map((b) => ({
        id: b.id,
        blogId: b.blogId,
        createdAt: b.createdAt.toISOString(),
        blog: {
          ...b.blog,
          likesCount: b.blog._count.likes,
          createdAt: b.blog.createdAt.toISOString(),
          publishedAt: b.blog.publishedAt ? b.blog.publishedAt.toISOString() : null,
        },
      }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET user bookmarks error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve bookmarks" },
      { status: 500 }
    );
  }
}
