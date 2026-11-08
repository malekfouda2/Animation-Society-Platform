"use client";

import type { Locale } from "@as/contracts";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { otherLocale, switchLocalePath } from "@/i18n/paths";
import styles from "./header.module.css";

export interface NavItem {
  href: string;
  label: string;
}

interface Props {
  locale: Locale;
  items: NavItem[];
  cta: NavItem;
  secondary: NavItem[];
  tagline: string;
  labels: { nav: string; menu: string; close: string; switchLanguage: string; languageName: string; languageShort: string };
}

/**
 * Header actions plus the side drawer. The drawer slides in from the inline end at every width:
 * big stacked links that the brand ball points at on hover/focus, `inert` on the page behind,
 * Escape to close, focus returned to the Menu button. The header hides while scrolling down and
 * returns on scroll up.
 */
export function NavBar({ locale, items, cta, secondary, tagline, labels }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();
  const target = otherLocale(locale);
  const languageHref = switchLocalePath(pathname, target);
  const isCurrent = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // Hide on scroll down, show on scroll up; mark "scrolled" for the backdrop.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-header]");
    if (!header) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const scrolled = y > 24 ? "true" : "false";
      const hidden = y > last && y > 240 ? "true" : "false";
      // Write only on change: every attribute write triggers a style pass.
      if (header.dataset.scrolled !== scrolled) header.dataset.scrolled = scrolled;
      if (Math.abs(y - last) > 2 && header.dataset.hidden !== hidden) header.dataset.hidden = hidden;
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const others = [...document.body.children].filter((el) => el !== drawer?.parentElement) as HTMLElement[];
    others.forEach((el) => { el.inert = true; });
    const root = document.documentElement;
    root.dataset.menu = "open";
    drawer?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const button = menuButtonRef.current;
    return () => {
      others.forEach((el) => { el.inert = false; });
      delete root.dataset.menu;
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  function close() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(false);
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, 200);
  }

  const drawer = (
    <div className={`world-tokens ${styles.drawerRoot}`} data-state={closing ? "closing" : "open"}>
      <div className={styles.scrim} aria-hidden="true" onClick={close} />
      <div ref={drawerRef} id={drawerId} role="dialog" aria-modal="true" aria-label={labels.nav} className={styles.drawer}>
        <Image src="/brand/elements/lines-dark.webp" alt="" width={2400} height={1350} sizes="40rem" className={styles.drawerArt} />
        <div className={styles.drawerTop}>
          <button type="button" className={styles.close} onClick={close}>
            <span aria-hidden="true" className={styles.closeIcon} />
            {labels.close}
          </button>
        </div>
        <nav aria-label={labels.nav}>
          <ul className={styles.drawerList}>
            {items.map((item, i) => (
              <li key={item.href} style={{ ["--i" as string]: i }}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={styles.drawerLink}
                  onClick={() => { setOpen(false); }}
                >
                  <span aria-hidden="true" className={styles.drawerBall} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.drawerFoot}>
          <Link href={cta.href} className="btn btn-primary" onClick={() => { setOpen(false); }}>
            {cta.label}
          </Link>
          <ul className={styles.drawerSecondary}>
            {secondary.map((s) => (
              <li key={s.href}>
                <Link href={s.href} onClick={() => { setOpen(false); }}>{s.label}</Link>
              </li>
            ))}
            <li>
              <Link href={languageHref} hrefLang={target} lang={target} aria-label={`${labels.switchLanguage}: ${labels.languageName}`}>
                {labels.languageName}
              </Link>
            </li>
          </ul>
          <p className={styles.drawerTagline}>{tagline}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.actions}>
        <Link
          href={languageHref}
          hrefLang={target}
          lang={target}
          className={styles.language}
          aria-label={`${labels.switchLanguage}: ${labels.languageName}`}
        >
          <span className={styles.languageLong}>{labels.languageName}</span>
          <span className={styles.languageShort} aria-hidden="true">{labels.languageShort}</span>
        </Link>
        <Link href={cta.href} className={`btn btn-primary ${styles.cta}`}>
          {cta.label}
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => { setOpen(true); }}
        >
          <span className={styles.menuLabel}>{labels.menu}</span>
          <span aria-hidden="true" className={styles.menuIcon} />
        </button>
      </div>
      {open ? createPortal(drawer, document.body) : null}
    </>
  );
}
