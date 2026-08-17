"use client";

import { UMBRA } from "@/app/content";
import { useInView } from "../useInView";
import styles from "./roadmap.module.css";

/** Page header: the single eyebrow on the page, a display title, and one line of
 *  context. Single-shot reveal via useInView + the .reveal/--i stagger, same
 *  shape as TokenomicsIntro. The timeline below is the real content. */
export default function RoadmapIntro() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      className={`${styles.introSection} ${inView ? styles.inView : ""}`}
    >
      <div className="u-container">
        <p className={`u-eyebrow ${styles.reveal}`}>Roadmap</p>
        <h1
          className={`${styles.introTitle} ${styles.reveal}`}
          style={{ ["--i" as string]: 1 }}
        >
          The path to totality.
        </h1>
        <p
          className={`${styles.introSub} ${styles.reveal}`}
          style={{ ["--i" as string]: 2 }}
        >
          Four phases of the eclipse, from the first bite of shadow to the corona.
          What is done, what is moving, and what waits in the dark.
        </p>
      </div>
    </section>
  );
}
