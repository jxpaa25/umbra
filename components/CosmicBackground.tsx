"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import Scene from "./hero/Scene";
import styles from "./cosmic.module.css";

/** The single persistent WebGL layer for the whole site: the particle cosmos
 *  (always) + the moon, which travels to keyframed positions as you scroll.
 *  Fixed behind all content; content scrolls over it. The moon's journey is
 *  keyframed for the home page's specific scroll height, so it's hidden on
 *  every other route (starfield + nebula stay). */
export default function CosmicBackground() {
  const pathname = usePathname();
  const hideMoon = pathname !== "/";
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  const progress = useRef(0);
  const scrollMax = useRef(1); // scrollHeight − innerHeight, for the moon's scroll-locked pin
  const pointer = useRef({ x: 0, y: 0 });
  // grab-to-spin (globe) state, driven by the window pointer listeners below and
  // consumed each frame in Scene: pendingX/Y = un-applied drag rotation (rad),
  // velX/Y = fling angular velocity (rad/s) that decays to a stop on release.
  const spin = useRef({
    dragging: false,
    pendingX: 0,
    pendingY: 0,
    velX: 0,
    velY: 0,
  });
  // the moon's current on-screen disc (px), published by Scene for the hit-test
  const moonScreen = useRef({ x: 0, y: 0, r: 0, visible: false });
  // live-measured dock scroll-fractions (manifesto / how-to-buy centred in viewport),
  // so the moon's landscape docking tracks the real layout on any viewport. Seeded
  // with the desktop-measured defaults; overwritten in onScroll when the sections exist.
  const docks = useRef({ man: 0.1026, buy: 0.8817 });

  useEffect(() => {
    setMounted(true);
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReduce(prefersReduced);

    // ---- grab-to-spin (globe) --------------------------------------------
    // The canvas is pointer-events:none, so we grab the moon at the window level
    // and hit-test the disc Scene publishes into moonScreen. Only mouse/pen (touch
    // is left to scroll the page). Rotation → rad via DRAG_SENS; fling velocity is
    // clamped so a fast flick can't send it spinning wildly.
    const DRAG_SENS = 0.005; // rad per px
    const MAX_SPIN = 12; // rad/s
    const INTERACTIVE = 'a,button,input,textarea,select,[role="button"]';
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    const clamp = (v: number) => Math.max(-MAX_SPIN, Math.min(MAX_SPIN, v));

    const overMoon = (e: PointerEvent) => {
      const m = moonScreen.current;
      return m.visible && Math.hypot(e.clientX - m.x, e.clientY - m.y) <= m.r;
    };
    const release = () => {
      if (!spin.current.dragging) return;
      spin.current.dragging = false;
      if (prefersReduced) {
        // no autonomous continuation under reduced motion
        spin.current.velX = 0;
        spin.current.velY = 0;
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (e.button !== 0) return;
      if ((e.target as Element | null)?.closest(INTERACTIVE)) return;
      if (!overMoon(e)) return;
      spin.current.dragging = true;
      spin.current.velX = 0; // catch a spinning globe
      spin.current.velY = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;
      e.preventDefault();
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    // the canvas is pointer-events:none, so track the cursor at the window level
    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);

      const s = spin.current;
      if (s.dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dt = Math.max(1e-3, (e.timeStamp - lastT) / 1000);
        const rotY = dx * DRAG_SENS; // drag right → spin about screen-vertical
        const rotX = dy * DRAG_SENS; // drag down → spin about screen-horizontal
        s.pendingY += rotY;
        s.pendingX += rotX;
        // EMA of instantaneous velocity → a smooth release, not a jittery sample
        s.velY = s.velY * 0.7 + clamp(rotY / dt) * 0.3;
        s.velX = s.velX * 0.7 + clamp(rotX / dt) * 0.3;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = e.timeStamp;
      } else if (e.pointerType === "mouse" || e.pointerType === "pen") {
        // hover affordance: show the moon is grabbable
        document.body.style.cursor = overMoon(e) ? "grab" : "";
      }
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        scrollMax.current = max > 0 ? max : 1;
        progress.current =
          max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        // Measure the two moon-dock sections' "centred in viewport" scroll fraction
        // = (section mid − ½ viewport) / max — the same formula the docks were hand-
        // tuned from, so it reproduces the desktop values and self-heals on reflow.
        if (max > 0) {
          const scrollY = window.scrollY;
          const half = window.innerHeight / 2;
          const frac = (el: Element) => {
            const r = el.getBoundingClientRect();
            const mid = r.top + scrollY + r.height / 2;
            return Math.min(1, Math.max(0, (mid - half) / max));
          };
          const man = document.querySelector('[data-moon-dock="man"]');
          const buy = document.querySelector('[data-moon-dock="buy"]');
          if (man && buy) {
            docks.current.man = frac(man);
            docks.current.buy = frac(buy);
          }
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return (
    <div className={styles.cosmic} aria-hidden="true">
      {mounted && (
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <Scene
              reduce={reduce}
              hideMoon={hideMoon}
              progressRef={progress}
              scrollMaxRef={scrollMax}
              pointerRef={pointer}
              spinRef={spin}
              moonScreenRef={moonScreen}
              docksRef={docks}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
