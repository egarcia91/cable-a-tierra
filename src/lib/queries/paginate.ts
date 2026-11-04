import {
  getDocs,
  limit,
  query,
  startAfter,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

export const PAGE_SIZE = 10;

export type Page<T> = {
  items: T[];
  /** Cursor para pedir la página siguiente; null si no hay más. */
  next: QueryDocumentSnapshot | null;
};

/** Una página de a 10 de una consulta ordenada, a partir del cursor `after`. */
export async function fetchPage<T>(
  base: Query,
  order: QueryConstraint[],
  after: QueryDocumentSnapshot | null,
  toItem: (doc: QueryDocumentSnapshot) => T,
): Promise<Page<T>> {
  // Se pide uno de más para saber si hay página siguiente sin otra consulta.
  const constraints = [...order, ...(after ? [startAfter(after)] : []), limit(PAGE_SIZE + 1)];
  const snap = await getDocs(query(base, ...constraints));
  const docs = snap.docs.slice(0, PAGE_SIZE);
  return { items: docs.map(toItem), next: snap.docs.length > PAGE_SIZE ? docs[docs.length - 1] : null };
}
