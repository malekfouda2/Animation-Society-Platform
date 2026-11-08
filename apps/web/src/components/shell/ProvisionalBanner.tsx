import styles from "./shell.module.css";

export function ProvisionalBanner({ text }: { text: string }) {
  return (
    <p className={styles.provisional} role="note">
      {text}
    </p>
  );
}
