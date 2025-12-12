import type { GameState, ScientistState, BabyState, MotherState } from "@/types/gameState.ts";
import { drawToHand } from "./cardActions.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";

// Reset per-round flags on all board scientists
function resetScientistRoundFlags(scientists: Record<string, ScientistState>): Record<string, ScientistState> {
  const result: Record<string, ScientistState> = {};
  for (const [id, scientist] of Object.entries(scientists)) {
    if (scientist.position !== null) {
      result[id] = {
        ...scientist,
        hasUsedAggressiveAction: false,
        frightenedThisRound: false,
      };
    } else {
      result[id] = scientist;
    }
  }
  return result;
}

// Reset per-round flags on all babies
function resetBabyRoundFlags(babies: Record<string, BabyState>): Record<string, BabyState> {
  const result: Record<string, BabyState> = {};
  for (const [id, baby] of Object.entries(babies)) {
    result[id] = {
      ...baby,
      asleepThisRound: false,
    };
  }
  return result;
}

// Reset per-round flags on mother
function resetMotherRoundFlags(mother: MotherState): MotherState {
  return {
    ...mother,
    paidWoundCost: false,
    disappeared: false,
    // Note: observationActive is NOT reset here - it persists to the next card selection
  };
}

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
 * 3. Transition to next round's card selection (SCIENTIST_CARD_SELECTION)
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
    // Reset per-round flags
    scientists: resetScientistRoundFlags(state.scientists),
    babies: resetBabyRoundFlags(state.babies),
    mother: resetMotherRoundFlags(state.mother),
    // Note: activeEffectCard and actionPoints are cleared when entering CARD_REVEAL
  };
  return transitionToPhase(newState, "SCIENTIST_CARD_SELECTION");
}

// Handler map for round actions
export const roundHandlers = {
  END_ROUND: handleEndRound,
};
