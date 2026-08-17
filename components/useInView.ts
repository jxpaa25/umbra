"use client";

import { useEffect, useRef, useState } from "react";

/** Reveal-on-scroll: adds inView once the element enters the viewport.
 *  Reveals immediately under prefers-reduced-motion. Works with Lenis (real
 *  scroll position). */
export function useInView<T extends HTMLElement>(
  opts?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px", ...opts },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView } as const;
}
