import { formatDate } from "@/lib/format";
import type { Player } from "@/lib/players";

export function PlayersTable({ players, showPrivate }: { players: Player[]; showPrivate: boolean }) {
  if (players.length === 0) return <p>Todavía no hay jugadores/as.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Apodo</th>
          {showPrivate && <th>Nombre</th>}
          {showPrivate && <th>Nacimiento</th>}
          <th title="Partidos">PJ</th>
          <th title="Goles">G</th>
          <th title="Victorias">V</th>
          <th title="Empates">E</th>
          <th title="Derrotas">D</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={p.id}>
            <td>{p.nickname}</td>
            {showPrivate && <td>{p.fullName}</td>}
            {showPrivate && <td>{p.birthDate && formatDate(p.birthDate)}</td>}
            <td>{p.matches}</td>
            <td>{p.goals}</td>
            <td>{p.wins}</td>
            <td>{p.draws}</td>
            <td>{p.losses}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
