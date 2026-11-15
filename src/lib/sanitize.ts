import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "a", "ul", "ol", "li", "blockquote",
        "code", "pre", "hr", "br", "img", "strong",
        "em", "u", "s", "mark", "span", "div"
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "class", "style", "title"
      ],
      ADD_ATTR: ["target", "rel"],
    });
  } catch (error) {
    console.warn("DOMPurify sanitize failed (serverless fallback applied):", error);
    // Strip <script> tags safely as serverless fallback
    return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
}
