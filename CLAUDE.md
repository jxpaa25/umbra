# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # Next.js dev server (Turbopack) at localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (flat config, eslint-config-next)
```

There is no test suite and no typecheck script — rely on `npm run build` (or the editor) for type errors. `tsconfig` is `strict`. The `@/*` path alias maps to the repo root.

## What this is

`$UMBRA` is a single-brand marketing site for a fictional Solana memecoin, built as a cinematic long-scroll experience. Stack: **Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (PostCSS), GSAP + ScrollTrigger, Lenis smooth scroll, and react-three-fiber / three.js** for the WebGL backdrop. All copy is fictional; `app/content.ts` calls out the placeholder contract address and socials that must be replaced before any real launch.

## Architecture

### One persistent WebGL layer behind everything
`components/CosmicBackground.tsx` mounts a single `<Canvas>` **once in the root layout** (`app/layout.tsx`), fixed behind all content (`z-index` via `cosmic.module.css`); page content scrolls over it. This canvas persists across client-side route changes — it is never remounted per page. `components/hero/Scene.tsx` is the entire 3D scene: starfield, procedural `Nebula`, film `Grain`, and the moon.

The **moon's scroll journey is keyframed specifically for the home page's scroll height**, so it is force-hidden on every other route (`hideMoon = pathname !== "/"`); the starfield and nebula remain everywhere. `Scene.tsx` has an unusually dense header comment block documenting the moon's pin/dock/arc keyframe system — read it before touching moon motion. Key mechanics:
- **Docking (landscape/desktop):** the moon pins 1:1 to scroll at the Manifesto and How-to-Buy sections, hides between them, and flies cinematic Bézier arcs elsewhere. Dock positions are **live-measured** from DOM elements tagged `data-moon-dock="man"` / `data-moon-dock="buy"` (see `Manifesto.tsx`, `HowToBuy.tsx`); the hard-coded fractions are only SSR/desktop fallbacks.
- **Portrait/mobile:** no docking — the moon stays centered, only scale/drift change with scroll.
- The canvas is `pointer-events:none`; grab-to-spin is hit-tested at the **window level** against the moon's projected screen disc, which `Scene` publishes back into a ref (`moonScreenRef`).

Glow layers (corona, chromosphere, rim, Baily's bead) are canvas textures **baked once at mount** and billboarded onto the moon's true projected silhouette each frame — never parented to the moon mesh.

### Scroll is a single shared authority
`components/SmoothScrollProvider.tsx` owns the **one** Lenis instance and wires it to `gsap.ticker` + `ScrollTrigger.update`. Any scroll-driven effect must consume this via `useSmoothScroll()` rather than creating its own Lenis. Under `prefers-reduced-motion: reduce` it bails to native scroll (no Lenis). This reduced-motion gate is a repeated pattern — `usePinnedDepthStage`, `useInView`, and `Scene` all check it and degrade gracefully.

`components/sections/usePinnedDepthStage.ts` is a **shared** pin-and-scrub "descend through stacked plates" effect used by both the Roadmap and Tokenomics teasers. It bails to static stacked markup under reduced motion or narrow viewports; the caller's JSX is the fallback, styled via `[data-mode="static"]` vs `active` on the stage element.

### Content
`app/content.ts` exports `UMBRA`, the **single source of all site copy** (ticker, socials, hero, manifesto, roadmap phases, tokenomics, how-to-buy, footer). Components import from it; do not hard-code copy in components.

### Styling: two separate CSS worlds
- **`app/globals.css`** — Tailwind v4 import plus a light default theme. This is the base document theme.
- **`app/umbra.css`** — the real design system, **scoped to `.umbra-root`** (the wrapper div in `layout.tsx`). Near-black "void" palette with a single ember accent, full token set (`--space-*`, `--text-*`, motion easings, glow shadows) and utility primitives (`.u-container`, `.u-eyebrow`, `.u-label`, etc.). All brand styling lives under this scope so it stays isolated from the base theme.
- Component-level styles are **CSS Modules** (`*.module.css`) colocated with their components; they reference the `umbra.css` custom properties.

Fonts are loaded in `layout.tsx`: Geist / Geist Mono via `next/font/google`, and local `Ethnocentric` (display) + `UncutSans` via `next/font/local`, all exposed as CSS variables.

### Routes
- `/` (`app/page.tsx`) — the full long-scroll home: hero + section sequence (Manifesto → TokenomicsTeaser → RoadmapTeaser → HowToBuy → CommunityFooter).
- `/tokenomics` — standalone tokenomics breakdown.
- `/tokens` — a living design-token / style-guide reference page (reads from `umbra.css` and `content.ts`).

The root layout wraps every page with the shared chrome: `CosmicBackground`, `SmoothScrollProvider`, `Preloader`, `CustomCursor`, `Nav`, `PageTransition`, `ScrollHUD`.
