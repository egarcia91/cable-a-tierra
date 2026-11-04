"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { Page } from "@/lib/queries/paginate";

type State<T> = {
  items: T[];
  next: QueryDocumentSnapshot | null;
  status: "loading" | "ready" | "loading-more" | "error";
};

/**
 * Un listado que se va ampliando de a 10. `fetchPage` tiene que ser estable
 * (useCallback): si cambia, el listado arranca de nuevo.
 */
export function usePagedList<T>(fetchPage: (after: QueryDocumentSnapshot | null) => Promise<Page<T>>) {
  const [state, setState] = useState<State<T>>({ items: [], next: null, status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ items: [], next: null, status: "loading" });
    fetchPage(null).then(
      (page) => !cancelled && setState({ ...page, status: "ready" }),
      () => !cancelled && setState((s) => ({ ...s, status: "error" })),
    );
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!state.next) return;
    setState((s) => ({ ...s, status: "loading-more" }));
    try {
      const page = await fetchPage(state.next);
      setState((s) => ({ items: [...s.items, ...page.items], next: page.next, status: "ready" }));
    } catch {
      setState((s) => ({ ...s, status: "error" }));
    }
  }, [fetchPage, state.next]);

  return { ...state, hasMore: state.next !== null, loadMore };
}
