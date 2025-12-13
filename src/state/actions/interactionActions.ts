import type { GameState, Player, InteractionState } from "@/types/gameState.ts";
import { createInitialInteractionState } from "@/types/gameState.ts";
import type { CardId } from "@/data/cards.ts";

// Action types for UI/interaction state
export type InteractionAction =
  // Card selection
  | { type: "SELECT_CARD"; player: Player; card: CardId | null }
  | { type: "SET_NEW_DRAW"; player: Player; isNewDraw: boolean }
  | { type: "DISMISS_PRIVACY"; player: Player }
  // Actor selection (action phase and effect phase)
  | { type: "SELECT_ACTOR"; player: Player; pieceId: string | null }
  // Reset
  | { type: "RESET_INTERACTION"; player: Player }
  | { type: "RESET_ALL_INTERACTIONS" };

// Helper to update interaction state for a player
function updateInteraction(state: GameState, player: Player, updates: Partial<InteractionState>): GameState {
  if (player === "raptor") {
    return {
      ...state,
      raptorInteraction: { ...state.raptorInteraction, ...updates },
    };
  } else {
    return {
      ...state,
      scientistInteraction: { ...state.scientistInteraction, ...updates },
    };
  }
}

export function handleSelectCard(state: GameState, action: { player: Player; card: CardId | null }): GameState {
  return updateInteraction(state, action.player, { selectedCard: action.card });
}

export function handleSetNewDraw(state: GameState, action: { player: Player; isNewDraw: boolean }): GameState {
  return updateInteraction(state, action.player, { isNewDraw: action.isNewDraw });
}

export function handleDismissPrivacy(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, { privacyDismissed: true });
}

export function handleSelectActor(state: GameState, action: { player: Player; pieceId: string | null }): GameState {
  return updateInteraction(state, action.player, {
    selectedActorId: action.pieceId,
  });
}

export function handleResetInteraction(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, createInitialInteractionState());
}

export function handleResetAllInteractions(state: GameState): GameState {
  return {
    ...state,
    raptorInteraction: createInitialInteractionState(),
    scientistInteraction: createInitialInteractionState(),
  };
}

// Handler map for interaction actions
export const interactionHandlers = {
  SELECT_CARD: handleSelectCard,
  SET_NEW_DRAW: handleSetNewDraw,
  DISMISS_PRIVACY: handleDismissPrivacy,
  SELECT_ACTOR: handleSelectActor,
  RESET_INTERACTION: handleResetInteraction,
  RESET_ALL_INTERACTIONS: handleResetAllInteractions,
};
