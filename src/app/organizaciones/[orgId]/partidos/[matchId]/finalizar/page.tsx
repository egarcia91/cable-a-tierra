import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/format";
import { getMatch } from "@/lib/matches";
import { getOrganization } from "@/lib/organizations";
import { FinishMatchForm } from "./form";

export default async function FinishMatchPage({
  params,
}: {
  params: Promise<{ orgId: string; matchId: string }>;
}) {
  const { orgId, matchId } = await params;
  const [user, org, match] = await Promise.all([getCurrentUser(), getOrganization(orgId), getMatch(orgId, matchId)]);
  if (!org || !match) notFound();
  if (user?.uid !== org.adminUid || match.status !== "pending") redirect(`/organizaciones/${orgId}`);

  return (
    <main>
      <h1>Finalizar partido</h1>
      <p>
        {formatDate(match.date)} · {match.place}
      </p>
      <FinishMatchForm orgId={orgId} matchId={matchId} teamA={match.teamA} teamB={match.teamB} />
    </main>
  );
}
