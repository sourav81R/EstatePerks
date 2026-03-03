import Link from "next/link";

import { EmiCalculator } from "@/components/emi-calculator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import styles from "./emi-page.module.css";

export default function EmiCalculatorPage() {
  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.page}`}>
        <section className={styles.hero}>
          <p className="chip">Finance Tool</p>
          <h1 className="section-title">EMI Calculator For Home Buyers</h1>
          <p className="section-subtitle">
            Evaluate loan affordability and estimate your monthly EMI before booking token amount.
          </p>
          <div className={styles.links}>
            <Link href="/properties">Browse Properties</Link>
            <Link href="/compare">Compare Projects</Link>
          </div>
        </section>

        <EmiCalculator />

        <section className={styles.notes}>
          <article className="card">
            <p className={styles.noteTitle}>How advisors use this</p>
            <ul>
              <li>Keep EMI under ~40% of household monthly income.</li>
              <li>Compare loan scenarios across 15, 20, and 25 years.</li>
              <li>Leave room for maintenance, registration, and fit-out costs.</li>
            </ul>
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
