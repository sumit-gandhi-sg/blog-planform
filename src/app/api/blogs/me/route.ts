import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const blogs = await prisma.blog.findMany({
      where: {
        authorId: user.id,
      },
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
    });

    const items = blogs.map((b) => ({
      ...b,
      likesCount: b._count.likes,
    }));

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch user articles" },
      { status: 500 }
    );
  }
}
