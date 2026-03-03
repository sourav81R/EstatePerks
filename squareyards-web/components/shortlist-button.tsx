"use client";

import { usePortalState } from "./portal-state-provider";
import styles from "./property-actions.module.css";

type ShortlistButtonProps = {
  propertyId: string;
};

export function ShortlistButton({ propertyId }: ShortlistButtonProps) {
  const { toggleShortlist, isShortlisted } = usePortalState();
  const active = isShortlisted(propertyId);

  return (
    <button
      type="button"
      onClick={() => toggleShortlist(propertyId)}
      className={`${styles.actionBtn} ${active ? styles.activeShortlist : ""}`}
    >
      {active ? "Shortlisted" : "Shortlist"}
    </button>
  );
}
