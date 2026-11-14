"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { Mail, Feather, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ControlledTextField } from "@/components/ui/ControlledTextField";
import { ControlledOtpField } from "@/components/ui/ControlledOtpField";
import { ControlledPasswordField } from "@/components/ui/ControlledPasswordField";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgetPassword, verifyForgetOtp, resetPassword } = useAuth();
  const [step, setStep] = useState<"EMAIL" | "OTP" | "NEW_PASSWORD">("EMAIL");
  const [userEmail, setUserEmail] = useState("");

  const emailMethods = useForm<{ email: string }>({ defaultValues: { email: "" } });
  const otpMethods = useForm<{ otp: string }>({ defaultValues: { otp: "" } });
  const passMethods = useForm<{ password: string; confirmPassword: string }>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleEmailSubmit = emailMethods.handleSubmit(async ({ email }) => {
    emailMethods.clearErrors("root");
    try {
      await forgetPassword(email);
      setUserEmail(email);
      setStep("OTP");
    } catch (err: any) {
      emailMethods.setError("root", { message: err.message || "Failed to send reset code" });
    }
  });

  const handleOtpSubmit = otpMethods.handleSubmit(async ({ otp }) => {
    otpMethods.clearErrors("root");
    try {
      await verifyForgetOtp(otp);
      setStep("NEW_PASSWORD");
    } catch (err: any) {
      otpMethods.setError("root", { message: err.message || "Invalid or expired code" });
    }
  });

  const handlePassSubmit = passMethods.handleSubmit(async ({ password, confirmPassword }) => {
    passMethods.clearErrors("root");
    if (password !== confirmPassword) {
      passMethods.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    try {
      await resetPassword(password);
      alert("Password reset successfully! Please sign in with your new password.");
      router.push("/sign-in");
    } catch (err: any) {
      passMethods.setError("root", { message: err.message || "Failed to reset password" });
    }
  });

  return (
    <main className="relative min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute w-[480px] h-[480px] rounded-full blur-[80px] opacity-25 pointer-events-none bg-[radial-gradient(circle,#aa3bff,#7c3aed)] -top-30 -right-25 animate-float"
      />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-[0_8px_24px_rgba(124,58,237,0.45)]">
            <Feather className="w-5 h-5 text-white stroke-[2.2px]" />
          </div>
          <span className="text-[26px] font-bold tracking-tight bg-gradient-to-br from-accent to-accent-dark bg-clip-text text-transparent">
            Inkwell
          </span>
        </div>

        <div
          className={cn(
            "w-full rounded-3xl px-10 py-9",
            "bg-white/75 dark:bg-[#16171d]/80",
            "backdrop-blur-2xl backdrop-saturate-[180%]",
            "border border-white/60 dark:border-white/[0.08]",
            "shadow-[0_4px_6px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.08)]",
            "animate-slide-up"
          )}
        >
          {/* STEP 1: EMAIL */}
          {step === "EMAIL" && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-100 m-0 mb-1.5">
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                  Enter your email address and we will send you a reset code
                </p>
              </div>

              <FormProvider {...emailMethods}>
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  {emailMethods.formState.errors.root && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs">
                      {emailMethods.formState.errors.root.message}
                    </div>
                  )}

                  <ControlledTextField
                    variant="col"
                    label="Email address"
                    field={{
                      name: "email",
                      type: "email",
                      placeholder: "you@example.com",
                      validation: { required: "Email is required" },
                    }}
                    leadingIcon={<Mail size={16} />}
                  />

                  <Button
                    type="submit"
                    className="w-full py-3 text-[15px] rounded-2xl mt-2"
                    disabled={emailMethods.formState.isSubmitting}
                  >
                    Send Reset Code
                  </Button>
                </form>
              </FormProvider>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === "OTP" && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-100 m-0 mb-1.5">
                  Enter Reset Code
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                  We sent a 6-digit code to <strong>{userEmail}</strong>
                </p>
              </div>

              <FormProvider {...otpMethods}>
                <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
                  {otpMethods.formState.errors.root && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs">
                      {otpMethods.formState.errors.root.message}
                    </div>
                  )}

                  <ControlledOtpField
                    field={{
                      name: "otp",
                      validation: { required: "Please enter the 6-digit code" },
                    }}
                    length={6}
                  />

                  <Button
                    type="submit"
                    className="w-full py-3 text-[15px] rounded-2xl mt-2"
                    disabled={otpMethods.formState.isSubmitting}
                  >
                    Verify Code
                  </Button>
                </form>
              </FormProvider>
            </>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === "NEW_PASSWORD" && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-100 m-0 mb-1.5">
                  Set New Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                  Choose a secure password for your account
                </p>
              </div>

              <FormProvider {...passMethods}>
                <form onSubmit={handlePassSubmit} className="flex flex-col gap-4">
                  {passMethods.formState.errors.root && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs">
                      {passMethods.formState.errors.root.message}
                    </div>
                  )}

                  <ControlledPasswordField
                    variant="col"
                    label="New Password"
                    field={{
                      name: "password",
                      validation: {
                        required: "New password is required",
                        minLength: { value: 6, message: "At least 6 characters" },
                      },
                    }}
                  />

                  <ControlledPasswordField
                    variant="col"
                    label="Confirm New Password"
                    field={{
                      name: "confirmPassword",
                      validation: { required: "Please confirm password" },
                    }}
                  />

                  <Button
                    type="submit"
                    className="w-full py-3 text-[15px] rounded-2xl mt-2"
                    disabled={passMethods.formState.isSubmitting}
                  >
                    Save New Password
                  </Button>
                </form>
              </FormProvider>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition no-underline"
            >
              <ArrowLeft size={13} /> Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
