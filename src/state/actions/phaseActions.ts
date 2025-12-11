import type { GameState, GamePhase, Player } from "@/types/gameState.ts";
import { createInitialInteractionState } from "@/types/gameState.ts";
import { saveGame } from "@/utils/saveLoad.ts";
import { getEffectLimit } from "@/utils/effectUtils.ts";
import { drawToHand, discardPlayedCard, getActionPhaseState } from "./cardActions.ts";
import { isRaptorSetupComplete } from "@/utils/boardUtils.ts";
import { countPlacedScientists } from "@/utils/pieceUtils.ts";

export type PhaseAction = { type: "ADVANCE_PHASE" };

/**
 * ADVANCE_PHASE - The single action that handles all phase transitions.
 *
 * Called when the player clicks "Done" or similar confirmation buttons.
 * Determines the next phase based on current phase and state,
 * then runs all exit effects for old phase and entry effects for new phase.
 */
export function handleAdvancePhase(state: GameState): GameState {
  const nextPhase = getNextPhase(state);
  if (!nextPhase) return state;

  let newState = runExitEffects(state, state.phase);
  newState = transitionTo(newState, nextPhase);
  newState = runEntryEffects(newState, nextPhase);

  // Auto-save on phase changes (skip initial setup)
  if (nextPhase !== "RAPTOR_SETUP") {
    saveGame(newState);
  }

  return newState;
}

/**
 * Determine the next phase based on current phase and game state.
 * Returns null if the phase cannot be advanced (invalid state).
 */
function getNextPhase(state: GameState): GamePhase | null {
  switch (state.phase) {
    case "RAPTOR_SETUP":
      if (!isRaptorSetupComplete(state)) return null;
      return "SCIENTIST_SETUP";

    case "SCIENTIST_SETUP":
      if (countPlacedScientists(state) < 4) return null;
      return "SCIENTIST_READY";

    case "SCIENTIST_READY":
      return "SCIENTIST_CARD_SELECTION";

    case "SCIENTIST_CARD_SELECTION":
      if (state.scientistCards.played === null) return null;
      return "RAPTOR_READY";

    case "RAPTOR_READY":
      return "RAPTOR_CARD_SELECTION";

    case "RAPTOR_CARD_SELECTION":
      if (state.raptorCards.played === null) return null;
      return "CARD_REVEAL";

    case "CARD_REVEAL":
      // Cards match = skip to round end, otherwise effect phase
      if (state.scientistCards.played?.value === state.raptorCards.played?.value) {
        return "ROUND_END";
      }
      return "EFFECT_PHASE";

    case "EFFECT_PHASE":
      return "ACTION_PHASE";

    case "ACTION_PHASE":
      // If mother disappeared, she needs to return first
      if (state.motherDisappeared) {
        return "MOTHER_RETURN";
      }
      return "ROUND_END";

    case "MOTHER_RETURN":
      return "ROUND_END";

    case "ROUND_END":
      return "SCIENTIST_READY";

    default:
      return null;
  }
}

/**
 * Get the active player for a given phase.
 */
function getActivePlayerForPhase(state: GameState, phase: GamePhase): Player | null {
  if (phase.startsWith("RAPTOR")) return "raptor";
  if (phase.startsWith("SCIENTIST")) return "scientist";
  if (phase === "EFFECT_PHASE") {
    // Lower card gets the effect
    return state.raptorCards.played!.value < state.scientistCards.played!.value ? "raptor" : "scientist";
  }
  if (phase === "ACTION_PHASE") {
    // Higher card gets action points
    return state.raptorCards.played!.value > state.scientistCards.played!.value ? "raptor" : "scientist";
  }
  if (phase === "MOTHER_RETURN") {
    return "raptor";
  }
  return state.activePlayer;
}

/**
 * Set phase and active player.
 */
function transitionTo(state: GameState, phase: GamePhase): GameState {
  return {
    ...state,
    phase,
    activePlayer: getActivePlayerForPhase(state, phase),
  };
}

/**
 * Run exit effects when leaving a phase.
 */
function runExitEffects(state: GameState, exitingPhase: GamePhase): GameState {
  let newState = state;

  // Clear effect phase state when leaving
  if (exitingPhase === "EFFECT_PHASE") {
    newState = {
      ...newState,
      effectActionsRemaining: 0,
      effectPhaseSavedState: null,
    };
  }

  // Clear action phase state when leaving
  if (exitingPhase === "ACTION_PHASE") {
    newState = {
      ...newState,
      actionPhaseSavedState: null,
      raptorInteraction: createInitialInteractionState(),
      scientistInteraction: createInitialInteractionState(),
    };
  }

  return newState;
}

/**
 * Run entry effects when entering a phase.
 */
function runEntryEffects(state: GameState, enteringPhase: GamePhase): GameState {
  let newState = state;

  // Reset selected card on any phase change
  const player = newState.activePlayer;
  if (player) {
    if (player === "raptor") {
      newState = { ...newState, raptorInteraction: { ...newState.raptorInteraction, selectedCard: null } };
    } else {
      newState = { ...newState, scientistInteraction: { ...newState.scientistInteraction, selectedCard: null } };
    }
  }

  switch (enteringPhase) {
    case "SCIENTIST_CARD_SELECTION":
      // Draw cards for both players
      newState = {
        ...newState,
        scientistCards: drawToHand(newState.scientistCards),
        raptorCards: drawToHand(newState.raptorCards),
      };
      break;

    case "EFFECT_PHASE": {
      // Save snapshot and set effect limit
      const effectActionsRemaining = getEffectLimit(newState);
      newState = {
        ...newState,
        effectActionsRemaining,
        effectPhaseSavedState: { ...newState, effectActionsRemaining },
      };
      // Auto-disappearance for raptor disappearance effect
      const raptorCard = newState.raptorCards.played;
      const scientistCard = newState.scientistCards.played;
      if (raptorCard !== null && scientistCard !== null) {
        const raptorHasEffect = raptorCard.value < scientistCard.value;
        if (raptorHasEffect && raptorCard.effectType === "disappearance") {
          newState = {
            ...newState,
            mother: { ...newState.mother, tileId: -1, x: 0, y: 0 },
            motherDisappeared: true,
          };
        }
      }
      break;
    }

    case "ACTION_PHASE":
      // Save snapshot and compute action points
      newState = {
        ...newState,
        ...getActionPhaseState(newState),
        actionPhaseSavedState: newState,
      };
      break;

    case "ROUND_END": {
      // Discard played cards, draw new ones, reset round state
      const scientistAfterDiscard = discardPlayedCard(newState.scientistCards);
      const raptorAfterDiscard = discardPlayedCard(newState.raptorCards);
      newState = {
        ...newState,
        scientistCards: drawToHand(scientistAfterDiscard),
        raptorCards: drawToHand(raptorAfterDiscard),
        actionPoints: 0,
        aggressiveActionsUsed: [],
        frightenedThisRound: [],
        asleepThisRound: [],
        motherPaidWoundCost: false,
        motherDisappeared: false,
      };
      break;
    }
  }

  return newState;
}

export const phaseHandlers = {
  ADVANCE_PHASE: handleAdvancePhase,
};
