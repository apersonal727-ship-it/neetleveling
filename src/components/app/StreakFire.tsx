import styles from "./StreakFire.module.css";

// The flame shown beside every day-streak count. A live streak flickers; a
// streak of 0 renders the same flame dark and still, so the icon reads as
// "nothing burning yet" instead of a celebration of nothing.
export function StreakFire({ lit = true, size = "0.78em" }: { lit?: boolean; size?: string }) {
  return (
    <span
      className={`${styles.fire} ${lit ? styles.lit : styles.out}`}
      style={{ fontSize: size }}
      role="img"
      aria-label="streak flame"
    >
      🔥
    </span>
  );
}
