import type { DocumentSnapshot } from "firebase/firestore";
import type { Match } from "@/lib/types";

/** Un partido leído de Firestore; los datos los escribe solo el servidor. */
export function matchFromSnapshot(snap: DocumentSnapshot): Match {
  return { id: snap.id, ...snap.data() } as Match;
}
