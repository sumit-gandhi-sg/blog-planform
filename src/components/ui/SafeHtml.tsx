"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const [cleanHtml, setCleanHtml] = useState<string>(html);

  useEffect(() => {
    try {
      setCleanHtml(sanitizeHtml(html));
    } catch {
      setCleanHtml(html);
    }
  }, [html]);

  return (
    <div
      className={cn("tiptap", className)}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

export default SafeHtml;
