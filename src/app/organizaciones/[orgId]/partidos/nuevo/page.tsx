import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOrganization } from "@/lib/organizations";
import { listPlayers } from "@/lib/players";
import { NewMatchForm } from "./form";

export default async function NewMatchPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await getCurrentUser();
  const org = await getOrganization(orgId);
  if (!org) notFound();
  if (user?.uid !== org.adminUid) redirect(`/organizaciones/${orgId}`);

  const players = await listPlayers(orgId, null); // para armar equipos alcanza con el apodo

  return (
    <main>
      <h1>Nuevo partido · {org.name}</h1>
      <NewMatchForm orgId={orgId} players={players.map((p) => ({ id: p.id, nickname: p.nickname }))} />
    </main>
  );
}
