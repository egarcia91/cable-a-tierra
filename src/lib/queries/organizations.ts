import { collection, orderBy, type Firestore, type QueryDocumentSnapshot } from "firebase/firestore";
import type { Organization } from "@/lib/types";
import { fetchPage, type Page } from "./paginate";

/**
 * Una página del listado de organizaciones: de a 10, por partidos finalizados de
 * mayor a menor y, a igual cantidad, alfabéticamente por nombre (RF-16a, RF-16b).
 */
export function fetchOrganizationsPage(
  db: Firestore,
  after: QueryDocumentSnapshot | null = null,
): Promise<Page<Organization>> {
  return fetchPage(
    collection(db, "organizations"),
    [orderBy("finishedMatchCount", "desc"), orderBy("nameSort")],
    after,
    (d) => ({ id: d.id, ...(d.data() as Omit<Organization, "id">) }),
  );
}
