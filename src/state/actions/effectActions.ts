import type { GameState } from "@/types/gameState.ts";
import { findById, getAllPieces, isSpaceOccupied } from "@/utils/boardUtils.ts";
import { getReachableDestinationsOnMotherTile } from "@/utils/pathfinding.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "@/types/coordinates.ts";
import { getNextReserveScientist } from "@/utils/scientistUtils.ts";

// Action types for effect phase - single target actions (executed immediately)
export type EffectAction =
  | { type: "FRIGHTEN_SCIENTIST"; pieceId: string }
  | { type: "PUT_BABY_TO_SLEEP"; pieceId: string }
  | { type: "CALL_BABY"; babyId: string; tileId: number; x: number; y: number }
  | { type: "PLACE_REINFORCEMENT"; tileId: number; x: number; y: number }
  | { type: "PLACE_FIRE_TOKEN"; tileId: number; x: number; y: number }
  | {
      type: "MOVE_JEEP";
      scientistId: string;
      tileId: number;
      x: number;
      y: number;
      path: Array<{ tileId: number; x: number; y: number }>;
    }
  | { type: "DISAPPEARANCE" }
  | { type: "WAKE_BABY"; pieceId: string }
  | { type: "REMOVE_MOTHER_SLEEP_TOKEN" }
  | { type: "MOTHER_RETURN"; tileId: number; x: number; y: number }
  | { type: "REVERT_EFFECT_PHASE" };

// Helper to decrement effect actions remaining
function decrementEffectActions(state: GameState): GameState {
  return {
    ...state,
    effectActionsRemaining: state.effectActionsRemaining - 1,
  };
}

export function handleFrightenScientist(state: GameState, action: { pieceId: string }): GameState {
  const scientist = state.scientists[action.pieceId];
  if (!scientist?.position || scientist.isFrightened) return state;

  return decrementEffectActions({
    ...state,
    scientists: {
      ...state.scientists,
      [action.pieceId]: { ...scientist, isFrightened: true, frightenedThisRound: true },
    },
  });
}

export function handlePutBabyToSleep(state: GameState, action: { pieceId: string }): GameState {
  const baby = findById(state.babies, action.pieceId);
  if (!baby || baby.isAsleep) return state;

  return decrementEffectActions({
    ...state,
    babies: state.babies.map((b) => (b.id === action.pieceId ? { ...b, isAsleep: true } : b)),
    asleepThisRound: [...state.asleepThisRound, action.pieceId],
  });
}

export function handleCallBaby(
  state: GameState,
  action: { babyId: string; tileId: number; x: number; y: number },
): GameState {
  if (!state.mother) return state;

  const baby = findById(state.babies, action.babyId);
  if (!baby) return state;

  // Validate destination is on mother's tile
  if (action.tileId !== state.mother.tileId) return state;

  // Validate the destination is reachable via pathfinding
  const allPieces = getAllPieces(state);
  const reachable = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
  const isValidDestination = reachable.some(
    (pos) => pos.tileId === action.tileId && pos.x === action.x && pos.y === action.y,
  );
  if (!isValidDestination) return state;

  return decrementEffectActions({
    ...state,
    babies: state.babies.map((b) =>
      b.id === action.babyId ? { ...b, tileId: action.tileId, x: action.x, y: action.y } : b,
    ),
    // Clear actor selection after completing the move
    raptorInteraction: { ...state.raptorInteraction, selectedActorId: null },
  });
}

export function handleDisappearance(state: GameState): GameState {
  // Disappearance doesn't consume an action - it's automatic
  return {
    ...state,
    mother: { ...state.mother, tileId: -1, x: -1, y: -1 },
    motherDisappeared: true,
    observationActive: true,
  };
}

export function handleMotherReturn(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  if (state.phase !== "MOTHER_RETURN") return state;

  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile) return state;

  const space = tile.spaces.find((s) => s.coordinate.x === action.x && s.coordinate.y === action.y);
  if (!space || space.hasMountain || space.isUnusable || space.isExit) return state;

  // Check if space is occupied (excluding mother herself, since she can be repositioned)
  const isMotherHere =
    state.mother.tileId === action.tileId && state.mother.x === action.x && state.mother.y === action.y;
  if (!isMotherHere && isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  // Place the mother - phase transition to ROUND_END is handled by ADVANCE_PHASE
  return {
    ...state,
    mother: { ...state.mother, tileId: action.tileId, x: action.x, y: action.y },
  };
}

export function handleWakeBaby(state: GameState, action: { pieceId: string }): GameState {
  const baby = findById(state.babies, action.pieceId);
  if (!baby || !baby.isAsleep) return state;

  return decrementEffectActions({
    ...state,
    babies: state.babies.map((b) => (b.id === action.pieceId ? { ...b, isAsleep: false } : b)),
  });
}

export function handleRemoveMotherSleepToken(state: GameState): GameState {
  if (state.motherSleepTokens <= 0) return state;

  return decrementEffectActions({
    ...state,
    motherSleepTokens: state.motherSleepTokens - 1,
  });
}

