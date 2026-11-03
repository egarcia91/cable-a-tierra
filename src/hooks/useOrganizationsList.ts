"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { fetchOrganizationsPage } from "@/lib/queries/organizations";
import type { Organization } from "@/lib/types";

type State = {
  organizations: Organization[];
  next: QueryDocumentSnapshot | null;
  status: "loading" | "ready" | "loading-more" | "error";
};

/** Listado de organizaciones que se va ampliando de a 10 (RF-16b). */
export function useOrganizationsList() {
  const [state, setState] = useState<State>({ organizations: [], next: null, status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchOrganizationsPage(db).then(
      (page) => !cancelled && setState({ ...page, status: "ready" }),
      () => !cancelled && setState((s) => ({ ...s, status: "error" })),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.next) return;
    setState((s) => ({ ...s, status: "loading-more" }));
    try {
      const page = await fetchOrganizationsPage(db, state.next);
      setState((s) => ({ organizations: [...s.organizations, ...page.organizations], next: page.next, status: "ready" }));
    } catch {
      setState((s) => ({ ...s, status: "error" }));
    }
  }, [state.next]);

  return { ...state, hasMore: state.next !== null, loadMore };
}
