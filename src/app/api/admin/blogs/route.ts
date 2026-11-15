import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { invalidateCache } from "@/lib/memoryCache";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status") || "PUBLISHED";

    const where: any = {};

    // ── PRIVACY ENFORCEMENT: Never query or return user DRAFTS ──
    if (statusParam === "ARCHIVED") {
      where.status = "ARCHIVED";
    } else if (statusParam === "ALL") {
      where.status = { in: ["PUBLISHED", "ARCHIVED"] };
    } else {
      where.status = "PUBLISHED";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { author: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, blogs] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImage: true,
          status: true,
          isFeatured: true,
          views: true,
          readingTime: true,
          publishedAt: true,
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
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: blogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Admin blogs GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve blogs" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const { id, isFeatured, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Article ID is required" }, { status: 400 });
    }

    const data: any = {};
    if (typeof isFeatured === "boolean") {
      data.isFeatured = isFeatured;
    }

    // Only allow setting status to PUBLISHED or ARCHIVED
    if (status === "PUBLISHED" || status === "ARCHIVED") {
      data.status = status;
      data.published = status === "PUBLISHED";
      if (status === "PUBLISHED") {
        data.publishedAt = new Date();
      }
    }

    const updated = await prisma.blog.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isFeatured: true,
      },
    });

    invalidateCache("blogs");

    return NextResponse.json({
      success: true,
      message: "Article updated successfully",
      blog: updated,
    });
  } catch (error: any) {
    console.error("Admin blog PATCH error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Article ID is required" }, { status: 400 });
    }

    await prisma.blog.delete({ where: { id } });

    invalidateCache("blogs");

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error: any) {
    console.error("Admin blog DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete article" },
      { status: 500 }
    );
  }
}
