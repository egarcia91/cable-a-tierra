"use client";

import { useCallback } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { fetchMatchesPage } from "@/lib/queries/matches";
import { usePagedList } from "./usePagedList";

/** Partidos de una organización, de a 10 (RF-12b). */
export function useMatchesList(organizationId: string) {
  const fetchPage = useCallback(
    (after: QueryDocumentSnapshot | null) => fetchMatchesPage(db, organizationId, after),
    [organizationId],
  );
  return usePagedList(fetchPage);
}
