import styles from "./HexLoading.module.css";
export function HexLoading() {
  return <span className={styles.loader} aria-hidden="true" data-loading-animation="hexagon">
    <svg viewBox="0 0 120 120" focusable="false"><polygon className={styles.track} points="60,12 102,36 102,84 60,108 18,84 18,36" /><polygon className={styles.trace} points="60,12 102,36 102,84 60,108 18,84 18,36" /><polygon className={styles.core} points="60,43 75,51 75,69 60,77 45,69 45,51" /></svg>
  </span>;
}
