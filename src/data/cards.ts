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
    name: "Mother's Call and Shuffle",
    icon: "📣",
    description:
      "Move an active baby raptor to a free space of your choice on the tile where the mother raptor is located. The baby raptor cannot move through spaces that are occupied by a figurine or a fire token. Then, shuffle your deck and your played cards (including this card) to create a new deck.",
    effectCount: 1,
    shufflesDeck: true,
  },
  raptor_2_disappearance: {
    id: "raptor_2_disappearance",
    value: 2,
    player: "raptor",
    effectType: "disappearance",
    name: "Disappearance and Observation",
    icon: "👁️",
    description:
      "Remove the mother raptor from the board. Then, after the Scientist player has spent all of his action points, place her back on a free space of your choice. The mother, hidden by the forest, observes the scientists; next round, the Scientist player shows you which card he has chosen before you choose yours.",
    effectCount: 1,
    shufflesDeck: false,
  },
  raptor_3_fear: {
    id: "raptor_3_fear",
    value: 3,
    player: "raptor",
    effectType: "fear",
    name: "Fear",
    icon: "😱",
    description:
      "Frighten one scientist of your choice; place its figurine on its side. This scientist becomes inactive (it cannot shoot, move, start a fire, or use sleeping gas) until it stands back up. The Scientist player must spend one action point to stand the figurine back up, but cannot do it this round.",
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
    description:
      "Move one or two active baby raptors to a free space of your choice on the tile where the mother raptor is located. These baby raptors cannot move through spaces that are occupied by a figurine or a fire token.",
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
    description:
      "Remove two sleep tokens from your player aid, or wake up two baby raptors (or remove one sleep token and wake up one baby).",
    effectCount: 2,
    shufflesDeck: false,
  },
  raptor_6_disappearance: {
    id: "raptor_6_disappearance",
    value: 6,
    player: "raptor",
    effectType: "disappearance",
    name: "Disappearance and Observation",
    icon: "👁️",
    description:
      "Remove the mother raptor from the board. Then, after the Scientist player has spent all of his action points, place her back on a free space of your choice. The mother, hidden by the forest, observes the scientists; next round, the Scientist player shows you which card he has chosen before you choose yours.",
    effectCount: 1,
    shufflesDeck: false,
  },
  raptor_7_recovery: {
    id: "raptor_7_recovery",
    value: 7,
    player: "raptor",
    effectType: "recovery",
    name: "Recovery",
    icon: "💚",
    description:
      "Remove three sleep tokens from your player aid, or wake up three baby raptors (or do a combination of both).",
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
    description:
      "Frighten one or two scientists of your choice; place each figurine on its side. These scientists become inactive (they cannot shoot, move, start a fire, or use sleeping gas) until they stand back up. The Scientist player must spend one action point to stand each figurine back up, but cannot do it this round.",
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
    description: "No effect.",
    effectCount: 0,
    shufflesDeck: false,
  },

  // Scientist cards
  scientist_1_sleeping_gas: {
    id: "scientist_1_sleeping_gas",
    value: 1,
    player: "scientist",
    effectType: "sleeping_gas",
    name: "Sleeping Gas and Shuffle",
    icon: "💨",
    description:
      "Put a baby raptor to sleep. The baby raptor must be located on the same tile as a scientist or on an orthogonally adjacent tile; place the baby raptor figurine on its side. The Raptor player must spend one action point to stand the figurine back up, but cannot do it this round. Then, shuffle your deck and your played cards (including this card) to create a new deck.",
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
    description:
      "Place one or two scientists from your reserve on empty spaces located along the long edges of the board. You can place these scientists only on the square tiles (not on the L-shaped tiles). If you do not have any scientists in your reserve, you do nothing this round.",
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
    description:
      "Move one or two scientists with a Jeep. When moving with a Jeep, a scientist can move in a straight line as many spaces as you like, as long as it does not run into an obstacle (i.e. a rock or another figurine). If the scientist moves through a space occupied by a fire token, the fire is put out; remove the fire token from the board. You may move the same scientist twice this round.",
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
    description:
      "Put one or two baby raptors to sleep. Each baby raptor must be located on the same tile as a scientist or on an orthogonally adjacent tile; place each baby raptor figurine on its side. The Raptor player must spend one action point to stand each figurine back up, but cannot do it this round.",
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
    description:
      "Place two fire tokens on free spaces of the board. A fire token can be placed only on a space adjacent to a scientist or another fire token (including one that was placed this round).",
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
    description:
      "Place one or two scientists from your reserve on empty spaces located along the long edges of the board. You can place these scientists only on the square tiles (not on the L-shaped tiles). If you do not have any scientists in your reserve, you do nothing this round.",
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
    description:
      "Place three fire tokens on free spaces of the board. A fire token can be placed only on a space adjacent to a scientist or another fire token (including one that was placed this round).",
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
    description:
      "Move up to four scientists with a Jeep. When moving with a Jeep, a scientist can move in a straight line as many spaces as you like, as long as it does not run into an obstacle (i.e. a rock or another figurine). If the scientist moves through a space occupied by a fire token, the fire is put out; remove the fire token from the board. You may move the same scientists multiple times.",
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
    description: "No effect.",
    effectCount: 0,
    shufflesDeck: false,
  },
};
