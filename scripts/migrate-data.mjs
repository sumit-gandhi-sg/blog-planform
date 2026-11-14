// scripts/migrate-data.mjs
import { PrismaClient } from "@prisma/client";

const SOURCE_URL =
  "postgresql://postgres.wkmckmgtdnhftccqsomu:VR8Z012pLUbV1gqr@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require";

const TARGET_URL =
  "postgresql://postgres.yllyzmzoedyygwbzvbvx:jsnoAZQaOnMQsRbu@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require";

const source = new PrismaClient({
  datasources: { db: { url: SOURCE_URL } },
});

const target = new PrismaClient({
  datasources: { db: { url: TARGET_URL } },
});

async function migrate() {
  console.log("🚀 Starting database migration from Tokyo (ap-northeast-1) to Mumbai (ap-south-1)...\n");

  try {
    // 1. Fetch Users
    console.log("📥 Fetching users from Tokyo database...");
    const users = await source.user.findMany();
    console.log(`   Found ${users.length} users.`);

    for (const u of users) {
      await target.user.upsert({
        where: { id: u.id },
        update: {
          username: u.username,
          email: u.email,
          name: u.name,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          password: u.password,
          is_verified: u.is_verified,
          isEmailVerified: u.isEmailVerified,
          emailVerifiedAt: u.emailVerifiedAt,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
        create: {
          id: u.id,
          username: u.username,
          email: u.email,
          name: u.name,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          password: u.password,
          is_verified: u.is_verified,
          isEmailVerified: u.isEmailVerified,
          emailVerifiedAt: u.emailVerifiedAt,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
      });
      console.log(`   ✓ Migrated User: ${u.username} (${u.email})`);
    }

    // 2. Fetch Tags
    console.log("\n📥 Fetching tags from Tokyo database...");
    const tags = await source.tag.findMany();
    console.log(`   Found ${tags.length} tags.`);

    for (const t of tags) {
      await target.tag.upsert({
        where: { id: t.id },
        update: { name: t.name },
        create: { id: t.id, name: t.name },
      });
      console.log(`   ✓ Migrated Tag: ${t.name}`);
    }

    // 3. Fetch Blogs (with Tags)
    console.log("\n📥 Fetching blogs from Tokyo database...");
    const blogs = await source.blog.findMany({
      include: { tags: true },
    });
    console.log(`   Found ${blogs.length} blogs.`);

    for (const b of blogs) {
      await target.blog.upsert({
        where: { id: b.id },
        update: {
          title: b.title,
          slug: b.slug,
          summary: b.summary,
          content: b.content,
          coverImage: b.coverImage,
          published: b.published,
          publishedAt: b.publishedAt,
          status: b.status,
          isFeatured: b.isFeatured,
          readingTime: b.readingTime,
          views: b.views,
          authorId: b.authorId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          tags: {
            set: b.tags.map((t) => ({ id: t.id })),
          },
        },
        create: {
          id: b.id,
          title: b.title,
          slug: b.slug,
          summary: b.summary,
          content: b.content,
          coverImage: b.coverImage,
          published: b.published,
          publishedAt: b.publishedAt,
          status: b.status,
          isFeatured: b.isFeatured,
          readingTime: b.readingTime,
          views: b.views,
          authorId: b.authorId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          tags: {
            connect: b.tags.map((t) => ({ id: t.id })),
          },
        },
      });
      console.log(`   ✓ Migrated Blog: "${b.title}" (slug: ${b.slug})`);
    }

    // 4. Fetch Likes
    console.log("\n📥 Fetching likes from Tokyo database...");
    const likes = await source.like.findMany();
    console.log(`   Found ${likes.length} likes.`);

    for (const l of likes) {
      await target.like.upsert({
        where: { id: l.id },
        update: {
          userId: l.userId,
          blogId: l.blogId,
          createdAt: l.createdAt,
        },
        create: {
          id: l.id,
          userId: l.userId,
          blogId: l.blogId,
          createdAt: l.createdAt,
        },
      });
    }
    if (likes.length > 0) {
      console.log(`   ✓ Migrated ${likes.length} likes.`);
    }

    // 5. Fetch OTP Verifications
    console.log("\n📥 Fetching OTP records from Tokyo database...");
    try {
      const otps = await source.otpVerification.findMany();
      console.log(`   Found ${otps.length} OTP records.`);
      for (const o of otps) {
        await target.otpVerification.upsert({
          where: { id: o.id },
          update: {
            userId: o.userId,
            otpHash: o.otpHash,
            type: o.type,
            expiresAt: o.expiresAt,
            verified: o.verified,
            createdAt: o.createdAt,
          },
          create: {
            id: o.id,
            userId: o.userId,
            otpHash: o.otpHash,
            type: o.type,
            expiresAt: o.expiresAt,
            verified: o.verified,
            createdAt: o.createdAt,
          },
        });
      }
      if (otps.length > 0) {
        console.log(`   ✓ Migrated ${otps.length} OTP records.`);
      }
    } catch (otpErr) {
      console.log("   (OTP records skipped or empty)");
    }

    console.log("\n🎉 Migration completed successfully! All users, blogs, tags, and likes are now live in Mumbai!");
  } catch (error) {
    console.error("\n❌ Migration error:", error);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

migrate();
