"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors duration-200 shadow-sm border border-transparent dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default ThemeToggle;
