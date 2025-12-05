// Card effect descriptions based on card number
export const SCIENTIST_EFFECTS: Record<number, string> = {
  1: "Sleeping Gas (1)",
  2: "Reinforcements",
  3: "Jeep (x2)",
  4: "Sleeping Gas (x2)",
  5: "Fire (x2)",
  6: "Reinforcements",
  7: "Fire (x3)",
  8: "Jeep (x4)",
  9: "No effect",
};

export const RAPTOR_EFFECTS: Record<number, string> = {
  1: "Mother's Call (1)",
  2: "Disappearance",
  3: "Fear (1)",
  4: "Mother's Call (2)",
  5: "Recovery (x2)",
  6: "Disappearance",
  7: "Recovery (x3)",
  8: "Fear (x2)",
  9: "No effect",
};

export function getCardEffect(player: "raptor" | "scientist", value: number): string {
  return player === "scientist" ? SCIENTIST_EFFECTS[value] : RAPTOR_EFFECTS[value];
}