export function handlePlaceReinforcement(
  state: GameState,
  action: { tileId: number; x: number; y: number },
): GameState {
  // Get next reserve scientist
  const reserveScientist = getNextReserveScientist(state.scientists);
  if (!reserveScientist) return state;

  // Validate placement on long edge of square tiles
  const topRowTiles = [1, 2, 3];
  const bottomRowTiles = [6, 7, 8];

  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile || tile.shape !== "square") return state;

  const isTopRow = topRowTiles.includes(action.tileId);
  const isBottomRow = bottomRowTiles.includes(action.tileId);
  if (!isTopRow && !isBottomRow) return state;

  const requiredY = isTopRow ? 0 : 2;
  if (action.y !== requiredY) return state;

  const space = tile.spaces.find((s) => s.coordinate.x === action.x && s.coordinate.y === action.y);
  if (!space || space.hasMountain) return state;

  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  return decrementEffectActions({
    ...state,
    scientists: {
      ...state.scientists,
      [reserveScientist.id]: {
        ...reserveScientist,
        position: { tileId: action.tileId, x: action.x, y: action.y },
      },
    },
  });
}

export function handlePlaceFireToken(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile) return state;

  const space = tile.spaces.find((s) => s.coordinate.x === action.x && s.coordinate.y === action.y);
  if (!space || space.hasMountain || space.isUnusable || space.isExit) return state;

  // Check no fire already at this location
  const hasFireAlready = state.fireTokens.some(
    (f) => f.tileId === action.tileId && f.x === action.x && f.y === action.y,
  );
  if (hasFireAlready) return state;

  // Check placement is adjacent to a scientist or existing fire
  const placementGlobal = localToGlobal(action.tileId, action.x, action.y);
  const adjacentGlobals = getAdjacentGlobalCoordinates(placementGlobal.globalX, placementGlobal.globalY);

  const isAdjacentToScientist = Object.values(state.scientists).some((s) => {
    if (!s.position) return false;
    const sGlobal = localToGlobal(s.position.tileId, s.position.x, s.position.y);
    return adjacentGlobals.some((adj) => adj.globalX === sGlobal.globalX && adj.globalY === sGlobal.globalY);
  });

  const isAdjacentToFire = state.fireTokens.some((f) => {
    const fGlobal = localToGlobal(f.tileId, f.x, f.y);
    return adjacentGlobals.some((adj) => adj.globalX === fGlobal.globalX && adj.globalY === fGlobal.globalY);
  });

  if (!isAdjacentToScientist && !isAdjacentToFire) return state;

  const newFire = {
    id: `fire-${state.fireTokens.length}`,
    tileId: action.tileId,
    x: action.x,
    y: action.y,
  };

  return decrementEffectActions({
    ...state,
    fireTokens: [...state.fireTokens, newFire],
  });
}

export function handleMoveJeep(
  state: GameState,
  action: {
    scientistId: string;
    tileId: number;
    x: number;
    y: number;
    path: Array<{ tileId: number; x: number; y: number }>;
  },
): GameState {
  const scientist = state.scientists[action.scientistId];
  if (!scientist?.position) return state;

  // Extinguish fires along the path (including destination)
  const allPositions = [...action.path, { tileId: action.tileId, x: action.x, y: action.y }];
  const updatedFireTokens = state.fireTokens.filter(
    (f) => !allPositions.some((pos) => f.tileId === pos.tileId && f.x === pos.x && f.y === pos.y),
  );

  return decrementEffectActions({
    ...state,
    scientists: {
      ...state.scientists,
      [action.scientistId]: { ...scientist, position: { tileId: action.tileId, x: action.x, y: action.y } },
    },
    fireTokens: updatedFireTokens,
    // Clear actor selection after completing the move
    scientistInteraction: { ...state.scientistInteraction, selectedActorId: null },
  });
}

// END_EFFECT_PHASE is now handled by ADVANCE_PHASE

export function handleRevertEffectPhase(state: GameState): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;
  if (!state.undoSnapshot) return state;

  return {
    ...state.undoSnapshot,
    undoSnapshot: state.undoSnapshot,
  };
}

// Handler map for effect actions
export const effectHandlers = {
  FRIGHTEN_SCIENTIST: handleFrightenScientist,
  PUT_BABY_TO_SLEEP: handlePutBabyToSleep,
  CALL_BABY: handleCallBaby,
  DISAPPEARANCE: handleDisappearance,
  MOTHER_RETURN: handleMotherReturn,
  WAKE_BABY: handleWakeBaby,
  REMOVE_MOTHER_SLEEP_TOKEN: handleRemoveMotherSleepToken,
  PLACE_REINFORCEMENT: handlePlaceReinforcement,
  PLACE_FIRE_TOKEN: handlePlaceFireToken,
  MOVE_JEEP: handleMoveJeep,
  REVERT_EFFECT_PHASE: handleRevertEffectPhase,
};
