"use client";

import Link from "next/link";

import { properties } from "@/lib/properties";

import { usePortalState } from "./portal-state-provider";
import styles from "./compare-drawer.module.css";

export function CompareDrawer() {
  const { compareIds, clearCompare } = usePortalState();
  if (!compareIds.length) return null;

  const selected = properties.filter((property) => compareIds.includes(property.id));
  const query = encodeURIComponent(compareIds.join(","));

  return (
    <aside className={styles.drawer}>
      <div className={styles.top}>
        <div>
          <p className={styles.title}>Compare Properties ({compareIds.length}/3)</p>
          <p className={styles.sub}>Pick up to 3 and compare key metrics.</p>
        </div>
        <button type="button" onClick={clearCompare} className={styles.clearBtn}>
          Clear
        </button>
      </div>
      <div className={styles.chips}>
        {selected.map((property) => (
          <span key={property.id} className={styles.chip}>
            {property.name}
          </span>
        ))}
      </div>
      <Link href={`/compare?ids=${query}`} className={styles.cta}>
        Open Compare
      </Link>
    </aside>
  );
}
