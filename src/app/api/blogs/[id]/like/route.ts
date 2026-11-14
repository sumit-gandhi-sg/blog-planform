import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required to like articles" }, { status: 401 });
    }

    const { id: blogId } = await params;

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: "Article not found" }, { status: 404 });
    }

    // Check if user already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId: user.id,
          blogId,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          blogId,
        },
      });
      liked = true;
    }

    const totalLikes = await prisma.like.count({
      where: { blogId },
    });

    return NextResponse.json({
      success: true,
      liked,
      totalLikes,
      message: liked ? "Article liked" : "Article unliked",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update like status" },
      { status: 500 }
    );
  }
}
