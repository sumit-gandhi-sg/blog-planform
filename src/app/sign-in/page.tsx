"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { Mail, Feather } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ControlledTextField } from "@/components/ui/ControlledTextField";
import { ControlledPasswordField } from "@/components/ui/ControlledPasswordField";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

interface SignInFormValues {
  email: string;
  password: string;
}

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: toastError, info } = useToast();

  const methods = useForm<SignInFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const { isSubmitting, errors } = methods.formState;

  const handleSubmit = methods.handleSubmit(async ({ email, password }) => {
    methods.clearErrors("root");
    try {
      const res = await login(email, password);
      if (res?.navigate === "otp-verify" || !res?.user?.isEmailVerified) {
        info("Please verify your email to complete login.");
        router.push("/otp-verify");
      } else {
        success(`Welcome back, @${res.user?.username || "writer"}!`);
        router.push("/blogs");
      }
    } catch (error: any) {
      methods.setError("root", {
        message: error.message || "Invalid credentials. Please try again.",
      });
      toastError(error.message || "Invalid email or password.");
    }
  });

  return (
    <main className="relative min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute w-[480px] h-[480px] rounded-full blur-[80px] opacity-25 pointer-events-none bg-[radial-gradient(circle,#aa3bff,#7c3aed)] -top-30 -right-25 animate-float"
      />
      <div
        aria-hidden="true"
        className="absolute w-[360px] h-[360px] rounded-full blur-[80px] opacity-25 pointer-events-none bg-[radial-gradient(circle,#38bdf8,#6366f1)] -bottom-20 -left-20 animate-float-slow"
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
            "shadow-[0_4px_6px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
            "dark:shadow-[0_4px_6px_rgba(0,0,0,0.3),0_12px_40px_rgba(0,0,0,0.5)]",
            "animate-slide-up"
          )}
        >
          <div className="text-center mb-7">
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900 dark:text-gray-100 m-0 mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Sign in to continue writing your story
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

              <ControlledTextField
                variant="col"
                label="Email address"
                field={{
                  name: "email",
                  type: "email",
                  placeholder: "you@example.com",
                  validation: {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  },
                }}
                leadingIcon={<Mail size={16} />}
                disableAutoComplete
              />

              <ControlledPasswordField
                variant="col"
                label="Password"
                field={{
                  name: "password",
                  placeholder: "••••••••",
                  validation: {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" },
                  },
                }}
                disablePaste
              />

              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent font-medium hover:underline hover:opacity-75 transition-opacity no-underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                id="signin-submit"
                type="submit"
                className="w-full py-3 text-[15px] rounded-2xl mt-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin shrink-0" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </FormProvider>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">New here?</span>
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 m-0">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-accent font-semibold hover:underline hover:opacity-75 transition-opacity no-underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
