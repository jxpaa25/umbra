"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The one page-level smooth-scroll + ScrollTrigger authority for the $UMBRA
 * site. Every scroll-driven effect must consume THIS Lenis instead of making
 * its own nested one (the repo's techniques each create their own — those get
 * refactored onto this when lifted in). Frozen under prefers-reduced-motion.
 */

type ScrollApi = {
  getLenis: () => Lenis | null;
  stop: () => void;
  start: () => void;
};

const ScrollCtx = createContext<ScrollApi>({
  getLenis: () => null,
  stop: () => {},
  start: () => {},
});

export const useSmoothScroll = () => useContext(ScrollCtx);

export default function SmoothScrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return; // native scroll, no smoothing

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const api: ScrollApi = {
    getLenis: () => lenisRef.current,
    stop: () => lenisRef.current?.stop(),
    start: () => lenisRef.current?.start(),
  };

  return <ScrollCtx.Provider value={api}>{children}</ScrollCtx.Provider>;
}
