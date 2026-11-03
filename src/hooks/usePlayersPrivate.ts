"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PlayerPrivate } from "@/lib/types";

/**
 * Nombre y fecha de nacimiento de todos los jugadores/as, por id. Solo se pide si
 * el usuario es miembro: para el resto las rules rechazan la consulta (RF-04d).
 */
export function usePlayersPrivate(organizationId: string, isMember: boolean): Map<string, PlayerPrivate> {
  const [byId, setById] = useState<Map<string, PlayerPrivate>>(new Map());

  useEffect(() => {
    if (!isMember) {
      setById(new Map());
      return;
    }
    return onSnapshot(
      collection(db, "organizations", organizationId, "playersPrivate"),
      (snap) => setById(new Map(snap.docs.map((d) => [d.id, d.data() as PlayerPrivate]))),
      () => setById(new Map()),
    );
  }, [organizationId, isMember]);

  return byId;
}
