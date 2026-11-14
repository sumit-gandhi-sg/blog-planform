import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { setAuthCookies } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
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
