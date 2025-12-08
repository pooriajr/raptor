// Card effect data including name, icon, and detailed description
interface CardEffectData {
  name: string;
  icon: string;
  description: string;
}

export const SCIENTIST_EFFECTS: Record<number, CardEffectData> = {
  1: {
    name: "Sleeping Gas (1)",
    icon: "💨",
    description: "Put 1 baby raptor to sleep on the same or adjacent tile. Shuffles deck.",
  },
  2: {
    name: "Reinforcements",
    icon: "🚁",
    description: "Place 1-2 scientists from reserve onto long edges of square tiles.",
  },
  3: {
    name: "Jeep (x2)",
    icon: "🚙",
    description: "Move scientists in straight lines (2 moves total). Extinguishes fires passed through.",
  },
  4: {
    name: "Sleeping Gas (x2)",
    icon: "💨",
    description: "Put up to 2 baby raptors to sleep on the same or adjacent tiles.",
  },
  5: {
    name: "Fire (x2)",
    icon: "🔥",
    description: "Place 2 fire tokens adjacent to scientists or existing fires. Blocks raptor movement.",
  },
  6: {
    name: "Reinforcements",
    icon: "🚁",
    description: "Place 1-2 scientists from reserve onto long edges of square tiles.",
  },
  7: {
    name: "Fire (x3)",
    icon: "🔥",
    description: "Place 3 fire tokens adjacent to scientists or existing fires. Blocks raptor movement.",
  },
  8: {
    name: "Jeep (x4)",
    icon: "🚙",
    description: "Move scientists in straight lines (4 moves total). Extinguishes fires passed through.",
  },
  9: {
    name: "No effect",
    icon: "⭕",
    description: "No special effect. Higher number means more action points if you win the round.",
  },
};

export const RAPTOR_EFFECTS: Record<number, CardEffectData> = {
  1: {
    name: "Mother's Call (1)",
    icon: "📣",
    description: "Move 1 baby raptor to mother's tile. Shuffles deck.",
  },
  2: {
    name: "Disappearance",
    icon: "👻",
    description: "Remove mother from board temporarily. See opponent's next card before choosing yours.",
  },
  3: {
    name: "Fear (1)",
    icon: "😱",
    description: "Frighten 1 scientist. Frightened scientists cannot move or act until stood up.",
  },
  4: {
    name: "Mother's Call (2)",
    icon: "📣",
    description: "Move up to 2 baby raptors to mother's tile.",
  },
  5: {
    name: "Recovery (x2)",
    icon: "💚",
    description: "Remove sleep tokens from mother and/or wake sleeping babies (2 actions).",
  },
  6: {
    name: "Disappearance",
    icon: "👻",
    description: "Remove mother from board temporarily. See opponent's next card before choosing yours.",
  },
  7: {
    name: "Recovery (x3)",
    icon: "💚",
    description: "Remove sleep tokens from mother and/or wake sleeping babies (3 actions).",
  },
  8: {
    name: "Fear (x2)",
    icon: "😱",
    description: "Frighten up to 2 scientists. Frightened scientists cannot move or act until stood up.",
  },
  9: {
    name: "No effect",
    icon: "⭕",
    description: "No special effect. Higher number means more action points if you win the round.",
  },
};

export function getCardEffect(player: "raptor" | "scientist", value: number): string {
  const effects = player === "scientist" ? SCIENTIST_EFFECTS : RAPTOR_EFFECTS;
  return effects[value].name;
}

export function getCardIcon(player: "raptor" | "scientist", value: number): string {
  const effects = player === "scientist" ? SCIENTIST_EFFECTS : RAPTOR_EFFECTS;
  return effects[value].icon;
}

export function getCardDescription(player: "raptor" | "scientist", value: number): string {
  const effects = player === "scientist" ? SCIENTIST_EFFECTS : RAPTOR_EFFECTS;
  return effects[value].description;
}
