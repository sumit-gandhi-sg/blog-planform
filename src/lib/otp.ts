import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

function makeOtp(length = 6): string {
  return String(randomInt(0, Math.pow(10, length))).padStart(length, "0");
}

export async function generateOtp(
  userId: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET" | "PHONE_VERIFY" = "EMAIL_VERIFY",
  expiresInMinutes = 10
): Promise<string> {
  const otp = makeOtp(6);
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Invalidate any active previous OTPs of this type for this user
  await prisma.otpVerification.deleteMany({
    where: { userId, type },
  });

  await prisma.otpVerification.create({
    data: { userId, otpHash, type, expiresAt },
  });

  return otp;
}

export async function verifyOtp(
  userId: string,
  otp: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET" | "PHONE_VERIFY" = "EMAIL_VERIFY"
): Promise<boolean> {
  const record = await prisma.otpVerification.findFirst({
    where: {
      userId,
      type,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("OTP not found or expired. Please request a new code.");
  }

  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) {
    throw new Error("Invalid verification code. Please check and try again.");
  }

  // Atomically mark verified and clean up
  await prisma.$transaction(async (tx) => {
    if (type === "EMAIL_VERIFY") {
      await tx.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          is_verified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    await tx.otpVerification.delete({
      where: { id: record.id },
    });
  });

  return true;
}
