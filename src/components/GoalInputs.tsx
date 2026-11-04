export type GoalsDraft = { goals: string; ownGoals: string };

export const NO_GOALS: GoalsDraft = { goals: "0", ownGoals: "0" };

/** Pasa lo cargado a números; si no son enteros ≥ 0 los rechaza el servidor (RF-08g). */
export const parseGoals = (draft: GoalsDraft) => ({ goals: Number(draft.goals), ownGoals: Number(draft.ownGoals) });

/** Goles y goles en contra de un lugar del equipo (RF-08b, RF-08c). */
export function GoalInputs({
  name,
  value,
  onChange,
}: {
  name: string;
  value: GoalsDraft;
  onChange: (value: GoalsDraft) => void;
}) {
  return (
    <div className="goals-row">
      <span>{name}</span>
      <label>
        Goles
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          aria-label={`Goles de ${name}`}
          value={value.goals}
          onChange={(e) => onChange({ ...value, goals: e.target.value })}
        />
      </label>
      <label>
        En contra
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          aria-label={`Goles en contra de ${name}`}
          value={value.ownGoals}
          onChange={(e) => onChange({ ...value, ownGoals: e.target.value })}
        />
      </label>
    </div>
  );
}
