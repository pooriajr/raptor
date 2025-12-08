import type { GameState, PieceState } from "../types/gameState.ts";
import { findById, getAllPieces, isSpaceOccupied } from "../utils/boardUtils.ts";
import { getReachableDestinationsOnMotherTile } from "../utils/pathfinding.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";
import { transitionToActionPhase } from "./cardActions.ts";

// Action types for effect phase
export type EffectAction =
  | { type: "FRIGHTEN_SCIENTISTS"; pieceIds: string[] }
  | { type: "PUT_BABIES_TO_SLEEP"; pieceIds: string[] }
  | {
      type: "MOTHERS_CALL";
      moves: Array<{
        babyId: string;
        destinationTileId: number;
        destinationX: number;
        destinationY: number;
      }>;
    }
  | {
      type: "REINFORCEMENTS";
      placements: Array<{
        tileId: number;
        x: number;
        y: number;
      }>;
    }
  | {
      type: "PLACE_FIRE";
      placements: Array<{
        tileId: number;
        x: number;
        y: number;
      }>;
    }
  | {
      type: "JEEP_MOVES";
      moves: Array<{
        scientistId: string;
        fromTileId: number;
        fromX: number;
        fromY: number;
        toTileId: number;
        toX: number;
        toY: number;
        path: Array<{ tileId: number; x: number; y: number }>;
      }>;
    }
  | { type: "DISAPPEARANCE" }
  | { type: "WAKE_BABIES"; pieceIds: string[] }
  | { type: "END_EFFECT_PHASE" };

export function handleFrightenScientists(state: GameState, action: { pieceIds: string[] }): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be raptor's effect (raptor had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (raptorCards.played >= scientistCards.played) return state;

  // Validate all targets are valid scientists
  const validTargets = action.pieceIds.filter((id) => {
    const scientist = findById(state.scientists, id);
    return scientist && !scientist.isFrightened;
  });

  // Frighten the scientists
  const newStateAfterFrighten = {
    ...state,
    scientists: state.scientists.map((s) => (validTargets.includes(s.id) ? { ...s, isFrightened: true } : s)),
    frightenedThisRound: [...state.frightenedThisRound, ...validTargets],
  };
  return {
    ...newStateAfterFrighten,
    ...transitionToActionPhase(newStateAfterFrighten),
  };
}

export function handlePutBabiesToSleep(state: GameState, action: { pieceIds: string[] }): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be scientist's effect (scientist had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (scientistCards.played >= raptorCards.played) return state;

  // Validate all targets are valid babies
  const validTargets = action.pieceIds.filter((id) => {
    const baby = findById(state.babies, id);
    return baby && !baby.isAsleep;
  });

  // Put the babies to sleep
  const newStateAfterSleep = {
    ...state,
    babies: state.babies.map((b) => (validTargets.includes(b.id) ? { ...b, isAsleep: true } : b)),
    asleepThisRound: [...state.asleepThisRound, ...validTargets],
  };
  return {
    ...newStateAfterSleep,
    ...transitionToActionPhase(newStateAfterSleep),
  };
}

export function handleMothersCall(
  state: GameState,
  action: {
    moves: Array<{
      babyId: string;
      destinationTileId: number;
      destinationX: number;
      destinationY: number;
    }>;
  },
): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be raptor's effect (raptor had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (raptorCards.played >= scientistCards.played) return state;

  // Find mother
  if (!state.mother) return state;

  // Process each move, updating babies as we go
  let updatedBabies = [...state.babies];

  for (const move of action.moves) {
    // Validate the baby exists
    const baby = findById(updatedBabies, move.babyId);
    if (!baby) continue;

    // Validate destination is on mother's tile
    if (move.destinationTileId !== state.mother.tileId) continue;

    // Validate the destination is reachable via pathfinding
    const allPieces = getAllPieces({ ...state, babies: updatedBabies });
    const reachable = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);

    const isValidDestination = reachable.some(
      (pos) => pos.tileId === move.destinationTileId && pos.x === move.destinationX && pos.y === move.destinationY,
    );

    if (!isValidDestination) continue;

    // Move the baby
    updatedBabies = updatedBabies.map((b) =>
      b.id === move.babyId
        ? {
            ...b,
            tileId: move.destinationTileId,
            x: move.destinationX,
            y: move.destinationY,
          }
        : b,
    );
  }

  const newStateAfterMothersCall = {
    ...state,
    babies: updatedBabies,
  };
  return {
    ...newStateAfterMothersCall,
    ...transitionToActionPhase(newStateAfterMothersCall),
  };
}

