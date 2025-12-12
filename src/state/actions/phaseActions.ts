import type { GameState, GamePhase, Player, ScientistState, BabyState, MotherState } from "@/types/gameState.ts";
import { createInitialInteractionState } from "@/types/gameState.ts";
import { saveGame } from "@/utils/saveLoad.ts";
import { getEffectLimit } from "@/utils/effectUtils.ts";
import { drawToHand, discardPlayedCard, calculateRoundResolution, shuffleDiscardIntoDeck } from "./cardActions.ts";
import { isRaptorSetupComplete } from "@/utils/boardUtils.ts";
import { countPlacedScientists } from "@/utils/pieceUtils.ts";
import { CARDS } from "@/data/cards.ts";

// Reset per-round flags on all board scientists
function resetScientistRoundFlags(scientists: Record<string, ScientistState>): Record<string, ScientistState> {
  const result: Record<string, ScientistState> = {};
  for (const [id, scientist] of Object.entries(scientists)) {
    if (scientist.position) {
      result[id] = { ...scientist, hasUsedAggressiveAction: false, frightenedThisRound: false };
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
    result[id] = { ...baby, asleepThisRound: false };
  }
  return result;
}

// Reset per-round flags on mother
function resetMotherRoundFlags(mother: MotherState): MotherState {
  return {
    ...mother,
    paidWoundCost: false,
    disappeared: false,
  };
}

export type PhaseAction = { type: "ADVANCE_PHASE" };

/**
 * Save a snapshot of the current state for undo functionality.
 */
function saveUndoSnapshot(state: GameState): GameState {
  return { ...state, undoSnapshot: state };
}

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

  // Auto-save on phase changes (skip main menu and initial setup)
  if (nextPhase !== "MAIN_MENU" && nextPhase !== "RAPTOR_SETUP") {
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
    case "MAIN_MENU":
      return "RAPTOR_SETUP";

    case "RAPTOR_SETUP":
      if (!isRaptorSetupComplete(state)) return null;
      return "SCIENTIST_SETUP";

    case "SCIENTIST_SETUP":
      if (countPlacedScientists(state) < 4) return null;
      return "SCIENTIST_CARD_SELECTION";

    case "SCIENTIST_CARD_SELECTION":
      if (state.scientistInteraction.selectedCard === null) return null;
      return "RAPTOR_CARD_SELECTION";

    case "RAPTOR_CARD_SELECTION":
      if (state.raptorInteraction.selectedCard === null) return null;
      return "CARD_REVEAL";

    case "CARD_REVEAL": {
      // Cards match = skip to round end, otherwise effect phase
      const scientistCardId = state.scientistInteraction.selectedCard;
      const raptorCardId = state.raptorInteraction.selectedCard;
      if (scientistCardId && raptorCardId) {
        const scientistValue = CARDS[scientistCardId].value;
        const raptorValue = CARDS[raptorCardId].value;
        if (scientistValue === raptorValue) {
          return "ROUND_END";
        }
      }
      return "EFFECT_PHASE";
    }

    case "EFFECT_PHASE":
      return "ACTION_PHASE";

    case "ACTION_PHASE":
      // If mother disappeared, she needs to return first
      if (state.mother.disappeared) {
        return "MOTHER_RETURN";
      }
      return "ROUND_END";

    case "MOTHER_RETURN":
      return "ROUND_END";

    case "ROUND_END":
      return "SCIENTIST_CARD_SELECTION";

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
    return state.activeEffectCard?.player ?? null;
  }
  if (phase === "ACTION_PHASE") {
    // Higher card gets action points (opposite of effect player)
    const effectPlayer = state.activeEffectCard?.player;
    return effectPlayer === "raptor" ? "scientist" : effectPlayer === "scientist" ? "raptor" : null;
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

  // Discard selected cards when leaving card reveal
  if (exitingPhase === "CARD_REVEAL") {
    const scientistCardId = newState.scientistInteraction.selectedCard;
    const raptorCardId = newState.raptorInteraction.selectedCard;
    const scientistCard = scientistCardId ? CARDS[scientistCardId] : null;
    const raptorCard = raptorCardId ? CARDS[raptorCardId] : null;
    const scientistAfterDiscard = discardPlayedCard(newState.scientistCards, scientistCard);
    const raptorAfterDiscard = discardPlayedCard(newState.raptorCards, raptorCard);
    newState = {
      ...newState,
      scientistCards: scientistAfterDiscard,
      raptorCards: raptorAfterDiscard,
      scientistInteraction: { ...newState.scientistInteraction, selectedCard: null },
      raptorInteraction: { ...newState.raptorInteraction, selectedCard: null },
    };
  }

  // Clear effect phase state when leaving, and handle shuffle effect for card 1
  if (exitingPhase === "EFFECT_PHASE") {
    // Handle shuffle effect for card 1 (shuffles deck at end of effect phase)
    if (newState.activeEffectCard?.shufflesDeck) {
      const effectPlayer = newState.activeEffectCard.player;
      if (effectPlayer === "scientist") {
        newState = { ...newState, scientistCards: shuffleDiscardIntoDeck(newState.scientistCards) };
      } else if (effectPlayer === "raptor") {
        newState = { ...newState, raptorCards: shuffleDiscardIntoDeck(newState.raptorCards) };
      }
    }
    newState = {
      ...newState,
      effectActionsRemaining: 0,
      undoSnapshot: null,
    };
  }

  // Clear action phase state when leaving
  if (exitingPhase === "ACTION_PHASE") {
    newState = {
      ...newState,
      undoSnapshot: null,
      raptorInteraction: createInitialInteractionState(),
      scientistInteraction: createInitialInteractionState(),
    };
  }

  // Clear round resolution state when leaving ROUND_END (starting new round)
  if (exitingPhase === "ROUND_END") {
    newState = {
      ...newState,
      activeEffectCard: null,
      actionPoints: 0,
    };
  }

  return newState;
}

/**
 * Run entry effects when entering a phase.
 */
function runEntryEffects(state: GameState, enteringPhase: GamePhase): GameState {
  let newState = state;

  // Note: selectedCard is preserved through card selection phases until CARD_REVEAL exit
  // clears it after discarding the cards

  switch (enteringPhase) {
    case "RAPTOR_SETUP":
      // Raptor draws their initial hand when entering setup
      newState = {
        ...newState,
        raptorCards: drawToHand(newState.raptorCards),
      };
      break;

    case "SCIENTIST_SETUP":
      // Scientist draws their initial hand when entering setup
      newState = {
        ...newState,
        scientistCards: drawToHand(newState.scientistCards),
      };
      break;

    case "CARD_REVEAL": {
      // Calculate round resolution: activeEffectCard (lower card), actionPoints (difference), effectActionsRemaining
      const resolution = calculateRoundResolution(newState);
      newState = {
        ...newState,
        activeEffectCard: resolution.activeEffectCard,
        actionPoints: resolution.actionPoints,
        effectActionsRemaining: getEffectLimit({ ...newState, activeEffectCard: resolution.activeEffectCard }),
      };
      break;
    }

    case "EFFECT_PHASE": {
      // Save snapshot for undo
      newState = saveUndoSnapshot(newState);
      // Note: Disappearance is now triggered by clicking on mother, not automatic
      break;
    }

    case "ACTION_PHASE":
      // Save snapshot for undo functionality
      newState = saveUndoSnapshot(newState);
      break;

    case "ROUND_END": {
      // Draw new cards, reset round state (cards already discarded after CARD_REVEAL)
      // Note: activeEffectCard and actionPoints are preserved for CardResolution display
      newState = {
        ...newState,
        scientistCards: drawToHand(newState.scientistCards),
        raptorCards: drawToHand(newState.raptorCards),
        // Reset per-round flags
        scientists: resetScientistRoundFlags(newState.scientists),
        babies: resetBabyRoundFlags(newState.babies),
        mother: resetMotherRoundFlags(newState.mother),
      };
      break;
    }
  }

  return newState;
}

export const phaseHandlers = {
  ADVANCE_PHASE: handleAdvancePhase,
};
