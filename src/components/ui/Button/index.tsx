import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "outline" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const variants = {
  default:
    "bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_4px_14px_rgba(124,58,237,0.4)] hover:from-accent-light hover:to-purple-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)]",
  outline:
    "bg-transparent border-[1.5px] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-accent/10 hover:border-accent hover:text-accent",
  ghost:
    "bg-transparent text-gray-900 dark:text-gray-100 hover:bg-accent/10",
} as const;

export const Button = ({
  children,
  className = "",
  variant = "default",
  disabled,
  ...props
}: ButtonProps) => (
  <button
    disabled={disabled}
    className={cn(
      "inline-flex items-center justify-center gap-2",
      "px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide",
      "border-0 outline-none cursor-pointer",
      "transition-all duration-200",
      "disabled:opacity-55 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
      variants[variant],
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export default Button;
