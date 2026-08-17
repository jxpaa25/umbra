"use client";

import { useEffect, useState } from "react";
import { UMBRA } from "@/app/content";
import styles from "./shell.module.css";

/** Cinematic 0 → 100 count, then a curtain reveal into the hero. */
export default function Preloader() {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.body.style.overflow = "hidden";

    if (reduce) {
      setPct(100);
      const t = window.setTimeout(() => setDone(true), 250);
      return () => window.clearTimeout(t);
    }

    let raf = 0;
    const dur = 1900;
    const startAt = performance.now();
    const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

    // drive the counter from real elapsed time (not frame count), so a stalled
    // rAF can never leave the counter — and the site — stuck behind the curtain.
    const step = () => {
      const p = Math.min(1, (performance.now() - startAt) / dur);
      setPct(Math.round(easeOut(p) * 100));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // hard fallback: lift the curtain on wall-clock time regardless of rAF.
    const doneTimer = window.setTimeout(() => {
      setPct(100);
      setDone(true);
    }, dur + 450);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    if (done) document.body.style.overflow = "";
  }, [done]);

  return (
    <div
      className={`${styles.preloader} ${done ? styles.preloaderDone : ""}`}
      aria-hidden={done}
    >
      <div className={styles.preloaderInner}>
        <span className={styles.preWord}>{UMBRA.ticker}</span>
        <span className={`${styles.prePct} u-tabular`}>
          {String(pct).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
