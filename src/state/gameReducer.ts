import type { GameState } from "@/types/gameState.ts";
import * as h from "@/state/actions/index.ts";

export { findById, getAllPieces } from "@/utils/boardUtils.ts";

export type GameAction =
  | h.SetupAction
  | h.CardAction
  | h.EffectAction
  | h.ActionPhaseAction
  | h.RoundAction
  | h.DevAction
  | h.InteractionAction;

export function gameReducer(state: GameState, action: GameAction): GameState {
  // prettier-ignore
  switch (action.type) {
    // Setup actions
    case "PLACE_SCIENTIST": return h.handlePlaceScientist(state, action);
    case "PLACE_MOTHER": return h.handlePlaceMother(state, action);
    case "PLACE_BABY": return h.handlePlaceBaby(state, action);
    case "REMOVE_PIECE": return h.handleRemovePiece(state, action);
    case "MOVE_PIECE_ON_TILE": return h.handleMovePieceOnTile(state, action);
    case "CONFIRM_RAPTOR_SETUP": return h.handleConfirmRaptorSetup(state);
    case "START_GAME": return h.handleStartGame(state);
    // Card actions
    case "PLAYER_READY": return h.handlePlayerReady(state, action);
    case "DRAW_CARDS": return h.handleDrawCards(state, action);
    case "PLAY_CARD": return h.handlePlayCard(state, action);
    case "CONFIRM_REVEAL": return h.handleConfirmReveal(state);
    // Effect actions (immediate, single-target)
    case "FRIGHTEN_SCIENTIST": return h.handleFrightenScientist(state, action);
    case "PUT_BABY_TO_SLEEP": return h.handlePutBabyToSleep(state, action);
    case "CALL_BABY": return h.handleCallBaby(state, action);
    case "DISAPPEARANCE": return h.handleDisappearance(state);
    case "MOTHER_RETURN": return h.handleMotherReturn(state, action);
    case "WAKE_BABY": return h.handleWakeBaby(state, action);
    case "REMOVE_MOTHER_SLEEP_TOKEN": return h.handleRemoveMotherSleepToken(state);
    case "PLACE_REINFORCEMENT": return h.handlePlaceReinforcement(state, action);
    case "PLACE_FIRE_TOKEN": return h.handlePlaceFireToken(state, action);
    case "MOVE_JEEP": return h.handleMoveJeep(state, action);
    case "END_EFFECT_PHASE": return h.handleEndEffectPhase(state);
    case "REVERT_EFFECT_PHASE": return h.handleRevertEffectPhase(state);
    // Action phase actions
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
    // Round actions
    case "END_ROUND": return h.handleEndRound(state);
    // Dev actions
    case "DEV_SKIP_TO_EFFECT": return h.handleDevSkipToEffect(state, action);
    case "DEV_SKIP_TO_ACTION": return h.handleDevSkipToAction(state, action);
    case "DEV_SKIP_TO_CARD_SELECTION": return h.handleDevSkipToCardSelection(state, action);
    case "LOAD_GAME": return h.handleLoadGame(state, action);
    case "TOGGLE_SHOW_COORDINATES": return h.handleToggleShowCoordinates(state);
    // Interaction actions
    case "SELECT_CARD": return h.interactionHandlers.SELECT_CARD(state, action);
    case "SET_NEW_DRAW": return h.interactionHandlers.SET_NEW_DRAW(state, action);
    case "SELECT_ACTOR": return h.interactionHandlers.SELECT_ACTOR(state, action);
    case "SAVE_ACTION_PHASE_STATE": return h.interactionHandlers.SAVE_ACTION_PHASE_STATE(state, action);
    case "CLEAR_ACTION_PHASE_STATE": return h.interactionHandlers.CLEAR_ACTION_PHASE_STATE(state);
    case "RESET_INTERACTION": return h.interactionHandlers.RESET_INTERACTION(state, action);
    case "RESET_ALL_INTERACTIONS": return h.interactionHandlers.RESET_ALL_INTERACTIONS(state);
    default: return state;
  }
}
