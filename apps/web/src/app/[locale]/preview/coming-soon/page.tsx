import type { Metadata } from "next";
import { ComingSoonHero } from "@/components/coming-soon/ComingSoonHero";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Internal preview of the saved hero for the future coming-soon landing page. Not linked from the site. */
export default async function ComingSoonPreview({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <main id="main" tabIndex={-1}>
      <ComingSoonHero locale={locale} dict={dict} />
    </main>
  );
}
