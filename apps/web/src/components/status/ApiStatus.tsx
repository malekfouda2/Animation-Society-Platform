import "server-only";
import { API_BASE_PATH, healthResponseSchema, readinessResponseSchema } from "@as/contracts";
import { loadWebEnv } from "@/config/env";
import type { Dictionary } from "@/i18n/types";
import styles from "./status.module.css";

type State = "ok" | "down" | "unreachable";

async function probe(path: string, parse: (body: unknown) => boolean): Promise<State> {
  const { API_INTERNAL_ORIGIN } = loadWebEnv();
  try {
    const res = await fetch(`${API_INTERNAL_ORIGIN}${API_BASE_PATH}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const body: unknown = await res.json().catch(() => null);
    return res.ok && parse(body) ? "ok" : "down";
  } catch {
    return "unreachable";
  }
}

/** Server-rendered dev/ops indicator proving web -> API -> MongoDB wiring. Exposes no internals. */
export async function ApiStatus({ dict }: { dict: Dictionary }) {
  const [health, ready] = await Promise.all([
    probe("/health", (b) => healthResponseSchema.safeParse(b).success),
    probe("/ready", (b) => readinessResponseSchema.safeParse(b).data?.status === "ready"),
  ]);
  const label = (s: State) =>
    s === "ok" ? dict.admin.statusOk : s === "down" ? dict.admin.statusDown : dict.admin.statusUnreachable;

  return (
    <section aria-labelledby="system-status" className={styles.panel}>
      <h2 id="system-status">{dict.admin.systemStatus}</h2>
      <dl className={styles.list}>
        {(
          [
            [dict.admin.apiHealth, health],
            [dict.admin.apiReady, ready],
          ] as const
        ).map(([name, state]) => (
          <div key={name} className={styles.row}>
            <dt>{name}</dt>
            <dd data-state={state} className={styles.badge}>
              {label(state)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
