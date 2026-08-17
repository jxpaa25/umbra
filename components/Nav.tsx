"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UMBRA } from "@/app/content";
import { useSmoothScroll } from "./SmoothScrollProvider";
import styles from "./shell.module.css";

/** The nav links. Lore/Roadmap are home-page anchors written absolutely so they
 *  resolve from any route; Tokenomics is its own page. */
const LINKS = [
  { label: "Lore", href: "/#lore" },
  { label: "Tokenomics", href: "/tokenomics" },
  { label: "Roadmap", href: "/#roadmap" },
];

/** Hidden on scroll-down, revealed on scroll-up (and always near the top).
 *  On ≤768px the inline links collapse into a hamburger → fullscreen overlay. */
export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const pathname = usePathname();
  const { stop, start } = useSmoothScroll();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setHidden(y > lastY.current && y > 140);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the overlay on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While the overlay is open: lock body scroll, pause Lenis, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, stop, start]);

  return (
    <>
      <header className={`${styles.nav} ${hidden && !open ? styles.navHidden : ""}`}>
        <Link href="/" className={styles.navLogo}>
          {UMBRA.ticker}
        </Link>
        <nav className={styles.navLinks}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <a className={styles.navCta} href="/#buy">
          {UMBRA.hero.cta}
        </a>
        <button
          type="button"
          className={styles.navBurger}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="umbra-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`${styles.burgerBar} ${open ? styles.burgerBarOpen1 : ""}`} />
          <span className={`${styles.burgerBar} ${open ? styles.burgerBarOpen2 : ""}`} />
        </button>
      </header>

      <div
        id="umbra-menu"
        className={`${styles.menu} ${open ? styles.menuOpen : ""}`}
        aria-hidden={!open}
      >
        <nav className={styles.menuLinks}>
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className={styles.menuLink}
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          className={styles.menuCta}
          href="/#buy"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        >
          {UMBRA.hero.cta}
        </a>
      </div>
    </>
  );
}
