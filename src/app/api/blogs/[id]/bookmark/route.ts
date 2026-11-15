import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ isBookmarked: false });
    }

    const { id: idOrSlug } = await params;
    const blog = await prisma.blog.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });

    if (!blog) {
      return NextResponse.json({ isBookmarked: false });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_blogId: {
          userId: user.id,
          blogId: blog.id,
        },
      },
    });

    return NextResponse.json({ isBookmarked: !!bookmark });
  } catch {
    return NextResponse.json({ isBookmarked: false });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to bookmark articles" },
        { status: 401 }
      );
    }

    const { id: idOrSlug } = await params;
    const blog = await prisma.blog.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_blogId: {
          userId: user.id,
          blogId: blog.id,
        },
      },
    });

    let isBookmarked = false;
    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      isBookmarked = false;
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          blogId: blog.id,
        },
      });
      isBookmarked = true;
    }

    return NextResponse.json({
      success: true,
      isBookmarked,
      message: isBookmarked ? "Article saved to bookmarks" : "Article removed from bookmarks",
    });
  } catch (error: any) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
