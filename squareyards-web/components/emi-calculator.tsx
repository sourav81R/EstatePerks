"use client";

import { useMemo, useState } from "react";

import styles from "./emi-calculator.module.css";

function calculateEmi(principal: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;
  if (!principal || !annualRate || !years) return 0;
  const factor = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function EmiCalculator() {
  const [homeValueLakh, setHomeValueLakh] = useState(150);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanYears, setLoanYears] = useState(20);
  const [monthlyIncome, setMonthlyIncome] = useState(220000);

  const principal = useMemo(
    () => Math.max(0, homeValueLakh * 100000 * (1 - downPaymentPct / 100)),
    [homeValueLakh, downPaymentPct],
  );

  const emi = useMemo(() => calculateEmi(principal, interestRate, loanYears), [principal, interestRate, loanYears]);
  const recommendedCap = monthlyIncome * 0.4;
  const ratio = monthlyIncome ? (emi / monthlyIncome) * 100 : 0;
  const totalPayment = emi * loanYears * 12;
  const totalInterest = totalPayment - principal;

  return (
    <section className={styles.grid}>
      <article className={`${styles.panel} card`}>
        <p className={styles.title}>Home Loan EMI Calculator</p>
        <p className={styles.sub}>Estimate monthly outflow and affordability before site visits.</p>

        <div className={styles.controls}>
          <label>
            Property value (Rs lakh)
            <input
              type="number"
              min={30}
              step={5}
              value={homeValueLakh}
              onChange={(event) => setHomeValueLakh(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Down payment (%)
            <input
              type="number"
              min={5}
              max={90}
              value={downPaymentPct}
              onChange={(event) => setDownPaymentPct(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Interest rate (% p.a.)
            <input
              type="number"
              step={0.1}
              min={5}
              max={16}
              value={interestRate}
              onChange={(event) => setInterestRate(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Loan tenure (years)
            <input
              type="number"
              min={5}
              max={35}
              value={loanYears}
              onChange={(event) => setLoanYears(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Monthly household income (Rs)
            <input
              type="number"
              min={20000}
              step={5000}
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(Number(event.target.value) || 0)}
            />
          </label>
        </div>
      </article>

      <article className={`${styles.panel} card`}>
        <p className={styles.title}>Result Snapshot</p>
        <div className={styles.resultGrid}>
          <div>
            <p className={styles.resultLabel}>Estimated EMI</p>
            <p className={styles.resultValue}>Rs {Math.round(emi).toLocaleString("en-IN")}/month</p>
          </div>
          <div>
            <p className={styles.resultLabel}>Loan principal</p>
            <p className={styles.resultValue}>Rs {Math.round(principal).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className={styles.resultLabel}>Total interest</p>
            <p className={styles.resultValue}>Rs {Math.round(totalInterest).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className={styles.resultLabel}>Total repayment</p>
            <p className={styles.resultValue}>Rs {Math.round(totalPayment).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.affordability}>
          <p className={styles.resultLabel}>EMI / Income ratio</p>
          <div className={styles.meter}>
            <span style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }} />
          </div>
          <p className={styles.meta}>
            Current: {ratio.toFixed(1)}% | Recommended max:{" "}
            {Math.round(recommendedCap).toLocaleString("en-IN")} Rs/month (40%)
          </p>
        </div>
      </article>
    </section>
  );
}
