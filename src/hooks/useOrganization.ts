"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Organization } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; organization: Organization };

/** Organización en vivo: se actualiza sola cuando el admin la edita. */
export function useOrganization(id: string): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(
    () =>
      onSnapshot(
        doc(db, "organizations", id),
        (snap) =>
          setState(
            snap.exists()
              ? { status: "ready", organization: { id: snap.id, ...(snap.data() as Omit<Organization, "id">) } }
              : { status: "not-found" },
          ),
        () => setState({ status: "error" }),
      ),
    [id],
  );

  return state;
}
