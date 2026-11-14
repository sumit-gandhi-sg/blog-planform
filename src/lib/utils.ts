import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoDate?: string | Date | null) {
  if (!isoDate) return "";
  const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calculateReadingTime(text: string): number {
  const plainText = text.replace(/<[^>]*>/g, "").trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
}

const GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-purple-600",
];

export function getCardGradient(id: string): string {
  const idx = id.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}
