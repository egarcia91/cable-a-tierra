"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { matchFromSnapshot } from "@/lib/queries/matches";
import type { Match } from "@/lib/types";

type State = { status: "loading" } | { status: "not-found" } | { status: "error" } | { status: "ready"; match: Match };

/** Un partido en vivo. */
export function useMatch(organizationId: string, matchId: string): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(
    () =>
      onSnapshot(
        doc(db, "organizations", organizationId, "matches", matchId),
        (snap) =>
          setState(
            snap.exists()
              ? { status: "ready", match: matchFromSnapshot(snap) }
              : { status: "not-found" },
          ),
        () => setState({ status: "error" }),
      ),
    [organizationId, matchId],
  );

  return state;
}
