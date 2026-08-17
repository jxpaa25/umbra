"use client";

import { useState } from "react";
import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import styles from "./sections.module.css";

/** CTA finale — the moon returns to center behind a giant wordmark + Buy. */
export default function CommunityFooter() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });
  const [copied, setCopied] = useState(false);

  const copyCa = async () => {
    try {
      await navigator.clipboard.writeText(UMBRA.ca);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <footer
      ref={ref}
      className={`${styles.section} ${styles.footerEnd} ${inView ? styles.inView : ""}`}
    >
      <div className={`${styles.finale} u-container`}>
        <h2 className={`${styles.finaleWord} ${styles.reveal}`}>
          <b>$</b>UMBRA
        </h2>
        <p
          className={`${styles.finaleLine} ${styles.reveal}`}
          style={{ ["--i" as string]: 1 }}
        >
          {UMBRA.footer.line}
        </p>
        <a
          href="#buy"
          className={`${styles.finaleBuy} ${styles.reveal}`}
          style={{ ["--i" as string]: 2 }}
          data-cursor
        >
          {UMBRA.hero.cta}
        </a>
        <button
          type="button"
          className={`${styles.caButton} ${styles.reveal}`}
          style={{ ["--i" as string]: 3 }}
          onClick={copyCa}
          data-cursor
        >
          <span className={`${styles.caText} u-tabular`}>{UMBRA.ca}</span>
          <span className={styles.caCopy}>{copied ? "Copied" : "Copy"}</span>
        </button>
        <div
          className={`${styles.socials} ${styles.reveal}`}
          style={{ ["--i" as string]: 4 }}
        >
          <a href={UMBRA.socials.x} target="_blank" rel="noopener noreferrer">
            X / Twitter
          </a>
          <a
            href={UMBRA.socials.telegram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        </div>
        <p className={styles.disclaimer}>{UMBRA.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
