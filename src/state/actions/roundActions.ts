import type { GameState } from "@/types/gameState.ts";
import { drawToHand } from "./cardActions.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";

// Action types for round management
export type RoundAction = { type: "END_ROUND" };

/**
 * Handle END_ROUND action
 *
 * This happens after:
 * - Action phase ends (higher card player finished spending action points)
 * - Cards match (no effect or action phase, round ends immediately)
 *
 * Round end does:
 * 1. Draw cards to refill hand to 3 (shuffling discard into deck if needed)
 *    Note: Cards are already discarded during CARD_REVEAL exit
 * 2. Reset round-based restrictions
 * 3. Transition to next round's card selection (SCIENTIST_READY)
 */
export function handleEndRound(state: GameState): GameState {
  if (state.phase !== "ROUND_END" && state.phase !== "ACTION_PHASE") {
    return state;
  }

  // Draw cards to refill hands to 3 (cards already discarded during CARD_REVEAL exit)
  const scientistAfterDraw = drawToHand(state.scientistCards);
  const raptorAfterDraw = drawToHand(state.raptorCards);

  const newState = {
    ...state,
    // Updated card states
    scientistCards: scientistAfterDraw,
    raptorCards: raptorAfterDraw,
    // Reset action phase state
    actionPoints: 0,
    activeEffectCard: null,
    // Reset round-based restrictions
    aggressiveActionsUsed: [],
    frightenedThisRound: [],
    asleepThisRound: [],
    motherPaidWoundCost: false,
    motherDisappeared: false,
    // Note: observationActive is NOT reset here - it persists to the next card selection
  };
  return transitionToPhase(newState, "SCIENTIST_READY");
}

// Handler map for round actions
export const roundHandlers = {
  END_ROUND: handleEndRound,
};
