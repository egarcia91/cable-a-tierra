"use client";

import { useCallback } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { fetchOrganizationsPage } from "@/lib/queries/organizations";
import { usePagedList } from "./usePagedList";

/** Listado de organizaciones que se va ampliando de a 10 (RF-16b). */
export function useOrganizationsList() {
  const fetchPage = useCallback((after: QueryDocumentSnapshot | null) => fetchOrganizationsPage(db, after), []);
  return usePagedList(fetchPage);
}
