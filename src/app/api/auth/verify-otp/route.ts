import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { setAuthCookies } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`verify-otp:${ip}`, { limit: 8, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: `Too many verification attempts. Please try again in ${rl.resetSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": rl.resetSeconds.toString() } }
      );
    }

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and code are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    await verifyOtp(user.id, otp, "EMAIL_VERIFY");

    await setAuthCookies({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You are now logged in.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isEmailVerified: true,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Verification failed" },
      { status: 400 }
    );
  }
}
