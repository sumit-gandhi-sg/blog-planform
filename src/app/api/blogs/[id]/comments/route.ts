import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    const currentUser = await getCurrentUser();

    // Support both blog UUID and blog slug
    const blog = await prisma.blog.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        blogId: blog.id,
        parentId: null, // Top-level comments only
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
        likes: currentUser
          ? {
              where: { userId: currentUser.id },
              select: { userId: true },
            }
          : false,
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: { likes: true },
            },
            likes: currentUser
              ? {
                  where: { userId: currentUser.id },
                  select: { userId: true },
                }
              : false,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      blogId: c.blogId,
      authorId: c.authorId,
      author: c.author,
      parentId: c.parentId,
      likesCount: c._count.likes,
      hasLiked: currentUser ? (c.likes as any[])?.length > 0 : false,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        blogId: r.blogId,
        authorId: r.authorId,
        author: r.author,
        parentId: r.parentId,
        likesCount: r._count.likes,
        hasLiked: currentUser ? (r.likes as any[])?.length > 0 : false,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET comments error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve comments" },
      { status: 500 }
    );
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
        { success: false, message: "Authentication required to post comments" },
        { status: 401 }
      );
    }

    const { id: idOrSlug } = await params;
    const blog = await prisma.blog.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, status: true },
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, parentId } = body;

    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!trimmed) {
      return NextResponse.json({ success: false, message: "Comment cannot be empty" }, { status: 400 });
    }

    if (trimmed.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Comment exceeds maximum length of 2,000 characters" },
        { status: 400 }
      );
    }

    // If this is a reply to an existing comment, ensure parent exists on the same blog
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, blogId: true },
      });

      if (!parentComment || parentComment.blogId !== blog.id) {
        return NextResponse.json(
          { success: false, message: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    const created = await prisma.comment.create({
      data: {
        content: trimmed,
        blogId: blog.id,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: parentId ? "Reply posted successfully" : "Comment posted successfully",
      comment: {
        id: created.id,
        content: created.content,
        blogId: created.blogId,
        authorId: created.authorId,
        author: created.author,
        parentId: created.parentId,
        likesCount: 0,
        hasLiked: false,
        replies: [],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("POST comment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to post comment" },
      { status: 500 }
    );
  }
}
