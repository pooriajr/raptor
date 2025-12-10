import type { GameState, Player } from "@/types/gameState.ts";

// Effect types for card effects
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

// Determine which player has the effect
export function getEffectPlayer(state: GameState): Player | null {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return null;
  return raptorCard < scientistCard ? "raptor" : "scientist";
}

// Determine the current effect type based on played cards
export function getCurrentEffectType(state: GameState): EffectType {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return "none";

  const raptorHasEffect = raptorCard < scientistCard;

  if (raptorHasEffect) {
    // Raptor effects: 1=Mother's Call(1), 2=Disappearance, 3=Fear(1), 4=Mother's Call(2), 5=Recovery(2), 6=Disappearance, 7=Recovery(3), 8=Fear(2)
    if (raptorCard === 1 || raptorCard === 4) return "mothers_call";
    if (raptorCard === 2 || raptorCard === 6) return "disappearance";
    if (raptorCard === 3 || raptorCard === 8) return "fear";
    if (raptorCard === 5 || raptorCard === 7) return "recovery";
    return "none";
  } else {
    // Scientist effects: 1=Sleeping Gas(1), 2=Reinforcements(1-2), 3=Jeep(2), 4=Sleeping Gas(2), 5=Fire(2), 6=Reinforcements(1-2), 7=Fire(3), 8=Jeep(4)
    if (scientistCard === 1 || scientistCard === 4) return "sleeping_gas";
    if (scientistCard === 2 || scientistCard === 6) return "reinforcements";
    if (scientistCard === 3 || scientistCard === 8) return "jeep";
    if (scientistCard === 5 || scientistCard === 7) return "fire";
    return "none";
  }
}

// Get effect limit for current card
export function getEffectLimit(state: GameState): number {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return 0;

  const raptorHasEffect = raptorCard < scientistCard;

  if (raptorHasEffect) {
    // Raptor cards: 1=1 baby, 3=1 scientist, 4=2 babies, 5=2 recovery, 7=3 recovery, 8=2 scientists
    if (raptorCard === 1) return 1;
    if (raptorCard === 3) return 1;
    if (raptorCard === 4) return 2;
    if (raptorCard === 5) return 2; // Recovery x2
    if (raptorCard === 7) return 3; // Recovery x3
    if (raptorCard === 8) return 2;
    return 0;
  } else {
    // Scientist cards: 1=1 baby, 2=2 scientists, 3=2 jeep moves, 4=2 babies, 5=2 fire, 6=2 scientists, 7=3 fire, 8=4 jeep moves
    if (scientistCard === 1) return 1;
    if (scientistCard === 2 || scientistCard === 6) return 2; // Reinforcements
    if (scientistCard === 3) return 2; // Jeep x2
    if (scientistCard === 4) return 2;
    if (scientistCard === 5) return 2; // Fire x2
    if (scientistCard === 7) return 3; // Fire x3
    if (scientistCard === 8) return 4; // Jeep x4
    return 0;
  }
}

// Get instruction text for current effect
export function getEffectInstruction(state: GameState, player: Player): string {
  const effectType = getCurrentEffectType(state);
  const limit = getEffectLimit(state);
  const interaction = player === "raptor" ? state.raptorInteraction : state.scientistInteraction;
  const selectionCount = interaction.selectedEffectTargets.length;
  const pendingMothersCallMoves = interaction.pendingMothersCallMoves;
  const selectedBabyForCall = interaction.selectedBabyForCall;
  const pendingReinforcementPlacements = interaction.pendingReinforcementPlacements;
  const pendingFirePlacements = interaction.pendingFirePlacements;
  const selectedScientistForJeep = interaction.selectedScientistForJeep;
  const pendingJeepMoves = interaction.pendingJeepMoves;

  if (effectType === "fear") {
    return `Click scientists to frighten (${selectionCount}/${limit})`;
  } else if (effectType === "sleeping_gas") {
    return `Click baby raptors to put to sleep (${selectionCount}/${limit})`;
  } else if (effectType === "mothers_call") {
    if (selectedBabyForCall !== null) {
      return `Click a destination on mother's tile (${pendingMothersCallMoves.length}/${limit})`;
    } else {
      return `Click a baby raptor to call (${pendingMothersCallMoves.length}/${limit})`;
    }
  } else if (effectType === "disappearance") {
    return "Click Confirm to remove mother from the board";
  } else if (effectType === "recovery") {
    return `Click sleeping babies to wake up (${selectionCount}/${limit})`;
  } else if (effectType === "reinforcements") {
    return `Click spaces on edges to place scientists (${pendingReinforcementPlacements.length}/${limit})`;
  } else if (effectType === "fire") {
    return `Click spaces adjacent to scientists or fire (${pendingFirePlacements.length}/${limit})`;
  } else if (effectType === "jeep") {
    if (selectedScientistForJeep !== null) {
      return `Click a destination for the jeep (${pendingJeepMoves.length}/${limit})`;
    } else {
      return `Click a scientist to move by jeep (${pendingJeepMoves.length}/${limit})`;
    }
  }
  return "No effect";
}

// Check if undo button should be shown for effect phase
export function shouldShowEffectUndo(state: GameState, player: Player): boolean {
  const effectType = getCurrentEffectType(state);
  const interaction = player === "raptor" ? state.raptorInteraction : state.scientistInteraction;

  if (effectType === "fire") return interaction.pendingFirePlacements.length > 0;
  if (effectType === "jeep") return interaction.pendingJeepMoves.length > 0;
  return false;
}
