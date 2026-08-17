"use client";

import { useEffect, useState } from "react";
import styles from "./shell.module.css";

/** Corner readout: scroll progress as 000–100 + a thin vertical fill. */
export default function ScrollHUD() {
  const [p, setP] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const h =
        document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className={styles.hud} aria-hidden="true">
      <span className={`${styles.hudNum} u-tabular`}>
        {String(Math.round(p * 100)).padStart(3, "0")}
      </span>
      <div className={styles.hudTrack}>
        <span
          className={styles.hudFill}
          style={{ transform: `scaleY(${p})` }}
        />
      </div>
    </div>
  );
}
