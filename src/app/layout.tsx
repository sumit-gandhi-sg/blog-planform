import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://inkwell.blog"),
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
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider defaultTheme="light" storageKey="inkwell-theme">
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
