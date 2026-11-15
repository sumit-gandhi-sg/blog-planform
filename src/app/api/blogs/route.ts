import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { calculateReadingTime, slugify } from "@/lib/utils";
import { invalidateCache } from "@/lib/memoryCache";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "9", 10)));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc";
    const tagsParam = searchParams.get("tags");
    const search = searchParams.get("q") || "";
    const readTimeParam = searchParams.get("readTime");
    const statusParam = searchParams.get("status");
    const currentUser = await getCurrentUser();

    const where: any = {};

    // Filter by published status for public feed
    if (statusParam === "ALL") {
      // For author my-blogs (must be handled by protected query or specific endpoint)
    } else {
      where.status = "PUBLISHED";
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } },
        { author: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (readTimeParam === "quick") {
      where.readingTime = { lte: 3 };
    } else if (readTimeParam === "medium") {
      where.readingTime = { gt: 3, lte: 7 };
    } else if (readTimeParam === "long") {
      where.readingTime = { gt: 7 };
    }

    if (tagsParam) {
      const tagList = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { some: { name: { in: tagList } } };
      }
    }

    let orderBy: any = {};
    if (sortBy === "likes") {
      orderBy = { likes: { _count: "desc" } };
    } else if (sortBy === "views" || sortBy === "title" || sortBy === "createdAt") {
      orderBy[sortBy] = order;
    } else {
      orderBy.createdAt = "desc";
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
          published: true,
          publishedAt: true,
          status: true,
          isFeatured: true,
          readingTime: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, username: true, name: true, email: true, avatarUrl: true } },
          tags: true,
          _count: { select: { likes: true } },
          bookmarks: currentUser
            ? {
                where: { userId: currentUser.id },
                select: { userId: true },
              }
            : false,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const items = blogs.map((b) => ({
      ...b,
      likesCount: b._count.likes,
      isBookmarked: currentUser ? ((b.bookmarks as any[])?.length > 0) : false,
    }));

    return NextResponse.json({
      success: true,
      message: "Blogs retrieved successfully",
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Get blogs error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve blogs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to publish articles" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content, summary, coverImage, tags = [], status = "DRAFT" } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 }
      );
    }

    const slug = slugify(title);
    const readingTime = calculateReadingTime(content);
    const isPublished = status === "PUBLISHED";

    // Handle tag connections
    let tagConnections: { id: string }[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      tagConnections = tags.map((id: string) => ({ id }));
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        summary: summary || null,
        coverImage: coverImage || null,
        slug,
        readingTime,
        status: isPublished ? "PUBLISHED" : "DRAFT",
        published: isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: user.id,
        tags: { connect: tagConnections },
      },
      include: {
        author: { select: { id: true, username: true, name: true, email: true, avatarUrl: true } },
        tags: true,
      },
    });

    invalidateCache("blogs");

    return NextResponse.json(
      {
        success: true,
        message: isPublished ? "Article published successfully!" : "Draft saved successfully!",
        blog,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create article" },
      { status: 500 }
    );
  }
}
