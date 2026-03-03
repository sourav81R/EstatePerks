"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type PortalStateValue = {
  compareIds: string[];
  shortlistIds: string[];
  toggleCompare: (propertyId: string) => void;
  toggleShortlist: (propertyId: string) => void;
  isCompared: (propertyId: string) => boolean;
  isShortlisted: (propertyId: string) => boolean;
  clearCompare: () => void;
};

const PortalStateContext = createContext<PortalStateValue | null>(null);

const COMPARE_KEY = "estateperks:compare:v1";
const SHORTLIST_KEY = "estateperks:shortlist:v1";
const MAX_COMPARE = 3;

function readStorageArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function PortalStateProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(() => readStorageArray(COMPARE_KEY));
  const [shortlistIds, setShortlistIds] = useState<string[]>(() => readStorageArray(SHORTLIST_KEY));

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(shortlistIds));
  }, [shortlistIds]);

  const value = useMemo<PortalStateValue>(
    () => ({
      compareIds,
      shortlistIds,
      toggleCompare: (propertyId: string) => {
        setCompareIds((prev) => {
          if (prev.includes(propertyId)) return prev.filter((id) => id !== propertyId);
          if (prev.length >= MAX_COMPARE) return prev;
          return [...prev, propertyId];
        });
      },
      toggleShortlist: (propertyId: string) => {
        setShortlistIds((prev) =>
          prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
        );
      },
      isCompared: (propertyId: string) => compareIds.includes(propertyId),
      isShortlisted: (propertyId: string) => shortlistIds.includes(propertyId),
      clearCompare: () => setCompareIds([]),
    }),
    [compareIds, shortlistIds],
  );

  return <PortalStateContext.Provider value={value}>{children}</PortalStateContext.Provider>;
}

export function usePortalState() {
  const context = useContext(PortalStateContext);
  if (!context) {
    throw new Error("usePortalState must be used inside PortalStateProvider.");
  }
  return context;
}
