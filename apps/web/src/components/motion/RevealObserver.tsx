"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reveals [data-reveal] elements as they enter the viewport (one-shot). CSS in global.css only hides
 * them when <html> has the `js` class and motion is allowed, so content is never lost without JS.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='in'])");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => { el.dataset.reveal = "in"; });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "in";
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    targets.forEach((el) => { io.observe(el); });
    return () => { io.disconnect(); };
  }, [pathname]);
  return null;
}
