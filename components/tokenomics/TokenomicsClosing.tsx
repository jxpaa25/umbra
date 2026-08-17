import { UMBRA } from "@/app/content";
import styles from "./tokenomics.module.css";

/** Lightweight closing — just the disclaimer, verbatim. CTA/socials are
 *  CommunityFooter's job (homepage-only), not duplicated here. */
export default function TokenomicsClosing() {
  return (
    <section className={`${styles.section} ${styles.closing}`}>
      <div className="u-container">
        <p className={styles.disclaimer}>{UMBRA.footer.disclaimer}</p>
      </div>
    </section>
  );
}
