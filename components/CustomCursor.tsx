"use client";

import { useEffect, useRef } from "react";
import styles from "./shell.module.css";

/** A small ember dot + a lagging ring that swells over interactive targets.
 *  Disabled on coarse pointers and under reduced motion (native cursor stays). */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (coarse || reduce) return;

    const root = document.querySelector(".umbra-root");
    root?.classList.add("no-native-cursor");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      }
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("a, button, [data-cursor]")) {
        ringRef.current?.classList.add(styles.cursorActive);
      }
    };
    const onOut = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("a, button, [data-cursor]")) {
        ringRef.current?.classList.remove(styles.cursorActive);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      root?.classList.remove("no-native-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className={styles.cursorRing} aria-hidden="true" />
      <div ref={dotRef} className={styles.cursorDot} aria-hidden="true" />
    </>
  );
}
