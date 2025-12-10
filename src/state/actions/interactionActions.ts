import type {
  GameState,
  Player,
  Position,
  PendingMothersCallMove,
  PendingReinforcement,
  PendingJeepMove,
  InteractionState,
  ActionPhaseSavedState,
} from "@/types/gameState.ts";

// Action types for UI/interaction state
export type InteractionAction =
  // Card selection
  | { type: "SELECT_CARD"; player: Player; card: number | null }
  | { type: "SET_NEW_DRAW"; player: Player; isNewDraw: boolean }
  // Effect phase selections
  | { type: "TOGGLE_EFFECT_TARGET"; player: Player; pieceId: string }
  | { type: "SET_EFFECT_TARGETS"; player: Player; pieceIds: string[] }
  | { type: "SELECT_BABY_FOR_CALL"; player: Player; babyId: string | null }
  | { type: "ADD_MOTHERS_CALL_MOVE"; player: Player; move: PendingMothersCallMove }
  | { type: "CLEAR_MOTHERS_CALL_MOVES"; player: Player }
  | { type: "ADD_REINFORCEMENT"; player: Player; placement: Position }
  | { type: "CLEAR_REINFORCEMENTS"; player: Player }
  | { type: "ADD_FIRE_PLACEMENT"; player: Player; position: Position }
  | { type: "CLEAR_FIRE_PLACEMENTS"; player: Player }
  | { type: "SELECT_SCIENTIST_FOR_JEEP"; player: Player; scientistId: string | null }
  | { type: "ADD_JEEP_MOVE"; player: Player; move: PendingJeepMove }
  | { type: "CLEAR_JEEP_MOVES"; player: Player }
  | { type: "SET_MOTHER_TOKEN_REMOVALS"; player: Player; count: number }
  // Action phase
  | { type: "SELECT_ACTION_PIECE"; player: Player; pieceId: string | null }
  | { type: "SAVE_ACTION_PHASE_STATE"; savedState: ActionPhaseSavedState }
  | { type: "CLEAR_ACTION_PHASE_STATE" }
  // Reset all interaction state
  | { type: "RESET_INTERACTION"; player: Player }
  | { type: "RESET_ALL_INTERACTIONS" };

// Helper to get interaction state for a player
function getInteraction(state: GameState, player: Player): InteractionState {
  return player === "raptor" ? state.raptorInteraction : state.scientistInteraction;
}

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
  selectedEffectTargets: [],
  selectedBabyForCall: null,
  pendingMothersCallMoves: [],
  pendingReinforcementPlacements: [],
  reinforcementIdCounter: 0,
  pendingFirePlacements: [],
  selectedScientistForJeep: null,
  pendingJeepMoves: [],
  pendingMotherTokenRemovals: 0,
  selectedActionPieceId: null,
};

export function handleSelectCard(state: GameState, action: { player: Player; card: number | null }): GameState {
  return updateInteraction(state, action.player, { selectedCard: action.card });
}

export function handleSetNewDraw(state: GameState, action: { player: Player; isNewDraw: boolean }): GameState {
  return updateInteraction(state, action.player, { isNewDraw: action.isNewDraw });
}

export function handleToggleEffectTarget(state: GameState, action: { player: Player; pieceId: string }): GameState {
  const interaction = getInteraction(state, action.player);
  const current = interaction.selectedEffectTargets;

  const newTargets = current.includes(action.pieceId)
    ? current.filter((id) => id !== action.pieceId)
    : [...current, action.pieceId];

  return updateInteraction(state, action.player, { selectedEffectTargets: newTargets });
}

export function handleSetEffectTargets(state: GameState, action: { player: Player; pieceIds: string[] }): GameState {
  return updateInteraction(state, action.player, { selectedEffectTargets: action.pieceIds });
}

export function handleSelectBabyForCall(
  state: GameState,
  action: { player: Player; babyId: string | null },
): GameState {
  return updateInteraction(state, action.player, { selectedBabyForCall: action.babyId });
}

