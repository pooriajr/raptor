import type { GameState, Player } from "@/types/gameState.ts";
import type { EffectType } from "@/data/cards.ts";

// Re-export EffectType for consumers
export type { EffectType };

// Determine which player has the effect (lower card)
export function getEffectPlayer(state: GameState): Player | null {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return null;
  return raptorCard.value < scientistCard.value ? "raptor" : "scientist";
}

// Determine the current effect type based on played cards
export function getCurrentEffectType(state: GameState): EffectType {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return "none";

  const effectPlayer = getEffectPlayer(state);
  if (effectPlayer === "raptor") {
    return raptorCard.effectType;
  } else {
    return scientistCard.effectType;
  }
}

// Get effect limit for current card
export function getEffectLimit(state: GameState): number {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return 0;

  const effectPlayer = getEffectPlayer(state);
  if (effectPlayer === "raptor") {
    return raptorCard.effectCount;
  } else {
    return scientistCard.effectCount;
  }
}

// Get instruction text for current effect
export function getEffectInstruction(state: GameState): string {
  const effectType = getCurrentEffectType(state);
  const limit = getEffectLimit(state);
  const used = limit - state.effectActionsRemaining;

  if (effectType === "fear") {
    return `Click scientists to frighten (${used}/${limit})`;
  } else if (effectType === "sleeping_gas") {
    return `Click baby raptors to put to sleep (${used}/${limit})`;
  } else if (effectType === "mothers_call") {
    return `Click a baby raptor, then a destination on mother's tile (${used}/${limit})`;
  } else if (effectType === "disappearance") {
    return "Mother disappears from the board";
  } else if (effectType === "recovery") {
    return `Click sleeping babies to wake up, or remove mother's sleep tokens (${used}/${limit})`;
  } else if (effectType === "reinforcements") {
    return `Click spaces on edges to place scientists (${used}/${limit})`;
  } else if (effectType === "fire") {
    return `Click spaces adjacent to scientists or fire (${used}/${limit})`;
  } else if (effectType === "jeep") {
    return `Click a scientist, then a destination (${used}/${limit})`;
  }
  return "No effect";
}

// Check if undo button should be shown for effect phase
export function shouldShowEffectUndo(state: GameState): boolean {
  if (state.phase !== "EFFECT_PHASE") return false;
  if (!state.effectPhaseSavedState) return false;
  const limit = getEffectLimit(state);
  return state.effectActionsRemaining < limit;
}