export function handleDisappearance(state: GameState): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be raptor's effect (raptor had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (raptorCards.played >= scientistCards.played) return state;

  // Mother must exist
  if (!state.mother) return state;

  // Remove mother from the board (she'll be replaced after opponent acts)
  const newStateAfterDisappearance = {
    ...state,
    mother: null,
  };
  return {
    ...newStateAfterDisappearance,
    ...transitionToActionPhase(newStateAfterDisappearance),
  };
}

export function handleWakeBabies(state: GameState, action: { pieceIds: string[] }): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be raptor's effect (raptor had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (raptorCards.played >= scientistCards.played) return state;

  // Validate all targets are sleeping babies
  const validTargets = action.pieceIds.filter((id) => {
    const baby = findById(state.babies, id);
    return baby && baby.isAsleep;
  });

  // Wake up the babies
  const newStateAfterWake = {
    ...state,
    babies: state.babies.map((b) => (validTargets.includes(b.id) ? { ...b, isAsleep: false } : b)),
  };
  return {
    ...newStateAfterWake,
    ...transitionToActionPhase(newStateAfterWake),
  };
}

export function handleReinforcements(
  state: GameState,
  action: {
    placements: Array<{
      tileId: number;
      x: number;
      y: number;
    }>;
  },
): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be scientist's effect (scientist had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (scientistCards.played >= raptorCards.played) return state;

  // Check if we have scientists in reserve
  if (state.scientistReserve <= 0) return state;

  // Top row squares (1, 2, 3) have long edge at y=0
  // Bottom row squares (6, 7, 8) have long edge at y=2
  const topRowTiles = [1, 2, 3];
  const bottomRowTiles = [6, 7, 8];

  // Validate and place each scientist
  let updatedScientists = [...state.scientists];
  let remainingReserve = state.scientistReserve;

  for (const placement of action.placements) {
    if (remainingReserve <= 0) break;

    const tile = state.tiles.find((t) => t.id === placement.tileId);
    if (!tile || tile.shape !== "square") continue;

    // Check if on long edge
    const isTopRow = topRowTiles.includes(placement.tileId);
    const isBottomRow = bottomRowTiles.includes(placement.tileId);
    if (!isTopRow && !isBottomRow) continue;

    const requiredY = isTopRow ? 0 : 2;
    if (placement.y !== requiredY) continue;

    // Check space is valid
    const space = tile.spaces.find((s) => s.coordinate.x === placement.x && s.coordinate.y === placement.y);
    if (!space || space.hasMountain) continue;

    // Check space is not occupied
    const tempState = { ...state, scientists: updatedScientists };
    if (isSpaceOccupied(tempState, placement.tileId, placement.x, placement.y)) continue;

    // Place the scientist
    const newScientist: PieceState = {
      id: `scientist-${updatedScientists.length}`,
      type: "scientist",
      tileId: placement.tileId,
      x: placement.x,
      y: placement.y,
    };
    updatedScientists = [...updatedScientists, newScientist];
    remainingReserve--;
  }

  const newStateAfterReinforcements = {
    ...state,
    scientists: updatedScientists,
    scientistReserve: remainingReserve,
  };
  return {
    ...newStateAfterReinforcements,
    ...transitionToActionPhase(newStateAfterReinforcements),
  };
}

