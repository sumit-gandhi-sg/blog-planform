import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`forgot-password:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: `Too many password reset attempts. Please try again in ${rl.resetSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": rl.resetSeconds.toString() } }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Don't leak whether the email exists for security
      return NextResponse.json({
        success: true,
        message: "If that email exists in our system, a password reset code was sent.",
      });
    }

    const otpCode = await generateOtp(user.id, "PASSWORD_RESET", 10);
    await sendEmail({
      to: user.email,
      subject: "Inkwell — Password Reset Code",
      text: `Your password reset code is ${otpCode}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #374151;">Use the verification code below to reset your Inkwell password:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">
            ${otpCode}
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "If that email exists in our system, a password reset code was sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
