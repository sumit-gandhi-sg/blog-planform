import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { setAuthCookies } from "@/lib/jwt";
import { generateOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`login:${ip}`, { limit: 10, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: `Too many login attempts. Please try again in ${rl.resetSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": rl.resetSeconds.toString() } }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isEmailVerified && !user.is_verified) {
      const otpCode = await generateOtp(user.id, "EMAIL_VERIFY", 10);
      await sendEmail({
        to: user.email,
        subject: "Inkwell — Verify Your Email",
        text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
      });

      return NextResponse.json({
        success: true,
        message: "Email not verified. A new verification code has been sent.",
        navigate: "otp-verify",
        user: { id: user.id, email: user.email, username: user.username, isEmailVerified: false },
      });
    }

    await setAuthCookies({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
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
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
