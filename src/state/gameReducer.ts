import type { GameState } from "@/types/gameState.ts";

// Re-export commonly used helpers for external use
export { findById, getAllPieces } from "@/utils/boardUtils.ts";
export type { ActionPhaseSavedState } from "@/state/actions/actionPhaseActions.ts";

// Import action handlers
import {
  handlePlaceScientist,
  handlePlaceMother,
  handlePlaceBaby,
  handleStartGame,
  type SetupAction,
} from "@/state/actions/setupActions.ts";

import {
  handlePlayerReady,
  handleDrawCards,
  handlePlayCard,
  handleConfirmReveal,
  type CardAction,
} from "@/state/actions/cardActions.ts";

import {
  handleFrightenScientists,
  handlePutBabiesToSleep,
  handleMothersCall,
  handleDisappearance,
  handleWakeBabies,
  handleReinforcements,
  handlePlaceFire,
  handleJeepMoves,
  handleEndEffectPhase,
  type EffectAction,
} from "@/state/actions/effectActions.ts";

import {
  handleActionMoveBaby,
  handleActionMoveScientist,
  handleActionMoveMother,
  handleMotherKillScientist,
  handleMotherWakeBaby,
  handleMotherExtinguishFire,
  handleScientistSleepBaby,
  handleScientistCaptureBaby,
  handleScientistShootMother,
  handleScientistStandUp,
  handleEndActionPhase,
  handleResetActionPhase,
  type ActionPhaseAction,
} from "@/state/actions/actionPhaseActions.ts";

import { handleDevSkipToEffect, handleDevSkipToAction, type DevAction } from "@/state/actions/devActions.ts";

// Combined action type
export type GameAction = SetupAction | CardAction | EffectAction | ActionPhaseAction | DevAction;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // Setup actions
    case "PLACE_SCIENTIST":
      return handlePlaceScientist(state, action);
    case "PLACE_MOTHER":
      return handlePlaceMother(state, action);
    case "PLACE_BABY":
      return handlePlaceBaby(state, action);
    case "START_GAME":
      return handleStartGame(state);

    // Card actions
    case "PLAYER_READY":
      return handlePlayerReady(state, action);
    case "DRAW_CARDS":
      return handleDrawCards(state, action);
    case "PLAY_CARD":
      return handlePlayCard(state, action);
    case "CONFIRM_REVEAL":
      return handleConfirmReveal(state);

    // Effect actions
    case "FRIGHTEN_SCIENTISTS":
      return handleFrightenScientists(state, action);
    case "PUT_BABIES_TO_SLEEP":
      return handlePutBabiesToSleep(state, action);
    case "MOTHERS_CALL":
      return handleMothersCall(state, action);
    case "DISAPPEARANCE":
      return handleDisappearance(state);
    case "WAKE_BABIES":
      return handleWakeBabies(state, action);
    case "REINFORCEMENTS":
      return handleReinforcements(state, action);
    case "PLACE_FIRE":
      return handlePlaceFire(state, action);
    case "JEEP_MOVES":
      return handleJeepMoves(state, action);
    case "END_EFFECT_PHASE":
      return handleEndEffectPhase(state);

    // Action phase actions
    case "ACTION_MOVE_BABY":
      return handleActionMoveBaby(state, action);
    case "ACTION_MOVE_SCIENTIST":
      return handleActionMoveScientist(state, action);
    case "ACTION_MOVE_MOTHER":
      return handleActionMoveMother(state, action);
    case "ACTION_MOTHER_KILL_SCIENTIST":
      return handleMotherKillScientist(state, action);
    case "ACTION_MOTHER_WAKE_BABY":
      return handleMotherWakeBaby(state, action);
    case "ACTION_MOTHER_EXTINGUISH_FIRE":
      return handleMotherExtinguishFire(state, action);
    case "ACTION_SCIENTIST_SLEEP_BABY":
      return handleScientistSleepBaby(state, action);
    case "ACTION_SCIENTIST_CAPTURE_BABY":
      return handleScientistCaptureBaby(state, action);
    case "ACTION_SCIENTIST_SHOOT_MOTHER":
      return handleScientistShootMother(state, action);
    case "ACTION_SCIENTIST_STAND_UP":
      return handleScientistStandUp(state, action);
    case "END_ACTION_PHASE":
      return handleEndActionPhase(state);
    case "RESET_ACTION_PHASE":
      return handleResetActionPhase(state, action);

    // Dev actions
    case "DEV_SKIP_TO_EFFECT":
      return handleDevSkipToEffect(state, action);
    case "DEV_SKIP_TO_ACTION":
      return handleDevSkipToAction(state, action);

    default:
      return state;
  }
}
