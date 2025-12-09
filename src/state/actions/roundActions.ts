import type { GameState } from "@/types/gameState.ts";
import { discardPlayedCard, drawToHand } from "./cardActions.ts";

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
 * 1. Move played cards from hand to discard
 * 2. Draw cards to refill hand to 3 (shuffling discard into deck if needed)
 * 3. Reset round-based restrictions
 * 4. Transition to next round's card selection (SCIENTIST_READY)
 */
export function handleEndRound(state: GameState): GameState {
  if (state.phase !== "ROUND_END" && state.phase !== "ACTION_PHASE") {
    return state;
  }

  // Step 1: Discard played cards for both players
  const scientistAfterDiscard = discardPlayedCard(state.scientistCards);
  const raptorAfterDiscard = discardPlayedCard(state.raptorCards);

  // Step 2: Draw cards to refill hands to 3
  const scientistAfterDraw = drawToHand(scientistAfterDiscard);
  const raptorAfterDraw = drawToHand(raptorAfterDiscard);

  return {
    ...state,
    phase: "SCIENTIST_READY",
    // Updated card states
    scientistCards: scientistAfterDraw,
    raptorCards: raptorAfterDraw,
    // Reset action phase state
    actionPoints: 0,
    activePlayer: null,
    // Reset round-based restrictions
    aggressiveActionsUsed: [],
    frightenedThisRound: [],
    asleepThisRound: [],
    motherPaidWoundCost: false,
  };
}

// Handler map for round actions
export const roundHandlers = {
  END_ROUND: handleEndRound,
};
