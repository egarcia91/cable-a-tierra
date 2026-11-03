"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Player, PlayerPrivate } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; player: Player & PlayerPrivate };

/** Un jugador/a con sus datos privados. Solo funciona para miembros (lo exigen las rules). */
export function usePlayerWithPrivate(organizationId: string, playerId: string): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDoc(doc(db, "organizations", organizationId, "players", playerId)),
      getDoc(doc(db, "organizations", organizationId, "playersPrivate", playerId)),
    ]).then(
      ([pub, priv]) => {
        if (cancelled) return;
        if (!pub.exists()) return setState({ status: "not-found" });
        setState({
          status: "ready",
          player: {
            id: pub.id,
            ...(pub.data() as Omit<Player, "id">),
            ...((priv.data() as PlayerPrivate | undefined) ?? { name: "", birthDate: null }),
          },
        });
      },
      () => !cancelled && setState({ status: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, [organizationId, playerId]);

  return state;
}
