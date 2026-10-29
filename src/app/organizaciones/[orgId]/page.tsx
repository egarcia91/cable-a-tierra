import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { MAX_PLAYERS_PER_ORG } from "@/lib/domain/validation";
import { getOrganization } from "@/lib/organizations";
import { listMatches } from "@/lib/matches";
import { listPlayers } from "@/lib/players";
import { MatchesList } from "./matches-list";
import { NewPlayerForm } from "./new-player-form";
import { PlayersTable } from "./players-table";

export default async function OrganizationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await getCurrentUser();
  const [org, players, matches] = await Promise.all([
    getOrganization(orgId),
    listPlayers(orgId, user?.uid ?? null),
    listMatches(orgId),
  ]);
  if (!org) notFound();

  const isAdmin = user?.uid === org.adminUid;

  return (
    <main>
      <h1>{org.name}</h1>
      {org.description && <p>{org.description}</p>}
      {isAdmin && <p>Sos admin de esta organización.</p>}

      <section>
        <h2>
          Jugadores/as ({org.playerCount}/{MAX_PLAYERS_PER_ORG})
        </h2>
        <PlayersTable players={players} showPrivate={isAdmin} />
        {isAdmin &&
          (org.playerCount < MAX_PLAYERS_PER_ORG ? (
            <NewPlayerForm orgId={orgId} />
          ) : (
            <p>La organización llegó al máximo de {MAX_PLAYERS_PER_ORG} jugadores/as.</p>
          ))}
      </section>

      <section>
        <h2>Partidos</h2>
        {isAdmin && <Link href={`/organizaciones/${orgId}/partidos/nuevo`}>Nuevo partido</Link>}
        <MatchesList orgId={orgId} matches={matches} canFinish={isAdmin} />
      </section>
    </main>
  );
}
