import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import path from "path";
import { writeFile } from "fs/promises";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No image file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File exceeds 5MB size limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Storage: Local disk storage in public/uploads/ (avoids database base64 string bloat)
    try {
      const ext = path.extname(file.name) || ".jpg";
      const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
      const uploadPath = path.join(process.cwd(), "public", "uploads", filename);
      await writeFile(uploadPath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`,
        message: "Image saved successfully",
      });
    } catch (fsErr) {
      console.warn("Local filesystem write failed, falling back to data URI:", fsErr);
      // Fallback for read-only serverless lambdas if disk is not writable
      const base64Data = buffer.toString("base64");
      return NextResponse.json({
        success: true,
        url: `data:${file.type};base64,${base64Data}`,
        message: "Image stored as data URI",
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
