import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { invalidateCache } from "@/lib/memoryCache";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, avatarUrl } = body;

    const data: any = {};
    if (name !== undefined) data.name = typeof name === "string" ? name.trim().slice(0, 100) : null;
    if (bio !== undefined) data.bio = typeof bio === "string" ? bio.trim().slice(0, 500) : null;
    if (avatarUrl !== undefined) data.avatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : null;

    const updated = await prisma.user.update({
      where: { id: payload.id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
      },
    });

    invalidateCache(); // Clear memory caches
    try {
      revalidatePath("/blogs");
      revalidatePath("/profile");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
