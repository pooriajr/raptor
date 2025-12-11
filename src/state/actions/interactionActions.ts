import type { GameState, Player, InteractionState } from "@/types/gameState.ts";

// Action types for UI/interaction state
export type InteractionAction =
  // Card selection
  | { type: "SELECT_CARD"; player: Player; card: number | null }
  | { type: "SET_NEW_DRAW"; player: Player; isNewDraw: boolean }
  // Action phase
  | { type: "SELECT_ACTION_PIECE"; player: Player; pieceId: string | null }
  | { type: "SAVE_ACTION_PHASE_STATE"; savedState: GameState }
  | { type: "CLEAR_ACTION_PHASE_STATE" }
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

// Initial interaction state
const initialInteractionState: InteractionState = {
  selectedCard: null,
  isNewDraw: false,
  selectedActionPieceId: null,
};

export function handleSelectCard(state: GameState, action: { player: Player; card: number | null }): GameState {
  return updateInteraction(state, action.player, { selectedCard: action.card });
}

export function handleSetNewDraw(state: GameState, action: { player: Player; isNewDraw: boolean }): GameState {
  return updateInteraction(state, action.player, { isNewDraw: action.isNewDraw });
}

export function handleSelectActionPiece(
  state: GameState,
  action: { player: Player; pieceId: string | null },
): GameState {
  return updateInteraction(state, action.player, {
    selectedActionPieceId: action.pieceId,
  });
}

export function handleResetInteraction(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, initialInteractionState);
}

export function handleResetAllInteractions(state: GameState): GameState {
  return {
    ...state,
    raptorInteraction: { ...initialInteractionState },
    scientistInteraction: { ...initialInteractionState },
  };
}

export function handleSaveActionPhaseState(state: GameState, action: { savedState: GameState }): GameState {
  return {
    ...state,
    actionPhaseSavedState: action.savedState,
  };
}

export function handleClearActionPhaseState(state: GameState): GameState {
  return {
    ...state,
    actionPhaseSavedState: null,
  };
}

// Handler map for interaction actions
export const interactionHandlers = {
  SELECT_CARD: handleSelectCard,
  SET_NEW_DRAW: handleSetNewDraw,
  SELECT_ACTION_PIECE: handleSelectActionPiece,
  SAVE_ACTION_PHASE_STATE: handleSaveActionPhaseState,
  CLEAR_ACTION_PHASE_STATE: handleClearActionPhaseState,
  RESET_INTERACTION: handleResetInteraction,
  RESET_ALL_INTERACTIONS: handleResetAllInteractions,
};
