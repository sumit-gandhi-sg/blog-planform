"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { FieldConfig } from "../ControlledTextField";

export interface ControlledOtpFieldProps {
  field: FieldConfig;
  length?: number;
  disabled?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
}

export const ControlledOtpField = ({
  field,
  length = 6,
  disabled = false,
  wrapperClassName,
  inputClassName,
}: ControlledOtpFieldProps) => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const value = (watch(field.name) || "") as string;
  const otpArray = Array.from({ length }, (_, i) => value[i] || "");
  const error = errors[field.name]?.message as string | undefined;

  useEffect(() => {
    register(field.name, field.validation);
  }, [register, field.name, field.validation]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpArray];
    next[idx] = val;
    const newCode = next.join("");
    setValue(field.name, newCode, { shouldValidate: true, shouldDirty: true });

    if (val && idx < length - 1) {
      document.getElementById(`${field.name}-otp-${idx + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otpArray[idx] && idx > 0) {
      document.getElementById(`${field.name}-otp-${idx - 1}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    setValue(field.name, pasted, { shouldValidate: true, shouldDirty: true });
    const targetIdx = Math.min(pasted.length, length - 1);
    document.getElementById(`${field.name}-otp-${targetIdx}`)?.focus();
  };

  return (
    <div className={cn("flex flex-col gap-1.5 w-full items-center", wrapperClassName)}>
      <div className="flex gap-2 sm:gap-2.5 justify-center" onPaste={handlePaste}>
        {otpArray.map((digit, i) => (
          <input
            key={i}
            id={`${field.name}-otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            autoComplete="one-time-code"
            disabled={disabled}
            aria-label={`OTP digit ${i + 1}`}
            className={cn(
              "w-11 sm:w-12 h-14 sm:h-[60px] text-center text-[22px] sm:text-2xl font-bold font-[inherit]",
              "border-[1.5px] border-gray-300 dark:border-gray-600 rounded-2xl",
              "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100",
              "outline-none transition-all duration-200 caret-accent",
              "focus:border-accent focus:ring-3 focus:ring-accent/20",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-500",
              inputClassName
            )}
          />
        ))}
      </div>
      {error && (
        <span className="text-xs font-medium text-red-500 mt-1 animate-shake">
          {error}
        </span>
      )}
    </div>
  );
};

export default ControlledOtpField;
