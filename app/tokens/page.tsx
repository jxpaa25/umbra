import styles from "../styleguide.module.css";
import { UMBRA } from "../content";

/**
 * $UMBRA — living design-token reference (Step B).
 * A verification/style-guide page for the token system in `umbra.css`.
 * It will be replaced by the real hero + long-scroll site in later steps.
 */

const PALETTE = [
  { name: "Void", hex: "#050403", on: "#8f8c87" },
  { name: "Ink", hex: "#0a0908", on: "#8f8c87" },
  { name: "Line", hex: "#1a1815", on: "#8f8c87" },
  { name: "Fog", hex: "#8f8c87", on: "#050403" },
  { name: "Chalk", hex: "#eae8e4", on: "#050403" },
  { name: "Ember", hex: "#c87740", on: "#050403" },
  { name: "Ember-deep", hex: "#824c28", on: "#eae8e4" },
  { name: "Corona", hex: "#f4ae6a", on: "#050403" },
];

const TYPE = [
  { tag: "hero", size: "var(--text-hero)", text: "$UMBRA" },
  { tag: "3xl", size: "var(--text-3xl)", text: "Totality" },
  { tag: "2xl", size: "var(--text-2xl)", text: "Penumbra" },
  { tag: "xl", size: "var(--text-xl)", text: "Corona" },
];

const SPACE = [
  ["space-1", "4px"],
  ["space-2", "8px"],
  ["space-4", "16px"],
  ["space-8", "32px"],
  ["space-16", "64px"],
  ["space-24", "96px"],
  ["space-32", "128px"],
];

const RADII = [
  ["radius", "2px"],
  ["radius-lg", "4px"],
];

const MOTION = [
  ["ease-out", "cubic-bezier(.2,.7,.2,1)"],
  ["ease-snap", "cubic-bezier(.16,1,.3,1)"],
  ["ease-inout", "cubic-bezier(.65,0,.35,1)"],
];

export default function UmbraTokens() {
  return (
    <main className={`${styles.page} u-container`}>
      <header className={styles.head}>
        <p className="u-eyebrow">Umbra · Design System</p>
        <h1 className={styles.title}>
          Design <b>tokens</b>
        </h1>
        <p className={styles.sub}>
          The locked visual language: a near-black void, one warm ember accent,
          film grain, and a slow-cinematic motion scale. Everything below reads
          from <code>umbra.css</code>.
        </p>
      </header>

      {/* Voice & copy (Step D) */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Voice &amp; copy</h2>
          <span className="u-label">sentient shadow · cinematic mystery</span>
        </div>

        <p className="u-eyebrow">{UMBRA.hero.eyebrow}</p>
        <h3 className={styles.voiceHead}>{UMBRA.hero.headline}</h3>
        <p className={styles.voiceSub}>{UMBRA.hero.sub}</p>

        <div className={styles.voiceGrid}>
          <div>
            <p className="u-label">Manifesto</p>
            <div className={styles.manifesto}>
              {UMBRA.manifesto.lines.map((l, i) => (
                <p
                  key={i}
                  className={i >= 3 ? styles.manifestoEmph : undefined}
                >
                  {l}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="u-label">Phases · roadmap</p>
            <div className={styles.phases}>
              {UMBRA.phases.map((p) => (
                <div className={styles.phase} key={p.id}>
                  <span className={styles.phaseId}>{p.id}</span>
                  <div>
                    <div className="u-label">{p.line}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tickerPreview}>
          {UMBRA.tickerWords.map((w, i) => (
            <span key={i}>
              {w}
              <b> · </b>
            </span>
          ))}
        </div>
      </section>

      {/* Palette */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Palette</h2>
          <span className="u-label">void + one ember</span>
        </div>
        <div className={styles.swatches}>
          {PALETTE.map((c) => (
            <div className={styles.swatch} key={c.name}>
              <div className={styles.chip} style={{ background: c.hex }} />
              <div className={styles.meta} style={{ background: "var(--ink)" }}>
                <b>{c.name}</b>
                <span>{c.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Typography</h2>
          <span className="u-label">display · sans · mono</span>
        </div>
        {TYPE.map((t) => (
          <div className={styles.typeRow} key={t.tag}>
            <span className={styles.typeTag}>{t.tag}</span>
            <span className={styles.display} style={{ fontSize: t.size }}>
              {t.text}
            </span>
          </div>
        ))}
        <div className={styles.typeRow}>
          <span className={styles.typeTag}>body</span>
          <p style={{ maxWidth: "60ch", color: "var(--text-dim)" }}>
            The darkest core of the shadow. A signal from totality — sparse,
            ominous, and precise. Body copy in the sans stack.
          </p>
        </div>
        <div className={styles.typeRow}>
          <span className={styles.typeTag}>mono</span>
          <span className={`${styles.mono} u-tabular`}>
            CA 7xUmbra…9c02 · 00 → 100 · UMBRA / PENUMBRA / TOTALITY / CORONA
          </span>
        </div>
      </section>

      {/* Spacing */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Spacing</h2>
          <span className="u-label">4-based scale</span>
        </div>
        <div className={styles.stack}>
          {SPACE.map(([name, val]) => (
            <div className={styles.scaleRow} key={name}>
              <span className={styles.scaleTag}>{name}</span>
              <div className={styles.bar} style={{ width: val }} />
              <span className="u-label">{val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Radii + Motion */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Radii &amp; Motion</h2>
          <span className="u-label">sharp · slow-cinematic</span>
        </div>
        <div className={styles.stack} style={{ gap: "var(--space-8)" }}>
          <div className={styles.scaleRow} style={{ gap: "var(--space-8)" }}>
            {RADII.map(([name, val]) => (
              <div key={name} style={{ textAlign: "center" }}>
                <div
                  className={styles.radiusBox}
                  style={{ borderRadius: val }}
                />
                <div
                  className="u-label"
                  style={{ marginTop: "var(--space-2)" }}
                >
                  {name} · {val}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.stack}>
            {MOTION.map(([name, curve]) => (
              <div className={styles.scaleRow} key={name}>
                <span className={styles.scaleTag}>{name}</span>
                <div className={styles.motionTrack}>
                  <span
                    className={styles.motionDot}
                    style={{ animationTimingFunction: curve }}
                  />
                </div>
                <span className="u-label">{curve}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
