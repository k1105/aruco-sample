"use client";

import Link from "next/link";
import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export default function Header({ title, backHref, action }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.slot}>
        {backHref && <Link href={backHref} className={styles.back}>&larr;</Link>}
      </div>
      <span className={styles.title}>{title}</span>
      <div className={styles.slot}>{action}</div>
    </header>
  );
}
