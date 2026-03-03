import Link from "next/link";

import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <p className={styles.brand}>EstatePerks</p>
            <p className={styles.copy}>
              Platform for verified listings, project insights, and advisory workflows inspired by
              modern property portals.
            </p>
          </div>
          <div>
            <p className={styles.heading}>Popular</p>
            <div className={styles.links}>
              <Link href="/properties?city=Gurgaon">New Projects in Gurgaon</Link>
              <Link href="/properties?city=Bangalore">Flats in Bangalore</Link>
              <Link href="/properties?type=Plot">Plots for Sale</Link>
              <Link href="/compare">Compare Properties</Link>
              <Link href="/tools/emi-calculator">EMI Calculator</Link>
            </div>
          </div>
          <div>
            <p className={styles.heading}>Contact</p>
            <p className={styles.copy}>+91 99999 11111</p>
            <p className={styles.copy}>advisory@estateperks.in</p>
            <p className={styles.copy}>Mon-Sat, 9am-8pm</p>
          </div>
        </div>
        <p className={styles.meta}>
          2026 EstatePerks. Property details are indicative; verify project documents and RERA
          records before transacting.
        </p>
      </div>
    </footer>
  );
}
