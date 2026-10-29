import { DomainError } from "./errors";

export const MAX_TEXT_LENGTH = 40; // RF-19a, RF-19b
export const MAX_PLAYERS_PER_ORG = 40; // RF-07e
export const MIN_BIRTH_DATE = "1920-01-01"; // RF-19c

export const MAX_ORG_NAME_LENGTH = 60;
export const MAX_ORG_DESCRIPTION_LENGTH = 300;

export interface OrganizationInput {
  name: string;
  description: string;
}

export interface PlayerInput {
  fullName: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD
}

export interface LineupEntry {
  playerId: string | null; // null = jugador/a externo/a (RF-08e)
  nickname: string;
}

export interface MatchInput {
  date: string; // YYYY-MM-DD
  place: string;
  teamA: LineupEntry[];
  teamB: LineupEntry[];
}

// Cuenta caracteres reales, no unidades UTF-16.
const length = (s: string) => [...s].length;

function requireText(value: string, label: string, max = MAX_TEXT_LENGTH): string {
  const trimmed = value.trim();
  if (trimmed === "") throw new DomainError(`${label} es obligatorio.`);
  if (length(trimmed) > max) throw new DomainError(`${label} no puede tener más de ${max} caracteres.`);
  return trimmed;
}

function requireDate(value: string, label: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match && new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  // El round-trip descarta fechas inexistentes como 2023-02-30.
  if (!date || date.toISOString().slice(0, 10) !== value) {
    throw new DomainError(`${label} no es una fecha válida.`);
  }
  return value;
}

export function validateOrganization(input: OrganizationInput): OrganizationInput {
  const name = requireText(input.name, "El nombre", MAX_ORG_NAME_LENGTH);
  const description = input.description.trim();
  if (length(description) > MAX_ORG_DESCRIPTION_LENGTH) {
    throw new DomainError(`La descripción no puede tener más de ${MAX_ORG_DESCRIPTION_LENGTH} caracteres.`);
  }
  return { name, description };
}

export function validatePlayer(input: PlayerInput): PlayerInput {
  const fullName = requireText(input.fullName, "El nombre");
  const nickname = requireText(input.nickname, "El apodo");
  const birthDate = requireDate(input.birthDate, "La fecha de nacimiento");
  if (birthDate < MIN_BIRTH_DATE) {
    throw new DomainError("La fecha de nacimiento no puede ser anterior al 01/01/1920.");
  }
  if (birthDate > new Date().toISOString().slice(0, 10)) {
    throw new DomainError("La fecha de nacimiento no puede ser futura.");
  }
  return { fullName, nickname, birthDate };
}

export function assertCanAddPlayer(currentCount: number): void {
  if (currentCount >= MAX_PLAYERS_PER_ORG) {
    throw new DomainError(`La organización ya tiene ${MAX_PLAYERS_PER_ORG} jugadores/as.`);
  }
}

// Los equipos llegan del formulario como JSON: no se confía en su forma.
export function parseLineup(json: string): Pick<MatchInput, "teamA" | "teamB"> {
  const invalid = () => new DomainError("Los equipos tienen un formato inválido.");
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw invalid();
  }
  const isEntry = (e: unknown): e is LineupEntry =>
    typeof e === "object" &&
    e !== null &&
    (typeof (e as LineupEntry).playerId === "string" || (e as LineupEntry).playerId === null) &&
    typeof (e as LineupEntry).nickname === "string";
  const isTeam = (t: unknown): t is LineupEntry[] => Array.isArray(t) && t.every(isEntry);

  const { teamA, teamB } = (data ?? {}) as Record<string, unknown>;
  if (!isTeam(teamA) || !isTeam(teamB)) throw invalid();
  const clean = (team: LineupEntry[]) => team.map(({ playerId, nickname }) => ({ playerId, nickname }));
  return { teamA: clean(teamA), teamB: clean(teamB) };
}

export function validateMatch(input: MatchInput): MatchInput {
  const date = requireDate(input.date, "El día del partido");
  const place = requireText(input.place, "El lugar", 80);

  const teams = [input.teamA, input.teamB];
  teams.forEach((team, i) => {
    if (team.length === 0) {
      throw new DomainError(`El equipo ${i === 0 ? "A" : "B"} debe tener al menos 1 jugador/a.`);
    }
  });
  // Solo los externos/as necesitan apodo: el de los jugadores/as de la organización
  // lo pone el servidor desde la base.
  const [teamA, teamB] = teams.map((team) =>
    team.map((p) => ({
      playerId: p.playerId,
      nickname: p.playerId ? p.nickname : requireText(p.nickname, "El apodo del externo/a"),
    })),
  );

  const ids = [...teamA, ...teamB].flatMap((p) => (p.playerId ? [p.playerId] : []));
  if (new Set(ids).size !== ids.length) {
    throw new DomainError("Un jugador/a no puede estar dos veces en el mismo partido.");
  }

  return { date, place, teamA, teamB };
}
