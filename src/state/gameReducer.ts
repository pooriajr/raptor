/**
 * Game Reducer
 *
 * Dispatches actions to handlers using a lookup table.
 * Each action file (e.g., setupActions.ts) exports a handler map like:
 *   { PLACE_SCIENTIST: handlePlaceScientist, PLACE_MOTHER: handlePlaceMother, ... }
 *
 * These are combined here, so dispatch("PLACE_SCIENTIST", ...) calls handlePlaceScientist.
 */

import type { GameState } from "@/types/gameState.ts";

export { findById, getAllPieces } from "@/utils/boardUtils.ts";
export type { ActionPhaseSavedState } from "@/state/actions/actionPhaseActions.ts";

import { setupHandlers, type SetupAction } from "@/state/actions/setupActions.ts";
import { cardHandlers, type CardAction } from "@/state/actions/cardActions.ts";
import { effectHandlers, type EffectAction } from "@/state/actions/effectActions.ts";
import { actionPhaseHandlers, type ActionPhaseAction } from "@/state/actions/actionPhaseActions.ts";
import { devHandlers, type DevAction } from "@/state/actions/devActions.ts";

export type GameAction = SetupAction | CardAction | EffectAction | ActionPhaseAction | DevAction;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionHandler = (state: GameState, action: any) => GameState;

const handlers: Record<string, ActionHandler> = {
  ...setupHandlers,
  ...cardHandlers,
  ...effectHandlers,
  ...actionPhaseHandlers,
  ...devHandlers,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  const handler = handlers[action.type];
  return handler ? handler(state, action) : state;
}
