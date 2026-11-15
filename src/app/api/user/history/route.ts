import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.readingHistory.findMany({
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
      orderBy: { viewedAt: "desc" },
      take: 50,
    });

    const formatted = history
      .filter((h) => h.blog && h.blog.status === "PUBLISHED")
      .map((h) => ({
        id: h.id,
        blogId: h.blogId,
        viewedAt: h.viewedAt.toISOString(),
        blog: {
          ...h.blog,
          likesCount: h.blog._count.likes,
          createdAt: h.blog.createdAt.toISOString(),
          publishedAt: h.blog.publishedAt ? h.blog.publishedAt.toISOString() : null,
        },
      }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET user history error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const historyId = searchParams.get("id");

    if (historyId) {
      // Delete single history entry
      await prisma.readingHistory.deleteMany({
        where: { id: historyId, userId: user.id },
      });
      return NextResponse.json({ success: true, message: "Entry removed from history" });
    }

    // Clear all history for current user
    await prisma.readingHistory.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Reading history cleared" });
  } catch (error: any) {
    console.error("DELETE user history error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to clear history" },
      { status: 500 }
    );
  }
}
