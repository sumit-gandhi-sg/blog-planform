import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { calculateReadingTime } from "@/lib/utils";
import { invalidateCache } from "@/lib/memoryCache";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.blog.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Article not found" }, { status: 404 });
    }

    // Author Ownership Check (IDOR protection)
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to edit this article" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, summary, coverImage, tags, status } = body;

    const data: any = {};
    if (title) data.title = title;
    if (summary !== undefined) data.summary = summary;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (content) {
      data.content = content;
      data.readingTime = calculateReadingTime(content);
    }

    if (status) {
      data.status = status;
      data.published = status === "PUBLISHED";
      if (status === "PUBLISHED" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    if (Array.isArray(tags)) {
      data.tags = {
        set: [], // clear existing
        connect: tags.map((tId: string) => ({ id: tId })),
      };
    }

    const updated = await prisma.blog.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, username: true, name: true, email: true, avatarUrl: true } },
        tags: true,
      },
    });

    invalidateCache("blogs");

    // Instantly purge Vercel CDN cache for this article and the feed
    try {
      revalidatePath(`/blogs/${updated.slug}`);
      if (existing.slug !== updated.slug) {
        revalidatePath(`/blogs/${existing.slug}`);
      }
      revalidatePath("/blogs");
      revalidatePath("/");
    } catch (e) {
      console.warn("revalidatePath error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Article updated successfully",
      blog: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Article not found" }, { status: 404 });
    }

    // Author Ownership Check
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to delete this article" },
        { status: 403 }
      );
    }

    await prisma.blog.delete({ where: { id } });

    invalidateCache("blogs");

    // Instantly purge Vercel CDN cache for the deleted article and the feed
    try {
      revalidatePath(`/blogs/${existing.slug}`);
      revalidatePath("/blogs");
      revalidatePath("/");
    } catch (e) {
      console.warn("revalidatePath error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete article" },
      { status: 500 }
    );
  }
}
