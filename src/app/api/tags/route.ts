import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: tags });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load tags" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, message: "Tag name is required" }, { status: 400 });
    }

    const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (!cleanName) {
      return NextResponse.json({ success: false, message: "Invalid tag name" }, { status: 400 });
    }

    const tag = await prisma.tag.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName },
    });

    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create tag" },
      { status: 500 }
    );
  }
}
