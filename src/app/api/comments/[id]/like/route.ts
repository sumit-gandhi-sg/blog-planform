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
      return NextResponse.json(
        { success: false, message: "Authentication required to like comments" },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    const existing = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    });

    let liked = false;
    if (existing) {
      await prisma.commentLike.delete({
        where: { id: existing.id },
      });
      liked = false;
    } else {
      await prisma.commentLike.create({
        data: {
          userId: user.id,
          commentId,
        },
      });
      liked = true;
    }

    const totalLikes = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({
      success: true,
      liked,
      totalLikes,
    });
  } catch (error: any) {
    console.error("Comment like error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update like status" },
      { status: 500 }
    );
  }
}
