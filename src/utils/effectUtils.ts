import type { GameState, Player } from "@/types/gameState.ts";
import type { EffectType } from "@/data/cards.ts";
import { isPhase } from "@/state/guards.ts";

// Re-export EffectType for consumers
export type { EffectType };

// Determine which player has the effect (lower card)
export function getEffectPlayer(state: GameState): Player | null {
  return state.activeEffectCard?.player ?? null;
}

// Determine the current effect type based on played cards
export function getCurrentEffectType(state: GameState): EffectType {
  return state.activeEffectCard?.effectType ?? "none";
}

// Get effect limit for current card
export function getEffectLimit(state: GameState): number {
  return state.activeEffectCard?.effectCount ?? 0;
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
    return "Click the mother to make her disappear";
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
  if (!isPhase(state, "EFFECT_PHASE")) return false;
  if (!state.undoSnapshot) return false;
  const limit = getEffectLimit(state);
  return state.effectActionsRemaining < limit;
}
