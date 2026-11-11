"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

/**
 * Member/admin navigation; marks the current page. A `section` item also stays marked on the pages
 * under it (a list and its editors). Items without an href are not built yet.
 */
export function SideNav({ label, items }: { label: string; items: { label: string; href?: string; section?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className={styles.sideList}>
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href} className={styles.sideItem} aria-current={pathname === item.href || (item.section && pathname.startsWith(`${item.href}/`)) ? "page" : undefined}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.sideItem}>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
