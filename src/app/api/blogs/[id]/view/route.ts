import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    const user = await getCurrentUser();

    // Support both ID and slug seamlessly
    const blog = await prisma.blog.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: { id: true, views: true },
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: "Article not found" }, { status: 404 });
    }

    const updated = await prisma.blog.update({
      where: { id: blog.id },
      data: {
        views: { increment: 1 },
      },
      select: { views: true },
    });

    // Automatically record reading history for authenticated users
    if (user) {
      await prisma.readingHistory.upsert({
        where: {
          userId_blogId: {
            userId: user.id,
            blogId: blog.id,
          },
        },
        update: { viewedAt: new Date() },
        create: {
          userId: user.id,
          blogId: blog.id,
          viewedAt: new Date(),
        },
      }).catch((err) => console.warn("Failed to record reading history:", err));
    }

    return NextResponse.json({ success: true, views: updated.views });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register view" },
      { status: 500 }
    );
  }
}
