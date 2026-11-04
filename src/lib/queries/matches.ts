import {
  collection,
  orderBy,
  type DocumentSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Match } from "@/lib/types";
import { fetchPage, type Page } from "./paginate";

/** Un partido leído de Firestore; los datos los escribe solo el servidor. */
export function matchFromSnapshot(snap: DocumentSnapshot): Match {
  return { id: snap.id, ...snap.data() } as Match;
}

/**
 * Una página de los partidos de una organización: de a 10, del día más reciente
 * al más antiguo y, el mismo día, del último dado de alta al primero (RF-12).
 */
export function fetchMatchesPage(
  db: Firestore,
  organizationId: string,
  after: QueryDocumentSnapshot | null = null,
): Promise<Page<Match>> {
  return fetchPage(
    collection(db, "organizations", organizationId, "matches"),
    [orderBy("date", "desc"), orderBy("createdAt", "desc")],
    after,
    matchFromSnapshot,
  );
}
