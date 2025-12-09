import type { GameState } from "@/types/gameState.ts";
import * as h from "@/state/actions/index.ts";

export { findById, getAllPieces } from "@/utils/boardUtils.ts";
export type { ActionPhaseSavedState } from "@/state/actions/index.ts";

export type GameAction =
  | h.SetupAction
  | h.CardAction
  | h.EffectAction
  | h.ActionPhaseAction
  | h.RoundAction
  | h.DevAction;

export function gameReducer(state: GameState, action: GameAction): GameState {
  // prettier-ignore
  switch (action.type) {
    case "PLACE_SCIENTIST": return h.handlePlaceScientist(state, action);
    case "PLACE_MOTHER": return h.handlePlaceMother(state, action);
    case "PLACE_BABY": return h.handlePlaceBaby(state, action);
    case "REMOVE_PIECE": return h.handleRemovePiece(state, action);
    case "MOVE_PIECE_ON_TILE": return h.handleMovePieceOnTile(state, action);
    case "CONFIRM_RAPTOR_SETUP": return h.handleConfirmRaptorSetup(state);
    case "START_GAME": return h.handleStartGame(state);
    case "PLAYER_READY": return h.handlePlayerReady(state, action);
    case "DRAW_CARDS": return h.handleDrawCards(state, action);
    case "PLAY_CARD": return h.handlePlayCard(state, action);
    case "CONFIRM_REVEAL": return h.handleConfirmReveal(state);
    case "FRIGHTEN_SCIENTISTS": return h.handleFrightenScientists(state, action);
    case "PUT_BABIES_TO_SLEEP": return h.handlePutBabiesToSleep(state, action);
    case "MOTHERS_CALL": return h.handleMothersCall(state, action);
    case "DISAPPEARANCE": return h.handleDisappearance(state);
    case "WAKE_BABIES": return h.handleWakeBabies(state, action);
    case "REINFORCEMENTS": return h.handleReinforcements(state, action);
    case "PLACE_FIRE": return h.handlePlaceFire(state, action);
    case "JEEP_MOVES": return h.handleJeepMoves(state, action);
    case "END_EFFECT_PHASE": return h.handleEndEffectPhase(state);
    case "ACTION_MOVE_BABY": return h.handleActionMoveBaby(state, action);
    case "ACTION_MOVE_SCIENTIST": return h.handleActionMoveScientist(state, action);
    case "ACTION_MOVE_MOTHER": return h.handleActionMoveMother(state, action);
    case "ACTION_MOTHER_KILL_SCIENTIST": return h.handleMotherKillScientist(state, action);
    case "ACTION_MOTHER_WAKE_BABY": return h.handleMotherWakeBaby(state, action);
    case "ACTION_MOTHER_EXTINGUISH_FIRE": return h.handleMotherExtinguishFire(state, action);
    case "ACTION_SCIENTIST_SLEEP_BABY": return h.handleScientistSleepBaby(state, action);
    case "ACTION_SCIENTIST_CAPTURE_BABY": return h.handleScientistCaptureBaby(state, action);
    case "ACTION_SCIENTIST_SHOOT_MOTHER": return h.handleScientistShootMother(state, action);
    case "ACTION_SCIENTIST_STAND_UP": return h.handleScientistStandUp(state, action);
    case "END_ACTION_PHASE": return h.handleEndActionPhase(state);
    case "RESET_ACTION_PHASE": return h.handleResetActionPhase(state, action);
    case "END_ROUND": return h.handleEndRound(state);
    case "DEV_SKIP_TO_EFFECT": return h.handleDevSkipToEffect(state, action);
    case "DEV_SKIP_TO_ACTION": return h.handleDevSkipToAction(state, action);
    case "DEV_SKIP_TO_CARD_SELECTION": return h.handleDevSkipToCardSelection(state, action);
    case "LOAD_GAME": return h.handleLoadGame(state, action);
    default: return state;
  }
}
