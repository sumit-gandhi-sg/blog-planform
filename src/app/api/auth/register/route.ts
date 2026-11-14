import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return NextResponse.json(
          { success: false, message: "Username already taken" },
          { status: 400 }
        );
      }
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    const otpCode = await generateOtp(user.id, "EMAIL_VERIFY", 10);
    await sendEmail({
      to: user.email,
      subject: "Inkwell — Your Verification Code",
      text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-top: 0;">Welcome to Inkwell!</h2>
          <p style="color: #374151;">Use the verification code below to confirm your email address:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">
            ${otpCode}
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created! A verification code has been sent to your email.",
        user: { id: user.id, email: user.email, username: user.username },
        navigate: "otp-verify",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
