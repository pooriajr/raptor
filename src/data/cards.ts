// Unified card data - single source of truth for all card information

export type Player = "raptor" | "scientist";

export type EffectType =
  | "fear"
  | "sleeping_gas"
  | "mothers_call"
  | "disappearance"
  | "recovery"
  | "reinforcements"
  | "fire"
  | "jeep"
  | "none";

export type CardId =
  | "raptor_1_mothers_call"
  | "raptor_2_disappearance"
  | "raptor_3_fear"
  | "raptor_4_mothers_call"
  | "raptor_5_recovery"
  | "raptor_6_disappearance"
  | "raptor_7_recovery"
  | "raptor_8_fear"
  | "raptor_9_none"
  | "scientist_1_sleeping_gas"
  | "scientist_2_reinforcements"
  | "scientist_3_jeep"
  | "scientist_4_sleeping_gas"
  | "scientist_5_fire"
  | "scientist_6_reinforcements"
  | "scientist_7_fire"
  | "scientist_8_jeep"
  | "scientist_9_none";

export interface CardInfo {
  id: CardId;
  value: number;
  player: Player;
  effectType: EffectType;
  name: string;
  icon: string;
  description: string;
  effectCount: number;
  shufflesDeck: boolean;
}

// All 18 cards in the game
export const CARDS: Record<CardId, CardInfo> = {
  // Raptor cards
  raptor_1_mothers_call: {
    id: "raptor_1_mothers_call",
    value: 1,
    player: "raptor",
    effectType: "mothers_call",
    name: "Mother's Call",
    icon: "📣",
    description: "Move 1 baby raptor to mother's tile. Shuffles deck.",
    effectCount: 1,
    shufflesDeck: true,
  },
  raptor_2_disappearance: {
    id: "raptor_2_disappearance",
    value: 2,
    player: "raptor",
    effectType: "disappearance",
    name: "Disappearance/Observation",
    icon: "👁️",
    description: "Remove mother from board temporarily. See opponent's next card before choosing yours.",
    effectCount: 0,
    shufflesDeck: false,
  },
  raptor_3_fear: {
    id: "raptor_3_fear",
    value: 3,
    player: "raptor",
    effectType: "fear",
    name: "Fear",
    icon: "😱",
    description: "Frighten 1 scientist. Frightened scientists cannot move or act until stood up.",
    effectCount: 1,
    shufflesDeck: false,
  },
  raptor_4_mothers_call: {
    id: "raptor_4_mothers_call",
    value: 4,
    player: "raptor",
    effectType: "mothers_call",
    name: "Mother's Call",
    icon: "📣",
    description: "Move up to 2 baby raptors to mother's tile.",
    effectCount: 2,
    shufflesDeck: false,
  },
  raptor_5_recovery: {
    id: "raptor_5_recovery",
    value: 5,
    player: "raptor",
    effectType: "recovery",
    name: "Recovery",
    icon: "💚",
    description: "Remove sleep tokens from mother and/or wake sleeping babies (2 actions).",
    effectCount: 2,
    shufflesDeck: false,
  },
  raptor_6_disappearance: {
    id: "raptor_6_disappearance",
    value: 6,
    player: "raptor",
    effectType: "disappearance",
    name: "Disappearance/Observation",
    icon: "👁️",
    description: "Remove mother from board temporarily. See opponent's next card before choosing yours.",
    effectCount: 0,
    shufflesDeck: false,
  },
  raptor_7_recovery: {
    id: "raptor_7_recovery",
    value: 7,
    player: "raptor",
    effectType: "recovery",
    name: "Recovery",
    icon: "💚",
    description: "Remove sleep tokens from mother and/or wake sleeping babies (3 actions).",
    effectCount: 3,
    shufflesDeck: false,
  },
  raptor_8_fear: {
    id: "raptor_8_fear",
    value: 8,
    player: "raptor",
    effectType: "fear",
    name: "Fear",
    icon: "😱",
    description: "Frighten up to 2 scientists. Frightened scientists cannot move or act until stood up.",
    effectCount: 2,
    shufflesDeck: false,
  },
  raptor_9_none: {
    id: "raptor_9_none",
    value: 9,
    player: "raptor",
    effectType: "none",
    name: "No Effect",
    icon: "⭕",
    description: "No special effect. Higher number means more action points if you win the round.",
    effectCount: 0,
    shufflesDeck: false,
  },

  // Scientist cards
  scientist_1_sleeping_gas: {
    id: "scientist_1_sleeping_gas",
    value: 1,
    player: "scientist",
    effectType: "sleeping_gas",
    name: "Sleeping Gas",
    icon: "💨",
    description: "Put 1 baby raptor to sleep on the same or adjacent tile. Shuffles deck.",
    effectCount: 1,
    shufflesDeck: true,
  },
  scientist_2_reinforcements: {
    id: "scientist_2_reinforcements",
    value: 2,
    player: "scientist",
    effectType: "reinforcements",
    name: "Reinforcements",
    icon: "🧑‍🔬",
    description: "Place 1-2 scientists from reserve onto long edges of square tiles.",
    effectCount: 2,
    shufflesDeck: false,
  },
  scientist_3_jeep: {
    id: "scientist_3_jeep",
    value: 3,
    player: "scientist",
    effectType: "jeep",
    name: "Jeep",
    icon: "🚙",
    description: "Move scientists in straight lines (2 moves total). Extinguishes fires passed through.",
    effectCount: 2,
    shufflesDeck: false,
  },
  scientist_4_sleeping_gas: {
    id: "scientist_4_sleeping_gas",
    value: 4,
    player: "scientist",
    effectType: "sleeping_gas",
    name: "Sleeping Gas",
    icon: "💨",
    description: "Put up to 2 baby raptors to sleep on the same or adjacent tiles.",
    effectCount: 2,
    shufflesDeck: false,
  },
  scientist_5_fire: {
    id: "scientist_5_fire",
    value: 5,
    player: "scientist",
    effectType: "fire",
    name: "Fire",
    icon: "🔥",
    description: "Place 2 fire tokens adjacent to scientists or existing fires. Blocks raptor movement.",
    effectCount: 2,
    shufflesDeck: false,
  },
  scientist_6_reinforcements: {
    id: "scientist_6_reinforcements",
    value: 6,
    player: "scientist",
    effectType: "reinforcements",
    name: "Reinforcements",
    icon: "🧑‍🔬",
    description: "Place 1-2 scientists from reserve onto long edges of square tiles.",
    effectCount: 2,
    shufflesDeck: false,
  },
  scientist_7_fire: {
    id: "scientist_7_fire",
    value: 7,
    player: "scientist",
    effectType: "fire",
    name: "Fire",
    icon: "🔥",
    description: "Place 3 fire tokens adjacent to scientists or existing fires. Blocks raptor movement.",
    effectCount: 3,
    shufflesDeck: false,
  },
  scientist_8_jeep: {
    id: "scientist_8_jeep",
    value: 8,
    player: "scientist",
    effectType: "jeep",
    name: "Jeep",
    icon: "🚙",
    description: "Move scientists in straight lines (4 moves total). Extinguishes fires passed through.",
    effectCount: 4,
    shufflesDeck: false,
  },
  scientist_9_none: {
    id: "scientist_9_none",
    value: 9,
    player: "scientist",
    effectType: "none",
    name: "No Effect",
    icon: "⭕",
    description: "No special effect. Higher number means more action points if you win the round.",
    effectCount: 0,
    shufflesDeck: false,
  },
};
