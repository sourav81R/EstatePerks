"use client";

import { usePortalState } from "./portal-state-provider";
import styles from "./property-actions.module.css";

type CompareButtonProps = {
  propertyId: string;
};

export function CompareButton({ propertyId }: CompareButtonProps) {
  const { toggleCompare, isCompared, compareIds } = usePortalState();
  const active = isCompared(propertyId);
  const limitReached = !active && compareIds.length >= 3;

  return (
    <button
      type="button"
      onClick={() => toggleCompare(propertyId)}
      className={`${styles.actionBtn} ${active ? styles.activeCompare : ""}`}
      disabled={limitReached}
      title={limitReached ? "You can compare up to 3 properties." : undefined}
    >
      {active ? "Compared" : "Compare"}
    </button>
  );
}
