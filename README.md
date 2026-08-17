# $UMBRA

A single-page marketing site for a fictional Solana memecoin, built as a long-scroll cinematic experience. The whole page sits over one persistent WebGL backdrop: a starfield, a procedural nebula, and a moon that travels to keyframed positions as you scroll.

The copy is fiction. The contract address and social links in `app/content.ts` are placeholders and must be replaced before any real use.

## Stack

- Next.js 16 (App Router) and React 19
- TypeScript, strict mode
- Tailwind v4 for the base document theme, plus a scoped CSS design system for the brand
- GSAP with ScrollTrigger, and Lenis for smooth scrolling
- react-three-fiber and three.js for the 3D backdrop

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

There is no test suite. Type errors surface through `npm run build` or your editor.

## How it fits together

A few things are worth knowing before you start editing, because they span several files.

**One WebGL layer for the whole site.** `components/CosmicBackground.tsx` mounts a single `<Canvas>` once in the root layout and pins it behind everything. It never remounts on route changes. `components/hero/Scene.tsx` holds the entire scene: stars, nebula, film grain, and the moon.

**The moon's motion is tuned to the home page.** Its scroll journey (pinning at the Manifesto and How-to-Buy sections, then flying between them) is keyframed for the home page's scroll height, so it stays hidden on every other route while the starfield and nebula carry over. The dock positions are measured live from DOM elements tagged `data-moon-dock`, so they follow the real layout across viewports. `Scene.tsx` has a long header comment that explains the pin and arc system. Read it before touching moon movement.

**One scroll authority.** `components/SmoothScrollProvider.tsx` owns the only Lenis instance and wires it into GSAP's ticker. Any scroll-driven effect should read from `useSmoothScroll()` rather than spin up its own Lenis. Under `prefers-reduced-motion`, it falls back to native scrolling, and the animation hooks degrade to static layouts.

**Two separate CSS worlds.** `app/globals.css` is the light Tailwind base. `app/umbra.css` is the brand design system, scoped to `.umbra-root`: a near-black palette with a single ember accent, plus the token set (spacing, type scale, easings) that the component CSS Modules read from.

**Copy lives in one place.** `app/content.ts` exports everything the site says. Components import from it instead of hard-coding text.

## Routes

- `/` is the long-scroll home page.
- `/tokenomics` is a standalone tokenomics breakdown.
- `/tokens` is a design-token reference page that reads straight from `umbra.css`.

## Project layout

```
app/            routes, global styles, and content.ts
components/     shared chrome (nav, cursor, preloader, scroll HUD)
  hero/         the WebGL scene and its moon
  sections/     the home-page sections
  tokenomics/   the tokenomics page sections
public/         moon textures and fonts
```

## License

MIT. See [LICENSE](LICENSE).
