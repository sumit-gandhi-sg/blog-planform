import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

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
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    // Authorization: User must be comment author OR platform ADMIN
    const isAuthor = comment.authorId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You cannot delete this comment" },
        { status: 403 }
      );
    }

    // Cascade deletes replies and comment likes automatically
    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE comment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}
