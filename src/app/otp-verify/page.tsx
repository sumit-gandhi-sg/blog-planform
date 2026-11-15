"use client";

import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ControlledOtpField } from "@/components/ui/ControlledOtpField";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

interface OtpFormValues {
  otp: string;
}

export default function OtpVerifyPage() {
  const router = useRouter();
  const { verifyOtp, pendingEmail } = useAuth();
  const { success, error: toastError } = useToast();

  const methods = useForm<OtpFormValues>({
    defaultValues: { otp: "" },
    mode: "onTouched",
  });

  const { isSubmitting, errors } = methods.formState;

  const handleSubmit = methods.handleSubmit(async ({ otp }) => {
    methods.clearErrors("root");
    try {
      await verifyOtp(otp);
      success("Email verified successfully! Welcome to Inkwell.");
      router.push("/blogs");
    } catch (err: any) {
      methods.setError("root", {
        message: err.message || "Invalid verification code.",
      });
      toastError(err.message || "Invalid verification code.");
    }
  });

  return (
    <main className="relative min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-20 pointer-events-none bg-[radial-gradient(circle,#aa3bff,#7c3aed)] -top-20 -left-20 animate-float"
      />
      <div
        aria-hidden="true"
        className="absolute w-[320px] h-[320px] rounded-full blur-[80px] opacity-20 pointer-events-none bg-[radial-gradient(circle,#38bdf8,#6366f1)] -bottom-16 -right-16 animate-float-slow"
      />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-4 animate-slide-up">
        <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-[0_8px_28px_rgba(124,58,237,0.4)] mb-1">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 m-0">
          Verify your email
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 m-0 text-center">
          Enter the 6-digit verification code sent to{" "}
          <strong className="text-gray-800 dark:text-gray-200">
            {pendingEmail || "your email"}
          </strong>
        </p>

        <div
          className={cn(
            "w-full mt-2 rounded-[22px] px-9 py-8",
            "bg-white/75 dark:bg-[#16171d]/82",
            "backdrop-blur-2xl backdrop-saturate-[180%]",
            "border border-white/60 dark:border-white/[0.08]",
            "shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          )}
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {errors.root && (
                <div
                  role="alert"
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2.5 rounded-xl",
                    "bg-red-500/10 border border-red-400/25 text-red-600 dark:text-red-400",
                    "text-sm font-medium animate-shake"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                  {errors.root.message}
                </div>
              )}

              <ControlledOtpField
                field={{
                  name: "otp",
                  validation: {
                    required: "OTP is required",
                    minLength: { value: 6, message: "Please enter all 6 digits" },
                    pattern: { value: /^\d{6}$/, message: "OTP must be 6 numbers" },
                  },
                }}
                length={6}
                disabled={isSubmitting}
              />

              <Button
                id="otp-submit"
                type="submit"
                className="w-full py-3 text-[15px] rounded-2xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin shrink-0" />
                    Verifying…
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </main>
  );
}
