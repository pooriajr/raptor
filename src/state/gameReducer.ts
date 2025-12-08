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

// Handler type - uses `any` for action since each handler has its own specific type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionHandler = (state: GameState, action: any) => GameState;

// Handler map
const handlers: Record<string, ActionHandler> = {
  // Setup actions
  PLACE_SCIENTIST: handlePlaceScientist,
  PLACE_MOTHER: handlePlaceMother,
  PLACE_BABY: handlePlaceBaby,
  START_GAME: handleStartGame,

  // Card actions
  PLAYER_READY: handlePlayerReady,
  DRAW_CARDS: handleDrawCards,
  PLAY_CARD: handlePlayCard,
  CONFIRM_REVEAL: handleConfirmReveal,

  // Effect actions
  FRIGHTEN_SCIENTISTS: handleFrightenScientists,
  PUT_BABIES_TO_SLEEP: handlePutBabiesToSleep,
  MOTHERS_CALL: handleMothersCall,
  DISAPPEARANCE: handleDisappearance,
  WAKE_BABIES: handleWakeBabies,
  REINFORCEMENTS: handleReinforcements,
  PLACE_FIRE: handlePlaceFire,
  JEEP_MOVES: handleJeepMoves,
  END_EFFECT_PHASE: handleEndEffectPhase,

  // Action phase actions
  ACTION_MOVE_BABY: handleActionMoveBaby,
  ACTION_MOVE_SCIENTIST: handleActionMoveScientist,
  ACTION_MOVE_MOTHER: handleActionMoveMother,
  ACTION_MOTHER_KILL_SCIENTIST: handleMotherKillScientist,
  ACTION_MOTHER_WAKE_BABY: handleMotherWakeBaby,
  ACTION_MOTHER_EXTINGUISH_FIRE: handleMotherExtinguishFire,
  ACTION_SCIENTIST_SLEEP_BABY: handleScientistSleepBaby,
  ACTION_SCIENTIST_CAPTURE_BABY: handleScientistCaptureBaby,
  ACTION_SCIENTIST_SHOOT_MOTHER: handleScientistShootMother,
  ACTION_SCIENTIST_STAND_UP: handleScientistStandUp,
  END_ACTION_PHASE: handleEndActionPhase,
  RESET_ACTION_PHASE: handleResetActionPhase,

  // Dev actions
  DEV_SKIP_TO_EFFECT: handleDevSkipToEffect,
  DEV_SKIP_TO_ACTION: handleDevSkipToAction,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  const handler = handlers[action.type];
  return handler ? handler(state, action) : state;
}
