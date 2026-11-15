import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { signPasswordResetToken } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`verify-forget-otp:${ip}`, { limit: 8, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: `Too many attempts. Please try again in ${rl.resetSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": rl.resetSeconds.toString() } }
      );
    }

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    await verifyOtp(user.id, otp, "PASSWORD_RESET");

    const resetToken = signPasswordResetToken({ id: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      message: "Code verified. You may now reset your password.",
      resetToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Invalid or expired code" },
      { status: 400 }
    );
  }
}
