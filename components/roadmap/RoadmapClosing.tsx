"use client";

import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import styles from "./roadmap.module.css";

/** Finale: the footer line as a closing beat plus the one buy CTA (single
 *  "buy" intent on the page). Single-shot reveal, same as the intro. */
export default function RoadmapClosing() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      className={`${styles.closing} ${inView ? styles.inView : ""}`}
    >
      <div className="u-container">
        <p className={`${styles.closingLine} ${styles.reveal}`}>
          {UMBRA.footer.line}
        </p>
        <a
          href="/#buy"
          className={`${styles.closingCta} ${styles.reveal}`}
          style={{ ["--i" as string]: 1 }}
        >
          {UMBRA.hero.cta}
        </a>
      </div>
    </section>
  );
}
