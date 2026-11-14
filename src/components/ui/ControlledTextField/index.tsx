"use client";

import { type ReactNode } from "react";
import { Controller, useFormContext, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";

export type FieldValidation = RegisterOptions & {
  required?: boolean | string;
  maxLength?: { value: number; message: string };
  minLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
};

export interface FieldConfig {
  name: string;
  type?: React.HTMLInputTypeAttribute;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  validation?: FieldValidation;
  maxLength?: number;
  width?: string;
  onChangeHandler?: (value: string) => void;
}

export interface ControlledTextFieldProps {
  field: FieldConfig;
  label?: string;
  toolTipMessage?: string;
  tipIcon?: ReactNode;
  variant?: "row" | "col";
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  height?: string;
  disableAutoComplete?: boolean;
  disablePaste?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
}

const Tooltip = ({ message, children }: { message?: string; children: ReactNode }) => {
  if (!message) return <>{children}</>;
  return (
    <span className="relative inline-flex items-center group/tip">
      {children}
      <span
        role="tooltip"
        className={cn(
          "absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
          "bg-gray-900 dark:bg-gray-700 text-gray-100 text-xs leading-relaxed",
          "px-2.5 py-1.5 rounded-lg max-w-[240px] whitespace-normal",
          "pointer-events-none opacity-0 group-hover/tip:opacity-100",
          "transition-opacity duration-200 z-50 shadow-lg"
        )}
      >
        {message}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  );
};

export const ControlledTextField = ({
  field,
  label,
  toolTipMessage,
  tipIcon,
  variant = "col",
  helperText,
  leadingIcon,
  trailingIcon,
  height = "40px",
  disableAutoComplete = false,
  disablePaste = false,
  wrapperClassName,
  inputClassName,
}: ControlledTextFieldProps) => {
  const { control } = useFormContext();

  const isRequired = !!field.validation?.required;
  const maxLen =
    (field.validation?.maxLength as { value: number; message: string } | undefined)
      ?.value ?? 100;

  return (
    <Controller
      name={field.name}
      defaultValue={field.defaultValue ?? ""}
      control={control}
      rules={field.validation}
      render={({ field: { ref, onChange, ...rest }, fieldState: { error } }) => (
        <div
          className={
            variant === "row"
              ? cn("grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 items-start w-full", wrapperClassName)
              : cn("flex flex-col gap-1.5 w-full", wrapperClassName)
          }
        >
          {label && (
            <div className="flex flex-col gap-1">
              <label htmlFor={field.name} className="inline-flex items-center gap-1.5 cursor-pointer">
                <span
                  className={cn(
                    "text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug",
                    field.disabled && "opacity-50"
                  )}
                >
                  {isRequired ? `${label} *` : label}
                </span>
                {tipIcon && (
                  <Tooltip message={toolTipMessage}>
                    <span className="inline-flex items-center text-gray-400 cursor-help">
                      {tipIcon}
                    </span>
                  </Tooltip>
                )}
              </label>
              {helperText && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[380px] m-0">
                  {helperText}
                </p>
              )}
            </div>
          )}

          <div
            className="flex flex-col gap-1.5 w-full"
            style={field.width ? { maxWidth: field.width } : undefined}
          >
            <div className="relative flex items-center w-full">
              {leadingIcon && (
                <span className="absolute left-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none z-10">
                  {leadingIcon}
                </span>
              )}

              <input
                ref={ref}
                id={field.name}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                disabled={field.disabled}
                maxLength={maxLen}
                autoComplete={disableAutoComplete ? "one-time-code" : "on"}
                onPaste={disablePaste ? (e) => e.preventDefault() : undefined}
                onChange={(e) => {
                  const value = e.target.value;
                  if (field.maxLength && value.length > field.maxLength) return;
                  field.onChangeHandler?.(value);
                  onChange(value);
                }}
                style={{ height }}
                className={cn(
                  "w-full px-3 py-2 text-sm font-[inherit] box-border",
                  "border-[1.5px] rounded-[10px] outline-none transition-all duration-200",
                  "bg-white dark:bg-[#16171d]",
                  "text-gray-900 dark:text-gray-100",
                  "placeholder:text-gray-400 placeholder:opacity-65",
                  leadingIcon && "pl-[38px]",
                  trailingIcon && "pr-[38px]",
                  field.disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800",
                  error
                    ? "border-red-400 focus:border-red-400 focus:ring-3 focus:ring-red-400/20"
                    : "border-gray-300 dark:border-gray-600 focus:border-accent focus:ring-3 focus:ring-accent/20",
                  inputClassName
                )}
                {...rest}
              />

              {trailingIcon && (
                <span className="absolute right-3 flex items-center text-gray-400 dark:text-gray-500 z-10">
                  {trailingIcon}
                </span>
              )}
            </div>

            {error && (
              <span className="text-xs text-red-400 font-medium" role="alert">
                {error.message as string}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
};

export default ControlledTextField;