export function handlePlaceFire(
  state: GameState,
  action: {
    placements: Array<{
      tileId: number;
      x: number;
      y: number;
    }>;
  },
): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be scientist's effect (scientist had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (scientistCards.played >= raptorCards.played) return state;

  // Validate and place each fire token
  let updatedFireTokens = [...state.fireTokens];

  for (const placement of action.placements) {
    const tile = state.tiles.find((t) => t.id === placement.tileId);
    if (!tile) continue;

    // Check space is valid (not mountain, not unusable, not exit)
    const space = tile.spaces.find((s) => s.coordinate.x === placement.x && s.coordinate.y === placement.y);
    if (!space || space.hasMountain || space.isUnusable || space.isExit) continue;

    // Check no fire already at this location
    const hasFireAlready = updatedFireTokens.some(
      (f) => f.tileId === placement.tileId && f.x === placement.x && f.y === placement.y,
    );
    if (hasFireAlready) continue;

    // Check placement is adjacent to a scientist or existing fire (using global coords for cross-tile adjacency)
    const placementGlobal = localToGlobal(placement.tileId, placement.x, placement.y);
    const adjacentGlobals = getAdjacentGlobalCoordinates(placementGlobal.globalX, placementGlobal.globalY);

    const isAdjacentToScientist = state.scientists.some((s) => {
      const sGlobal = localToGlobal(s.tileId, s.x, s.y);
      return adjacentGlobals.some((adj) => adj.globalX === sGlobal.globalX && adj.globalY === sGlobal.globalY);
    });

    const isAdjacentToFire = updatedFireTokens.some((f) => {
      const fGlobal = localToGlobal(f.tileId, f.x, f.y);
      return adjacentGlobals.some((adj) => adj.globalX === fGlobal.globalX && adj.globalY === fGlobal.globalY);
    });

    if (!isAdjacentToScientist && !isAdjacentToFire) continue;

    // Place the fire token
    const newFire = {
      id: `fire-${updatedFireTokens.length}`,
      tileId: placement.tileId,
      x: placement.x,
      y: placement.y,
    };
    updatedFireTokens = [...updatedFireTokens, newFire];
  }

  const newStateAfterFire = {
    ...state,
    fireTokens: updatedFireTokens,
  };
  return {
    ...newStateAfterFire,
    ...transitionToActionPhase(newStateAfterFire),
  };
}

export function handleJeepMoves(
  state: GameState,
  action: {
    moves: Array<{
      scientistId: string;
      fromTileId: number;
      fromX: number;
      fromY: number;
      toTileId: number;
      toX: number;
      toY: number;
      path: Array<{ tileId: number; x: number; y: number }>;
    }>;
  },
): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be scientist's effect (scientist had lower card)
  const { scientistCards: sc, raptorCards: rc } = state;
  if (sc.played === null || rc.played === null) return state;
  if (sc.played >= rc.played) return state;

  let updatedScientists = [...state.scientists];
  let updatedFireTokens = [...state.fireTokens];

  for (const move of action.moves) {
    // Move the scientist to the destination
    updatedScientists = updatedScientists.map((s) =>
      s.id === move.scientistId ? { ...s, tileId: move.toTileId, x: move.toX, y: move.toY } : s,
    );

    // Extinguish fires along the path (including destination)
    const allPositions = [...move.path, { tileId: move.toTileId, x: move.toX, y: move.toY }];
    for (const pos of allPositions) {
      updatedFireTokens = updatedFireTokens.filter((f) => !(f.tileId === pos.tileId && f.x === pos.x && f.y === pos.y));
    }
  }

  const newStateAfterJeep = {
    ...state,
    scientists: updatedScientists,
    fireTokens: updatedFireTokens,
  };
  return {
    ...newStateAfterJeep,
    ...transitionToActionPhase(newStateAfterJeep),
  };
}

export function handleEndEffectPhase(state: GameState): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;
  return { ...state, ...transitionToActionPhase(state) };
}
