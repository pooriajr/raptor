import type { GameState } from "@/types/gameState.ts";
import { findById, getAllPieces, isSpaceOccupied } from "@/utils/boardUtils.ts";
import { getReachableDestinationsOnMotherTile } from "@/utils/pathfinding.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "@/types/coordinates.ts";
import { getActionPhaseState } from "@/state/actions/cardActions.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";

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
  | { type: "RECOVERY"; babyIds: string[]; motherTokensToRemove: number }
  | { type: "MOTHER_RETURN"; tileId: number; x: number; y: number }
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
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterFrighten, "ACTION_PHASE");
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
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterSleep, "ACTION_PHASE");
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
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterMothersCall, "ACTION_PHASE");
}

export function handleDisappearance(state: GameState): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be raptor's effect (raptor had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (raptorCards.played >= scientistCards.played) return state;

  // Remove mother from the board (she'll be replaced after opponent acts)
  // Set tileId to -1 to mark as "disappeared" (temporarily off-board)
  // Also set flags for mother return phase and observation mechanic
  const newStateAfterDisappearance = {
    ...state,
    mother: { ...state.mother, tileId: -1, x: -1, y: -1 },
    motherDisappeared: true,
    observationActive: true, // Raptor will see scientist's card next round
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterDisappearance, "ACTION_PHASE");
}

export function handleMotherReturn(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  if (state.phase !== "MOTHER_RETURN") return state;

  // Validate mother has disappeared
  if (!state.motherDisappeared) return state;

  // Validate the space exists and is valid
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile) return state;

  const space = tile.spaces.find((s) => s.coordinate.x === action.x && s.coordinate.y === action.y);
  if (!space || space.hasMountain || space.isUnusable || space.isExit) return state;

  // Validate space is not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  // Place mother back on the board and transition to round end
  const newState = {
    ...state,
    mother: { ...state.mother, tileId: action.tileId, x: action.x, y: action.y },
    motherDisappeared: false,
  };
  return transitionToPhase(newState, "ROUND_END");
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
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterWake, "ACTION_PHASE");
}

export function handleRecovery(
  state: GameState,
  action: { babyIds: string[]; motherTokensToRemove: number },
): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;

  // Must be raptor's effect (raptor had lower card)
  const { scientistCards, raptorCards } = state;
  if (scientistCards.played === null || raptorCards.played === null) return state;
  if (raptorCards.played >= scientistCards.played) return state;

  // Validate baby targets are sleeping babies
  const validBabyTargets = action.babyIds.filter((id) => {
    const baby = findById(state.babies, id);
    return baby && baby.isAsleep;
  });

  // Validate mother token removal (can't remove more than she has)
  const tokensToRemove = Math.min(action.motherTokensToRemove, state.motherSleepTokens);

  // Wake up the babies and remove mother's sleep tokens
  const newStateAfterRecovery = {
    ...state,
    babies: state.babies.map((b) => (validBabyTargets.includes(b.id) ? { ...b, isAsleep: false } : b)),
    motherSleepTokens: state.motherSleepTokens - tokensToRemove,
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterRecovery, "ACTION_PHASE");
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

  // Get unplaced scientists from the array (these are the reserve)
  const unplacedScientists = state.scientists.filter((s) => s.tileId === -1);

  // Validate and place each scientist
  let updatedScientists = [...state.scientists];
  let placedCount = 0;

  for (const placement of action.placements) {
    if (placedCount >= unplacedScientists.length) break;

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

    // Place the scientist by updating the existing unplaced scientist
    const scientistToPlace = unplacedScientists[placedCount];
    updatedScientists = updatedScientists.map((s) =>
      s.id === scientistToPlace.id ? { ...s, tileId: placement.tileId, x: placement.x, y: placement.y } : s,
    );
    placedCount++;
  }

  const newStateAfterReinforcements = {
    ...state,
    scientists: updatedScientists,
    scientistReserve: state.scientistReserve - placedCount,
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterReinforcements, "ACTION_PHASE");
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
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterFire, "ACTION_PHASE");
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
    ...getActionPhaseState(state),
  };
  return transitionToPhase(newStateAfterJeep, "ACTION_PHASE");
}

export function handleEndEffectPhase(state: GameState): GameState {
  if (state.phase !== "EFFECT_PHASE") return state;
  const newState = { ...state, ...getActionPhaseState(state) };
  return transitionToPhase(newState, "ACTION_PHASE");
}

// Handler map for effect actions
export const effectHandlers = {
  FRIGHTEN_SCIENTISTS: handleFrightenScientists,
  PUT_BABIES_TO_SLEEP: handlePutBabiesToSleep,
  MOTHERS_CALL: handleMothersCall,
  DISAPPEARANCE: handleDisappearance,
  MOTHER_RETURN: handleMotherReturn,
  WAKE_BABIES: handleWakeBabies,
  RECOVERY: handleRecovery,
  REINFORCEMENTS: handleReinforcements,
  PLACE_FIRE: handlePlaceFire,
  JEEP_MOVES: handleJeepMoves,
  END_EFFECT_PHASE: handleEndEffectPhase,
};
