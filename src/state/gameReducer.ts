import type { GameState } from "@/types/gameState.ts";

// Re-export commonly used helpers for external use
export { findById, getAllPieces } from "@/utils/boardUtils.ts";
export type { ActionPhaseSavedState } from "@/state/actions/actionPhaseActions.ts";

// Import handler maps and action types
import { setupHandlers, type SetupAction } from "@/state/actions/setupActions.ts";
import { cardHandlers, type CardAction } from "@/state/actions/cardActions.ts";
import { effectHandlers, type EffectAction } from "@/state/actions/effectActions.ts";
import { actionPhaseHandlers, type ActionPhaseAction } from "@/state/actions/actionPhaseActions.ts";
import { devHandlers, type DevAction } from "@/state/actions/devActions.ts";

// Combined action type
export type GameAction = SetupAction | CardAction | EffectAction | ActionPhaseAction | DevAction;

// Handler type - uses `any` for action since each handler has its own specific type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionHandler = (state: GameState, action: any) => GameState;

// Combined handler map
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
