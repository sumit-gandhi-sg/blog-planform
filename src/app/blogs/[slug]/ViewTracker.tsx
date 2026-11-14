"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Only count view once per session per post
    const viewedKey = `viewed_${slug}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "1");
      fetch(`/api/blogs/${slug}/view`, { method: "POST" }).catch(() => {});
    }
  }, [slug]);

  return null;
}

export default ViewTracker;