export function handleAddMothersCallMove(
  state: GameState,
  action: { player: Player; move: PendingMothersCallMove },
): GameState {
  const interaction = getInteraction(state, action.player);
  return updateInteraction(state, action.player, {
    pendingMothersCallMoves: [...interaction.pendingMothersCallMoves, action.move],
    selectedBabyForCall: null, // Clear selection after adding move
  });
}

export function handleClearMothersCallMoves(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, {
    pendingMothersCallMoves: [],
    selectedBabyForCall: null,
  });
}

export function handleAddReinforcement(state: GameState, action: { player: Player; placement: Position }): GameState {
  const interaction = getInteraction(state, action.player);
  const newPlacement: PendingReinforcement = {
    id: interaction.reinforcementIdCounter,
    tileId: action.placement.tileId,
    x: action.placement.x,
    y: action.placement.y,
  };
  return updateInteraction(state, action.player, {
    pendingReinforcementPlacements: [...interaction.pendingReinforcementPlacements, newPlacement],
    reinforcementIdCounter: interaction.reinforcementIdCounter + 1,
  });
}

export function handleClearReinforcements(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, {
    pendingReinforcementPlacements: [],
  });
}

export function handleAddFirePlacement(state: GameState, action: { player: Player; position: Position }): GameState {
  const interaction = getInteraction(state, action.player);
  return updateInteraction(state, action.player, {
    pendingFirePlacements: [...interaction.pendingFirePlacements, action.position],
  });
}

export function handleClearFirePlacements(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, {
    pendingFirePlacements: [],
  });
}

export function handleSelectScientistForJeep(
  state: GameState,
  action: { player: Player; scientistId: string | null },
): GameState {
  return updateInteraction(state, action.player, {
    selectedScientistForJeep: action.scientistId,
  });
}

export function handleAddJeepMove(state: GameState, action: { player: Player; move: PendingJeepMove }): GameState {
  const interaction = getInteraction(state, action.player);
  return updateInteraction(state, action.player, {
    pendingJeepMoves: [...interaction.pendingJeepMoves, action.move],
    selectedScientistForJeep: null, // Clear selection after adding move
  });
}

export function handleClearJeepMoves(state: GameState, action: { player: Player }): GameState {
  return updateInteraction(state, action.player, {
    pendingJeepMoves: [],
    selectedScientistForJeep: null,
  });
}

export function handleSetMotherTokenRemovals(state: GameState, action: { player: Player; count: number }): GameState {
  return updateInteraction(state, action.player, {
    pendingMotherTokenRemovals: action.count,
  });
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

export function handleSaveActionPhaseState(state: GameState, action: { savedState: ActionPhaseSavedState }): GameState {
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
  TOGGLE_EFFECT_TARGET: handleToggleEffectTarget,
  SET_EFFECT_TARGETS: handleSetEffectTargets,
  SELECT_BABY_FOR_CALL: handleSelectBabyForCall,
  ADD_MOTHERS_CALL_MOVE: handleAddMothersCallMove,
  CLEAR_MOTHERS_CALL_MOVES: handleClearMothersCallMoves,
  ADD_REINFORCEMENT: handleAddReinforcement,
  CLEAR_REINFORCEMENTS: handleClearReinforcements,
  ADD_FIRE_PLACEMENT: handleAddFirePlacement,
  CLEAR_FIRE_PLACEMENTS: handleClearFirePlacements,
  SELECT_SCIENTIST_FOR_JEEP: handleSelectScientistForJeep,
  ADD_JEEP_MOVE: handleAddJeepMove,
  CLEAR_JEEP_MOVES: handleClearJeepMoves,
  SET_MOTHER_TOKEN_REMOVALS: handleSetMotherTokenRemovals,
  SELECT_ACTION_PIECE: handleSelectActionPiece,
  SAVE_ACTION_PHASE_STATE: handleSaveActionPhaseState,
  CLEAR_ACTION_PHASE_STATE: handleClearActionPhaseState,
  RESET_INTERACTION: handleResetInteraction,
  RESET_ALL_INTERACTIONS: handleResetAllInteractions,
};
