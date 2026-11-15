import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("q")?.trim() || "";
    const roleParam = searchParams.get("role");

    const where: any = {};

    if (roleParam && (roleParam === "USER" || roleParam === "ADMIN")) {
      where.role = roleParam;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              blogs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const { id, role, isEmailVerified } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    // Safeguard: Prevent admin from demoting themselves
    if (guard.user && id === guard.user.id && role && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Action blocked: You cannot revoke admin privileges from your own account." },
        { status: 400 }
      );
    }

    const data: any = {};
    if (role === "USER" || role === "ADMIN") {
      data.role = role;
    }
    if (typeof isEmailVerified === "boolean") {
      data.isEmailVerified = isEmailVerified;
      data.is_verified = isEmailVerified;
      if (isEmailVerified) {
        data.emailVerifiedAt = new Date();
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isEmailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User account updated successfully",
      user: updated,
    });
  } catch (error: any) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user" },
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
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    // Safeguard: Prevent admin from deleting themselves
    if (guard.user && id === guard.user.id) {
      return NextResponse.json(
        { success: false, message: "Action blocked: You cannot delete your own account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error: any) {
    console.error("Admin user DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
