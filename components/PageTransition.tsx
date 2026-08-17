"use client";

import { useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSmoothScroll } from "./SmoothScrollProvider";
import styles from "./page-transition.module.css";

/**
 * Direction-aware parallax slide between routes, ported from the
 * "Parallax" variant of components/techniques/parallel-page-transition.
 *
 * KEY CONSTRAINT: the real pages are long-scroll documents with pinned/scrubbed
 * GSAP ScrollTrigger sections (RoadmapTeaser, DistributionDonut) and a persistent
 * cosmic background that reads document scroll height (Nebula band anchoring,
 * moon travel). So the INCOMING / current page must ALWAYS stay in normal
 * document flow — if it were position:fixed even briefly, document height would
 * collapse and every scroll measurement (ScrollTrigger start/end, scrollMax)
 * would be created wrong. Only the EXITING pane (which is unmounting anyway) is
 * lifted to position:fixed so it can slide away without pushing the incoming
 * page down. A horizontal enter transform on the in-flow incoming pane is
 * harmless to vertical scroll math and is cleared once the page settles.
 */

// Extend as more pages ship. Unknown pathnames sort after known ones.
const ROUTE_ORDER = ["/", "/tokenomics"] as const;
function routeIndex(pathname: string) {
  const i = ROUTE_ORDER.indexOf(pathname as (typeof ROUTE_ORDER)[number]);
  return i === -1 ? ROUTE_ORDER.length : i;
}

const DURATION = 0.5;
const DEPTH = 0.7; // parallax: outgoing lags to (1-DEPTH) travel, dims to DEPTH*0.5
const EXIT_TRAVEL = 1 - DEPTH;
const DIM = DEPTH * 0.5;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const TOP_Z = 2; // parallax's z value in the reference file (push uses 1)

const enterSign = (dir: number) => (dir > 0 ? 1 : -1);
// Concrete { x } — matches the reference file's documented pattern: a
// computed key would widen to a string index signature and break Framer's
// Variant/Target typing.
function slide(value: string) {
  return { x: value };
}

/** Freezes the App Router's LayoutRouterContext at first render so an exiting
 *  pane keeps rendering the route it mounted with. Without this, Next's single
 *  `children` router slot re-renders the NEW route inside BOTH the entering AND
 *  the exiting pane, so the outgoing page would show the incoming content. */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  // useState initializer captures the context ONCE at mount and never updates —
  // render-pure equivalent of a frozen ref (satisfies react-hooks/refs).
  const [frozen] = useState(context);
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/** Route-order direction + first-load detection, both derived via React's
 *  "adjusting state during render" pattern (react.dev/reference/react/useState
 *  #storing-information-from-previous-renders) — render-pure, no refs/effects.
 *  `animateIn` is false on the initial render (a fresh load has no previous
 *  page to slide from) and true once any client-side navigation has occurred. */
function useRouteMotion(pathname: string) {
  const [state, setState] = useState(() => ({
    pathname,
    index: routeIndex(pathname),
    direction: 1,
    animateIn: false,
  }));

  if (state.pathname !== pathname) {
    const index = routeIndex(pathname);
    setState({
      pathname,
      index,
      direction: index >= state.index ? 1 : -1,
      animateIn: true,
    });
  }

  return state;
}

function Pane({
  children,
  direction,
  reduce,
  animateIn,
}: {
  children: ReactNode;
  direction: number;
  reduce: boolean;
  animateIn: boolean;
}) {
  const isPresent = useIsPresent();
  const ref = useRef<HTMLDivElement>(null);
  // Only the EXITING pane leaves normal flow (fixed overlay). The present /
  // incoming page always stays in flow so document height + scroll math are
  // correct from the first frame.
  const fixed = !isPresent;

  // Once the page is at rest, clear the residual enter transform (an identity
  // transform still creates a containing block that breaks GSAP's fixed pinning)
  // and recompute every ScrollTrigger + the cosmic background's scroll metrics
  // against the now-final static layout. The resize event nudges both GSAP and
  // CosmicBackground (which listens to resize) to remeasure.
  const settle = () => {
    const el = ref.current;
    if (el) {
      el.style.transform = "none";
      el.style.willChange = "auto";
    }
    ScrollTrigger.refresh();
    window.dispatchEvent(new Event("resize"));
  };

  useEffect(() => {
    // First load / reduced motion play no enter animation, so onAnimationComplete
    // may never fire — settle on mount instead. (Animated panes settle in
    // onAnimationComplete so we don't clobber the transform mid-slide.)
    if (!animateIn || reduce) {
      settle();
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t: Transition = reduce
    ? { duration: 0 }
    : { duration: DURATION, ease: EASE_OUT, zIndex: { duration: 0 } };

  const pageVariants: Variants = {
    enter: (dir: number) => ({
      ...slide(`${enterSign(dir) * 100}%`),
      zIndex: TOP_Z,
    }),
    center: { ...slide("0%"), zIndex: 1, transition: t },
    exit: (dir: number) => ({
      ...slide(`${-enterSign(dir) * EXIT_TRAVEL * 100}%`),
      zIndex: 0,
      transition: t,
    }),
  };
  const scrimVariants: Variants = {
    enter: { opacity: 0 },
    center: { opacity: 0, transition: t },
    exit: { opacity: DIM, transition: t },
  };

  return (
    <motion.div
      ref={ref}
      className={fixed ? styles.pane : styles.paneSettled}
      custom={direction}
      variants={pageVariants}
      initial={reduce || !animateIn ? "center" : "enter"}
      animate="center"
      exit="exit"
      onAnimationComplete={(label) => {
        if (label === "center") settle();
      }}
    >
      <FrozenRouter>{children}</FrozenRouter>
      {!reduce && (
        <motion.div className={styles.scrim} variants={scrimVariants} aria-hidden />
      )}
    </motion.div>
  );
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion() ?? false;
  const { getLenis } = useSmoothScroll();
  const { direction, animateIn } = useRouteMotion(pathname);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    getLenis()?.scrollTo(0, { immediate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence mode="sync" custom={direction} initial={false}>
      <Pane key={pathname} direction={direction} reduce={reduce} animateIn={animateIn}>
        {children}
      </Pane>
    </AnimatePresence>
  );
}
