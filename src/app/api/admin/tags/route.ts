import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            blogs: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (error: any) {
    console.error("Admin tags GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const rawName = body?.name?.trim();

    if (!rawName) {
      return NextResponse.json({ success: false, message: "Tag name is required" }, { status: 400 });
    }

    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const existing = await prisma.tag.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Tag already exists" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: { name },
    });

    return NextResponse.json({
      success: true,
      message: "Tag created successfully",
      data: tag,
    });
  } catch (error: any) {
    console.error("Admin tag POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create tag" },
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
      return NextResponse.json({ success: false, message: "Tag ID is required" }, { status: 400 });
    }

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error: any) {
    console.error("Admin tag DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete tag" },
      { status: 500 }
    );
  }
}
