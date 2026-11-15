"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from "react";
import { AlertTriangle, Trash2, HelpCircle, X, Check, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: "text" | "url";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    options: { title: "", message: "" },
  });
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  // Prompt Modal State
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptOptions;
    value: string;
  }>({
    isOpen: false,
    options: { title: "" },
    value: "",
  });
  const promptResolveRef = useRef<((value: string | null) => void) | null>(null);
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  // ── Confirm Trigger ────────────────────────────────────────────────────────
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({
        isOpen: true,
        options: {
          confirmText: options.variant === "danger" ? "Delete" : "Confirm",
          cancelText: "Cancel",
          variant: "danger",
          ...options,
        },
      });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
  };

  // ── Prompt Trigger ─────────────────────────────────────────────────────────
  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      promptResolveRef.current = resolve;
      setPromptState({
        isOpen: true,
        options: {
          confirmText: "Insert",
          cancelText: "Cancel",
          inputType: "url",
          ...options,
        },
        value: options.defaultValue || "",
      });
    });
  }, []);

  const handlePromptClose = (result: string | null) => {
    setPromptState((prev) => ({ ...prev, isOpen: false }));
    if (promptResolveRef.current) {
      promptResolveRef.current(result);
      promptResolveRef.current = null;
    }
  };

  // Focus prompt input when prompt opens
  useEffect(() => {
    if (promptState.isOpen) {
      setTimeout(() => {
        promptInputRef.current?.focus();
        promptInputRef.current?.select();
      }, 50);
    }
  }, [promptState.isOpen]);

  // Global Escape key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmState.isOpen) handleConfirmClose(false);
        if (promptState.isOpen) handlePromptClose(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmState.isOpen, promptState.isOpen]);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}

      {/* ── 1. Confirmation Modal ────────────────────────────────────────── */}
      {confirmState.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => handleConfirmClose(false)}
        >
          <div
            className="relative w-full max-w-md p-6 overflow-hidden bg-white dark:bg-[#1c1d25] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button
              onClick={() => handleConfirmClose(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition cursor-pointer border-none bg-transparent"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Icon + Title */}
            <div className="flex items-start gap-3.5 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  confirmState.options.variant === "danger"
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : confirmState.options.variant === "warning"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-accent/10 text-accent border border-accent/20"
                )}
              >
                {confirmState.options.variant === "danger" ? (
                  <Trash2 size={18} />
                ) : confirmState.options.variant === "warning" ? (
                  <AlertTriangle size={18} />
                ) : (
                  <HelpCircle size={18} />
                )}
              </div>

              <div>
                <h3 className="m-0 text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                  {confirmState.options.title}
                </h3>
                <p className="m-0 mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {confirmState.options.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition cursor-pointer bg-transparent"
              >
                {confirmState.options.cancelText}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                autoFocus
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition cursor-pointer border-none",
                  confirmState.options.variant === "danger"
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                    : confirmState.options.variant === "warning"
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                    : "bg-accent hover:bg-accent-dark shadow-accent/20"
                )}
              >
                {confirmState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Prompt Input Modal (Link & Image URLs) ────────────────────── */}
      {promptState.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => handlePromptClose(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePromptClose(promptState.value.trim() || null);
            }}
            className="relative w-full max-w-md p-6 overflow-hidden bg-white dark:bg-[#1c1d25] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button
              type="button"
              onClick={() => handlePromptClose(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition cursor-pointer border-none bg-transparent"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                {promptState.options.title.toLowerCase().includes("image") ? (
                  <ImageIcon size={16} />
                ) : (
                  <LinkIcon size={16} />
                )}
              </div>
              <h3 className="m-0 text-base font-bold text-gray-900 dark:text-gray-100">
                {promptState.options.title}
              </h3>
            </div>

            {promptState.options.message && (
              <p className="m-0 text-xs text-gray-400 mb-4 pl-12">
                {promptState.options.message}
              </p>
            )}

            {/* Input Field */}
            <div className="mt-4">
              <input
                ref={promptInputRef}
                type={promptState.options.inputType || "text"}
                value={promptState.value}
                onChange={(e) => setPromptState((prev) => ({ ...prev, value: e.target.value }))}
                placeholder={promptState.options.placeholder || "https://..."}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/30 transition placeholder:text-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
              <button
                type="button"
                onClick={() => handlePromptClose(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition cursor-pointer bg-transparent"
              >
                {promptState.options.cancelText}
              </button>

              <button
                type="submit"
                disabled={!promptState.value.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-dark transition disabled:opacity-40 cursor-pointer border-none shadow-sm shadow-accent/20"
              >
                <Check size={13} />
                <span>{promptState.options.confirmText}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
