"use client";

import styles from "./roadmap.module.css";

/**
 * Bespoke per-phase eclipse graphic for the /roadmap timeline.
 *
 * The moon disc slides across a glowing sun/corona through the four phases:
 *   0 Umbra    — the shadow first bites the edge (thin crescent of dark)
 *   1 Penumbra — the shadow spreads inward
 *   2 Totality — full occlusion, the corona ring blazes (the eye opens)
 *   3 Corona   — the moon slips off the far side, light returning
 *
 * Pure SVG so it stays light (the three.js cosmic canvas is a separate, single
 * persistent layer we must not duplicate here). Colors come straight from the
 * umbra.css tokens (--corona / --ember / --ember-deep / --void), which resolve
 * because every page sits inside the .umbra-root scope. Gradient + filter ids
 * are suffixed per phase so the four glyphs on one page never collide.
 * The slow corona "breathe" lives in the CSS module, gated to no-preference.
 */

type EclipseConfig = { moonX: number; corona: number };

// moonX: horizontal center of the occluding moon disc (sun sits at 50).
// corona: 0..1 intensity of the surrounding glow ring, peaking at totality.
const ECLIPSE: EclipseConfig[] = [
  { moonX: 78, corona: 0.16 }, // 01 Umbra
  { moonX: 63, corona: 0.32 }, // 02 Penumbra
  { moonX: 50, corona: 1.0 }, // 03 Totality
  { moonX: 37, corona: 0.7 }, // 04 Corona
];

export default function EclipseGlyph({
  phase,
  className,
}: {
  /** 0-based phase index (0 Umbra … 3 Totality-Corona). */
  phase: number;
  className?: string;
}) {
  const cfg = ECLIPSE[phase] ?? ECLIPSE[0];
  const total = phase === 2;
  const glowId = `umbra-eclipse-glow-${phase}`;
  const sunId = `umbra-eclipse-sun-${phase}`;
  const blurId = `umbra-eclipse-blur-${phase}`;

  return (
    <svg
      className={`${styles.glyph} ${total ? styles.glyphTotal : ""} ${className ?? ""}`}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Eclipse phase ${phase + 1} of 4`}
    >
      <defs>
        {/* corona: transparent core → bright ring → transparent edge */}
        <radialGradient id={glowId}>
          <stop offset="42%" stopColor="var(--corona)" stopOpacity="0" />
          <stop offset="72%" stopColor="var(--corona)" stopOpacity={cfg.corona} />
          <stop offset="86%" stopColor="var(--ember)" stopOpacity={cfg.corona * 0.5} />
          <stop offset="100%" stopColor="var(--corona)" stopOpacity="0" />
        </radialGradient>
        {/* sun body: hot corona center falling to ember edge */}
        <radialGradient id={sunId}>
          <stop offset="0%" stopColor="var(--corona)" />
          <stop offset="58%" stopColor="var(--ember)" />
          <stop offset="100%" stopColor="var(--ember-deep)" />
        </radialGradient>
        <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* atmospheric corona ring — this is what reads as the eclipse corona at totality */}
      <circle
        className={styles.glyphCorona}
        cx="50"
        cy="50"
        r="34"
        fill={`url(#${glowId})`}
        filter={`url(#${blurId})`}
      />
      {/* the sun disc */}
      <circle cx="50" cy="50" r="25" fill={`url(#${sunId})`} />
      {/* the occluding moon — void fill with a faint ember-deep rim (chromosphere) */}
      <circle
        cx={cfg.moonX}
        cy="50"
        r="27"
        fill="var(--void)"
        stroke="var(--ember-deep)"
        strokeWidth="0.6"
        strokeOpacity="0.7"
      />
    </svg>
  );
}
