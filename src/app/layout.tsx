import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://inkwell.blog");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Inkwell — Modern Publishing Platform",
    template: "%s | Inkwell",
  },
  description:
    "A modern publication platform for writers and thinkers to share compelling stories, tutorials, and ideas.",
  keywords: ["blog", "writing", "articles", "technology", "stories", "inkwell"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Inkwell",
    title: "Inkwell — Modern Publishing Platform",
    description: "Read, write, and discover thoughtful articles and stories.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkwell — Modern Publishing Platform",
    description: "Read, write, and discover thoughtful articles and stories.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" storageKey="inkwell-theme">
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
