"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (username: string, email: string, password: string) => Promise<any>;
  verifyOtp: (otp: string) => Promise<any>;
  logout: () => Promise<void>;
  forgetPassword: (email: string) => Promise<any>;
  verifyForgetOtp: (otp: string) => Promise<any>;
  resetPassword: (password: string) => Promise<any>;
  refreshUser: () => Promise<void>;
  pendingEmail: string;
  pendingForgotEmail: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingForgotEmail, setPendingForgotEmail] = useState("");
  const [pendingResetToken, setPendingResetToken] = useState("");

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    if (data.navigate === "otp-verify" || !data.user?.isEmailVerified) {
      setPendingEmail(email);
    } else if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const signup = async (username: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    setPendingEmail(email);
    return data;
  };

  const verifyOtp = async (otp: string) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Verification failed");

    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const forgetPassword = async (email: string) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send reset code");

    setPendingForgotEmail(email);
    return data;
  };

  const verifyForgetOtp = async (otp: string) => {
    const res = await fetch("/api/auth/verify-forget-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingForgotEmail, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Invalid OTP code");

    if (data.resetToken) setPendingResetToken(data.resetToken);
    return data;
  };

  const resetPassword = async (password: string) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken: pendingResetToken, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Password reset failed");

    setPendingForgotEmail("");
    setPendingResetToken("");
    return data;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        verifyOtp,
        logout,
        forgetPassword,
        verifyForgetOtp,
        resetPassword,
        refreshUser,
        pendingEmail,
        pendingForgotEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
