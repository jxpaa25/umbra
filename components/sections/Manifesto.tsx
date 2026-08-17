"use client";

import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import styles from "./sections.module.css";

/** Each line reveals independently as it reaches its scroll point (line-by-line). */
function Line({ text, emph }: { text: string; emph: boolean }) {
  const { ref, inView } = useInView<HTMLParagraphElement>({
    threshold: 0.5,
    rootMargin: "0px 0px -22% 0px",
  });
  return (
    <p
      ref={ref}
      className={`${styles.manifestoLine} ${emph ? styles.manifestoEmph : ""} ${
        styles.lineReveal
      } ${inView ? styles.lineIn : ""}`}
    >
      {text}
    </p>
  );
}

export default function Manifesto() {
  const last = UMBRA.manifesto.lines.length - 1;
  return (
    <section
      id="lore"
      data-moon-dock="man"
      className={`${styles.section} ${styles.manifesto}`}
    >
      <div className="u-container">
        <div className={styles.manifestoLines}>
          {UMBRA.manifesto.lines.map((line, i) => (
            <Line key={i} text={line} emph={i >= last} />
          ))}
        </div>
      </div>
    </section>
  );
}
