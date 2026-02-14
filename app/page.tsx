import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>ArUco Position Estimation</h1>
      <nav className={styles.nav}>
        <Link href="/calibration" className={styles.link}>Calibration</Link>
        <Link href="/performance" className={styles.link}>Performance</Link>
      </nav>
    </div>
  );
}
