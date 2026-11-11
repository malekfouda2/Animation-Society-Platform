import type { ContentStatus } from "@/content/types";
import type { Dictionary } from "@/i18n/types";

/** Honest label for content that is not yet approved. Renders nothing for approved content. */
export function StatusNote({ status, dict, className }: { status: ContentStatus | null; dict: Dictionary; className?: string }) {
  if (!status) return null;
  return <p className={`status-note${className ? ` ${className}` : ""}`}>{dict.status[status]}</p>;
}
