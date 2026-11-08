import Link from "next/link";
import type { ReactNode } from "react";
import { BrandIcon } from "./BrandIcon";
import type { IconName } from "@/config/artwork";
import styles from "./ui.module.css";

interface Props {
  title: string;
  body: string;
  icon?: IconName;
  action?: { href: string; label: string };
  children?: ReactNode;
  headingLevel?: "h2" | "h3";
}

/** Honest empty state: what belongs here, why, and one next step (UI skill: never a dead end). */
export function EmptyState({ title, body, icon, action, children, headingLevel = "h3" }: Props) {
  const Heading = headingLevel;
  return (
    <div className={styles.empty} data-reveal="">
      {icon ? <BrandIcon name={icon} size={56} /> : null}
      <div>
        <Heading className={styles.emptyTitle}>{title}</Heading>
        <p className={styles.emptyBody}>{body}</p>
        {children}
        {action ? (
          <Link href={action.href} className="btn btn-secondary">
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
