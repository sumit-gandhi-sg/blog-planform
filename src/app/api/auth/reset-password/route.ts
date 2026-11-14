import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifyPasswordResetToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { resetToken, password } = await req.json();

    if (!resetToken || !password) {
      return NextResponse.json(
        { success: false, message: "Reset token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const payload = verifyPasswordResetToken(resetToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset session. Please request a new code." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: payload.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
