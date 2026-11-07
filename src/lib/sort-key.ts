/** Clave para ordenar alfabéticamente sin distinguir mayúsculas ni tildes ("Ñandú" ~ "nandu"). */
export function sortKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
