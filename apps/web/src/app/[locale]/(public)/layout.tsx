import type { ReactNode } from "react";
import { Cursor } from "@/components/motion/Cursor";
import { IntroGate } from "@/components/motion/IntroGate";
import { MotionEngine } from "@/components/motion/MotionEngine";
import motion from "@/components/motion/motion.module.css";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { otherLocale } from "@/i18n/paths";

/** Public "night studio" world: dark canvas, intro gate, smooth scroll, parallax and cursor. */
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const other = otherLocale(locale);
  return (
    <div className="world">
      <IntroGate
        otherLocale={other}
        otherHref={`/${other}`}
        labels={{ title: dict.meta.tagline, enter: dict.intro.enter, enterOther: dict.intro.enterOther }}
      />
      <SiteHeader locale={locale} dict={dict} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale={locale} dict={dict} />
      <div className={motion.progress} aria-hidden="true">
        <span className={motion.progressBall} data-scroll-ball="" />
      </div>
      <Cursor />
      <MotionEngine />
    </div>
  );
}
