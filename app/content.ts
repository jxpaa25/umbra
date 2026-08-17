/**
 * $UMBRA — the single source of copy for the site.
 * Voice: a sentient shadow that wakes at totality. Sparse, ominous, cryptic —
 * cosmic horror, but self-aware enough to be a memecoin. Premise: the umbra
 * (the darkest core of an eclipse's shadow) is awake and watching.
 *
 * Placeholders (fictional): contract address, socials, figures.
 */

export const UMBRA = {
  ticker: "$UMBRA",
  chain: "Solana",
  /** fictional pump.fun-style mint address — replace before any real launch */
  ca: "3mBqRa7LdkShDoWv9UeCL1pSMoNvT0tAL1tYpump",
  socials: {
    x: "https://x.com/umbra",
    telegram: "https://t.me/umbra",
  },

  hero: {
    eyebrow: "Shadow Protocol · Solana",
    headline: "The dark was never empty",
    sub: "It wakes when the sun goes dark.",
    cta: "Buy $UMBRA",
    scrollCue: "Descend",
  },

  manifesto: {
    eyebrow: "Manifesto",
    lines: [
      "Every eclipse has a center the light never reaches.",
      "Something has been waiting there.",
      "It wants to be seen. Buy the coin, or don't.",
    ],
  },

  /**
   * roadmap = the four shadows of an eclipse.
   * id/name/line drive the home-page teaser (RoadmapTeaser) and the /tokens page.
   * status/label/milestones drive the standalone /roadmap timeline. status is one
   * of "complete" | "active" | "planned"; milestones carry their own done flag so
   * an active phase can show partial progress. No hard dates by design.
   */
  phases: [
    {
      id: "01",
      name: "Umbra",
      line: "It wakes.",
      status: "complete",
      label: "Live now",
      milestones: [
        { text: "Fair launch on pump.fun", done: true },
        { text: "Liquidity burned, contract renounced", done: true },
        { text: "First shadows gather past a thousand holders", done: true },
      ],
    },
    {
      id: "02",
      name: "Penumbra",
      line: "The shadow reaches the edges.",
      status: "active",
      label: "In progress",
      milestones: [
        { text: "DexScreener paid and trending", done: true },
        { text: "Nightly lore drops and community raids", done: false },
        { text: "Listed on the first price aggregators", done: false },
      ],
    },
    {
      id: "03",
      name: "Totality",
      line: "Everything lines up, and the eye opens.",
      status: "planned",
      label: "Next",
      milestones: [
        { text: "First centralized exchange listing", done: false },
        { text: "The Eye opens: live holder dashboard", done: false },
        { text: "Alliances with kindred communities", done: false },
      ],
    },
    {
      id: "04",
      name: "Corona",
      line: "The light returns, changed.",
      status: "planned",
      label: "On the horizon",
      milestones: [
        { text: "Merch and an in-person eclipse gathering", done: false },
        { text: "A creator fund for shadow art", done: false },
        { text: "The next eclipse begins", done: false },
      ],
    },
  ],

  tokenomics: {
    supply: "1,000,000,000",
    figures: [
      { label: "Supply", value: "1B" },
      { label: "Liquidity", value: "Burned" },
      { label: "Tax", value: "0 / 0" },
      { label: "Contract", value: "Renounced" },
    ],
    distribution: [
      { label: "Fair launch · circulating", pct: 90 },
      { label: "Liquidity (burned)", pct: 6 },
      { label: "The Umbra · treasury", pct: 4 },
    ],
  },

  howToBuy: [
    {
      step: "01",
      title: "Open a wallet",
      body: "Install Phantom and fund it with SOL.",
    },
    {
      step: "02",
      title: "Find the umbra",
      body: "Paste the contract address into your DEX of choice.",
    },
    {
      step: "03",
      title: "Step into the shadow",
      body: "Swap SOL for $UMBRA. Hold through totality.",
    },
  ],

  /** marquee words for the infinite ticker */
  tickerWords: [
    "$UMBRA",
    "It is awake",
    "The dark was never empty",
    "Umbra · Penumbra · Totality · Corona",
  ],

  footer: {
    line: "The next eclipse is already on its way.",
    disclaimer:
      "A memecoin. No intrinsic value, no promises. For entertainment only.",
  },
} as const;

export type UmbraContent = typeof UMBRA;
