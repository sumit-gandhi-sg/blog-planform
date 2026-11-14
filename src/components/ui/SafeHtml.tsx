import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = sanitizeHtml(html);
  return (
    <div
      className={cn("tiptap", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default SafeHtml;
