import type { GameState } from "@/types/gameState.ts";
import type { GameAction } from "@/state/gameReducer.ts";
import type { SoundId } from "./sounds";
import { isPhase } from "@/state/guards.ts";

export function getSoundForAction(action: GameAction, state: GameState): SoundId | null {
  switch (action.type) {
    // Setup
    case "PLACE_MOTHER":
      return "setup_place_mother";
    case "PLACE_BABY":
      return "setup_place_baby";
    case "PLACE_SCIENTIST":
      return "setup_place_scientist";
    case "REMOVE_PIECE":
      return "setup_remove_piece";
    case "MOVE_PIECE_ON_TILE":
      return "setup_move_piece_on_tile";

    // Interaction / UI
    case "DISMISS_PRIVACY":
      return "ui_privacy_dismiss";
    case "SELECT_CARD":
      return state.activePlayer === action.player && action.card ? "ui_card_select" : "ui_card_deselect";
    case "SELECT_ACTOR":
      return action.pieceId ? "ui_actor_select" : "ui_actor_deselect";
    case "RESET_ACTION_PHASE":
    case "REVERT_EFFECT_PHASE":
      return "ui_undo";

    // Phase / flow
    case "ADVANCE_PHASE":
      return null;

    // Dev / persistence
    case "DEV_SKIP_TO_EFFECT":
    case "DEV_SKIP_TO_ACTION":
    case "DEV_SKIP_TO_CARD_SELECTION":
    case "LOAD_GAME":
    case "RESET_GAME":
      return null;

    // Effects
    case "FRIGHTEN_SCIENTIST":
      return "effect_fear";
    case "PUT_BABY_TO_SLEEP":
      return "effect_sleeping_gas";
    case "CALL_BABY":
      return "effect_mothers_call";
    case "DISAPPEARANCE":
      return "effect_disappearance";
    case "WAKE_BABY":
      return "effect_recovery_wake_baby";
    case "REMOVE_MOTHER_SLEEP_TOKEN":
      return "effect_recovery_remove_sleep_token";
    case "PLACE_REINFORCEMENT":
      return "effect_reinforcements";
    case "PLACE_FIRE_TOKEN":
      return "effect_fire_place";
    case "MOVE_JEEP":
      return "effect_jeep_move";
    case "MOTHER_RETURN":
      return isPhase(state, "MOTHER_RETURN") ? "effect_mother_return_place" : null;

    // Action phase
    case "ACTION_MOVE_BABY":
      return "action_move_baby";
    case "ACTION_MOVE_SCIENTIST":
      return "action_move_scientist";
    case "ACTION_MOVE_MOTHER":
      return "action_move_mother";
    case "ACTION_MOTHER_KILL_SCIENTIST":
      return "action_mother_kill";
    case "ACTION_MOTHER_WAKE_BABY":
      return "action_mother_wake_baby";
    case "ACTION_MOTHER_EXTINGUISH_FIRE":
      return "action_mother_extinguish_fire";
    case "ACTION_SCIENTIST_SLEEP_BABY":
      return "action_scientist_sleep_baby";
    case "ACTION_SCIENTIST_CAPTURE_BABY":
      return "action_scientist_capture_baby";
    case "ACTION_SCIENTIST_SHOOT_MOTHER":
      return "action_scientist_shoot_mother";
    case "ACTION_SCIENTIST_STAND_UP":
      return "action_scientist_stand_up";

    // Misc / plumbing
    case "DRAW_CARDS":
      return "cards_draw";
    case "SET_NEW_DRAW":
      return "ui_click_secondary";
    case "RESET_INTERACTION":
    case "RESET_ALL_INTERACTIONS":
      return "ui_click_secondary";
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
