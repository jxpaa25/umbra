"use client";

import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import styles from "./sections.module.css";

/** Three steps, side by side, hairline-divided. */
export default function HowToBuy() {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section
      id="buy"
      data-moon-dock="buy"
      ref={ref}
      className={`${styles.section} ${inView ? styles.inView : ""}`}
    >
      <div className="u-container">
        <div className={styles.marker}>
          <span className={styles.markerLabel}>How to buy</span>
        </div>

        <div className={styles.steps}>
          {UMBRA.howToBuy.map((s, i) => (
            <div
              key={s.step}
              className={`${styles.step} ${styles.reveal}`}
              style={{ ["--i" as string]: i + 1 }}
            >
              <div className={styles.stepNum}>{s.step}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
