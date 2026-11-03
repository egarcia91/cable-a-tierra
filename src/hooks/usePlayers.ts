"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Player } from "@/lib/types";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; players: Player[] };

/** Jugadores/as de una organización en vivo, por apodo. */
export function usePlayers(organizationId: string): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "organizations", organizationId, "players"), orderBy("nicknameSort")),
        (snap) =>
          setState({
            status: "ready",
            players: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Player, "id">) })),
          }),
        () => setState({ status: "error" }),
      ),
    [organizationId],
  );

  return state;
}
