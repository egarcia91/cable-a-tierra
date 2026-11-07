import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Organization } from "@/lib/types";

export const ORGANIZATIONS_PAGE_SIZE = 10;

export type OrganizationsPage = {
  organizations: Organization[];
  /** Cursor para pedir la página siguiente; null si no hay más. */
  next: QueryDocumentSnapshot | null;
};

/**
 * Una página del listado de organizaciones: de a 10, por partidos finalizados de
 * mayor a menor y, a igual cantidad, alfabéticamente por nombre (RF-16a, RF-16b).
 */
export async function fetchOrganizationsPage(
  db: Firestore,
  after: QueryDocumentSnapshot | null = null,
): Promise<OrganizationsPage> {
  // Se pide uno de más para saber si hay página siguiente sin otra consulta.
  const constraints = [
    orderBy("finishedMatchCount", "desc"),
    orderBy("nameSort"),
    ...(after ? [startAfter(after)] : []),
    limit(ORGANIZATIONS_PAGE_SIZE + 1),
  ];
  const snap = await getDocs(query(collection(db, "organizations"), ...constraints));
  const docs = snap.docs.slice(0, ORGANIZATIONS_PAGE_SIZE);

  return {
    organizations: docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Organization, "id">) })),
    next: snap.docs.length > ORGANIZATIONS_PAGE_SIZE ? docs[docs.length - 1] : null,
  };
}
