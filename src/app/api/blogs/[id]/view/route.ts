import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;

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

    return NextResponse.json({ success: true, views: updated.views });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register view" },
      { status: 500 }
    );
  }
}
