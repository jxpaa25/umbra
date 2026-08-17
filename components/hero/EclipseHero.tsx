import { UMBRA } from "@/app/content";
import styles from "./hero.module.css";

/** Hero overlay. The moon + cosmos live in the shared CosmicBackground behind
 *  everything; this is just the wordmark + Buy CTA anchored over it. */
export default function EclipseHero() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.overlay}>
        <div className={`${styles.inner} u-container`}>
          <h1 className={`${styles.wordmark} ${styles.reveal}`}>
            <b>$</b>UMBRA
          </h1>
          <div className={styles.bottomRow}>
            <p className={`${styles.sub} ${styles.reveal} ${styles.revealD2}`}>
              {UMBRA.hero.sub}
            </p>
            <a
              href="#buy"
              className={`${styles.buy} ${styles.reveal} ${styles.revealD3}`}
              data-cursor
            >
              {UMBRA.hero.cta}
            </a>
          </div>
        </div>

        <div className={styles.scrollCue} aria-hidden="true">
          <span>{UMBRA.hero.scrollCue}</span>
          <span className={styles.scrollLine} />
        </div>
      </div>
    </section>
  );
}
