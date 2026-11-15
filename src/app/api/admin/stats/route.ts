import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const [
      totalUsers,
      verifiedUsers,
      totalPublishedBlogs,
      totalArchivedBlogs,
      totalDraftsCount,
      viewsAgg,
      totalLikes,
      totalTags,
      recentBlogs,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isEmailVerified: true } }),
      prisma.blog.count({ where: { status: "PUBLISHED" } }),
      prisma.blog.count({ where: { status: "ARCHIVED" } }),
      prisma.blog.count({ where: { status: "DRAFT" } }), // Anonymous aggregate count only
      prisma.blog.aggregate({ _sum: { views: true } }),
      prisma.like.count(),
      prisma.tag.count(),
      prisma.blog.findMany({
        where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          isFeatured: true,
          views: true,
          createdAt: true,
          author: { select: { id: true, username: true, name: true } },
          _count: { select: { likes: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          verifiedUsers,
          totalPublishedBlogs,
          totalArchivedBlogs,
          totalDraftsCount,
          totalViews: viewsAgg._sum.views || 0,
          totalLikes,
          totalTags,
        },
        recentBlogs,
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
