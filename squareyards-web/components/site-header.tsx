import Link from "next/link";

import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logoWrap}>
          <span className={styles.logoMark}>EP</span>
          <div>
            <p className={styles.logoName}>EstatePerks</p>
            <p className={styles.logoTag}>India Property Exchange</p>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/properties">Buy</Link>
          <Link href="/properties?type=Plot">Plots</Link>
          <Link href="/properties?city=Gurgaon">Projects in Gurgaon</Link>
          <Link href="/properties?city=Bangalore">Projects in Bangalore</Link>
          <Link href="/compare">Compare</Link>
          <Link href="/tools/emi-calculator">EMI Calculator</Link>
        </nav>

        <Link href="/properties" className={`${styles.action} btn btn-primary`}>
          Explore Projects
        </Link>
      </div>
    </header>
  );
}
