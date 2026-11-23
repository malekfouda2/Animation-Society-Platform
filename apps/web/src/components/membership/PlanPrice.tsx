import { formatPrice, type Currency, type Locale } from "@as/contracts";
import type { MembershipDict } from "@/i18n/types";
import styles from "./membership.module.css";

/** "SAR 200.00 a year", from the server's minor-unit price (fees follow the financial year). */
export function PlanPrice({ plan, locale, dict }: { plan: { priceMinor: number; currency: Currency; durationMonths: number }; locale: Locale; dict: MembershipDict }) {
  const price = formatPrice(plan.priceMinor, plan.currency, locale);
  return <span className={styles.price}>{dict.priceFor.replace("{price}", price)}</span>;
}
