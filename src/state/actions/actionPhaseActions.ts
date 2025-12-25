import type { GameState } from "@/types/gameState.ts";
import { getAllBoardPositions, isSpaceOccupied, arePositionsAdjacent } from "@/utils/boardUtils.ts";
import { hasLineOfSight } from "@/utils/lineOfSight.ts";
import { getConnectedFires } from "@/utils/fireUtils.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "@/types/coordinates.ts";
import { BabyRaptor } from "@/pieces/BabyRaptor.ts";
import { MotherRaptor } from "@/pieces/MotherRaptor.ts";
import { Scientist } from "@/pieces/Scientist.ts";
import { checkWinConditions } from "@/utils/winConditions.ts";
import { deleteSave } from "@/utils/saveLoad.ts";
import { getSpaceByCoords } from "@/utils/boardQueries.ts";
import { hasActionPoints, isActionPhaseForPlayer, isPhase } from "@/state/guards.ts";

/**
 * Wraps an action handler to check for win conditions after execution.
 * If a win condition is met, transitions to GAME_OVER phase and clears save.
 */
function withWinCheck<T>(
  handler: (state: GameState, action: T) => GameState,
): (state: GameState, action: T) => GameState {
  return (state: GameState, action: T): GameState => {
    const newState = handler(state, action);
    if (newState === state) return state; // No change occurred

    const result = checkWinConditions(newState);
    if (result.winner) {
      deleteSave();
      return {
        ...newState,
        phase: "GAME_OVER",
        winner: result.winner,
        winCondition: result.condition,
      };
    }
    return newState;
  };
}

// Action types for action phase
export type ActionPhaseAction =
  | {
      type: "ACTION_MOVE_BABY";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | {
      type: "ACTION_MOVE_SCIENTIST";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | {
      type: "ACTION_MOVE_MOTHER";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | { type: "ACTION_MOTHER_KILL_SCIENTIST"; targetId: string }
  | { type: "ACTION_MOTHER_WAKE_BABY"; targetId: string }
  | {
      type: "ACTION_MOTHER_EXTINGUISH_FIRE";
      tileId: number;
      x: number;
      y: number;
    }
  | {
      type: "ACTION_SCIENTIST_SLEEP_BABY";
      scientistId: string;
      targetId: string;
    }
  | {
      type: "ACTION_SCIENTIST_CAPTURE_BABY";
      scientistId: string;
      targetId: string;
    }
  | { type: "ACTION_SCIENTIST_SHOOT_MOTHER"; scientistId: string }
  | { type: "ACTION_SCIENTIST_STAND_UP"; scientistId: string }
  | { type: "RESET_ACTION_PHASE" };

function _handleActionMoveBaby(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Validate: must be in action phase
  if (!isActionPhaseForPlayer(state, "raptor")) return state;

  // Validate: must have action points
  if (!hasActionPoints(state)) return state;

  // Find the baby
  const baby = state.babies[action.pieceId];
  if (!baby?.position) return state;

  // Baby can't move if asleep
  if (baby.isAsleep) return state;

  // Validate the move using BabyRaptor class
  const allPieces = getAllBoardPositions(state);
  const babyPiece = new BabyRaptor(baby.id, baby.position.tileId, baby.position.x, baby.position.y);
  const validMoves = babyPiece.getValidMoves(state.tiles, allPieces);

  const isValidMove = validMoves.some((m) => m.tileId === action.tileId && m.x === action.x && m.y === action.y);
  if (!isValidMove) return state;

  // Check target space is not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  // Check if this is an exit space (baby escapes)
  const targetSpace = getSpaceByCoords(state.tiles, action.tileId, action.x, action.y);
  const isExit = targetSpace?.isExit ?? false;

  if (isExit) {
    // Baby escapes - mark as escaped and remove from board
    return {
      ...state,
      babies: {
        ...state.babies,
        [action.pieceId]: { ...baby, position: null, isEscaped: true },
      },
      actionPoints: state.actionPoints - 1,
    };
  }

  // Normal move
  return {
    ...state,
    babies: {
      ...state.babies,
      [action.pieceId]: { ...baby, position: { tileId: action.tileId, x: action.x, y: action.y } },
    },
    actionPoints: state.actionPoints - 1,
  };
}

export function handleActionMoveScientist(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Validate: must be in action phase
  if (!isActionPhaseForPlayer(state, "scientist")) return state;

  // Validate: must have action points
  if (!hasActionPoints(state)) return state;

  // Find the scientist
  const scientist = state.scientists[action.pieceId];
  if (!scientist?.position) return state;

  // Scientist can't move if frightened
  if (scientist.isFrightened) return state;

  // Validate the move using Scientist class (normal mode, not jeep)
  const allPieces = getAllBoardPositions(state);
  const scientistPiece = new Scientist(
    scientist.id,
    scientist.position.tileId,
    scientist.position.x,
    scientist.position.y,
  );
  const validMoves = scientistPiece.getValidMoves(state.tiles, allPieces);

  const isValidMove = validMoves.some((m) => m.tileId === action.tileId && m.x === action.x && m.y === action.y);
  if (!isValidMove) return state;

  // Check target space is not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  return {
    ...state,
    scientists: {
      ...state.scientists,
      [action.pieceId]: { ...scientist, position: { tileId: action.tileId, x: action.x, y: action.y } },
    },
    actionPoints: state.actionPoints - 1,
  };
}

export function handleActionMoveMother(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Validate: must be in action phase
  if (!isActionPhaseForPlayer(state, "raptor")) return state;

  // Find the mother
  if (!state.mother.position) return state;

  // Calculate wound cost: mother must pay AP = sleep tokens before first movement
  const woundCost = state.mother.paidWoundCost ? 0 : state.mother.sleepTokens;
  const totalCost = woundCost + 1; // wound cost + 1 for the move itself

  // Validate: must have enough action points
  if (!hasActionPoints(state, totalCost)) return state;

  // Validate the move using MotherRaptor class
  const allPieces = getAllBoardPositions(state);
  const motherPiece = new MotherRaptor(
    state.mother.id,
    state.mother.position.tileId,
    state.mother.position.x,
    state.mother.position.y,
  );
  const validMoves = motherPiece.getValidMoves(state.tiles, allPieces, state.fireTokens);

  const isValidMove = validMoves.some((m) => m.tileId === action.tileId && m.x === action.x && m.y === action.y);
  if (!isValidMove) return state;

  // Check target space is not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  // Check mother can't end on fire
  const hasFireAtTarget = state.fireTokens.some(
    (f) => f.tileId === action.tileId && f.x === action.x && f.y === action.y,
  );
  if (hasFireAtTarget) return state;

  return {
    ...state,
    mother: {
      ...state.mother,
      position: { tileId: action.tileId, x: action.x, y: action.y },
      paidWoundCost: true, // Mark that wound cost has been paid
    },
    actionPoints: state.actionPoints - totalCost,
  };
}

function _handleMotherKillScientist(state: GameState, action: { targetId: string }): GameState {
  if (!isActionPhaseForPlayer(state, "raptor")) return state;
  if (!hasActionPoints(state)) return state;

  const mother = state.mother;
  const scientist = state.scientists[action.targetId];
  if (!mother.position || !scientist?.position) return state;

  // Must be adjacent
  if (!arePositionsAdjacent(mother.position, scientist.position)) return state;

  // Mark the scientist as dead (not returned to reserve)
  return {
    ...state,
    scientists: {
      ...state.scientists,
      [action.targetId]: { ...scientist, position: null, isDead: true },
    },
    actionPoints: state.actionPoints - 1,
  };
}

export function handleMotherWakeBaby(state: GameState, action: { targetId: string }): GameState {
  if (!isActionPhaseForPlayer(state, "raptor")) return state;
  if (!hasActionPoints(state)) return state;

  const mother = state.mother;
  const baby = state.babies[action.targetId];
  if (!mother.position || !baby?.position) return state;

  // Baby must be asleep
  if (!baby.isAsleep) return state;

  // Can't wake up if put to sleep this round
  if (baby.asleepThisRound) return state;

  // Must be adjacent
  if (!arePositionsAdjacent(mother.position, baby.position)) return state;

  return {
    ...state,
    babies: {
      ...state.babies,
      [action.targetId]: { ...baby, isAsleep: false },
    },
    actionPoints: state.actionPoints - 1,
  };
}

export function handleMotherExtinguishFire(
  state: GameState,
  action: { tileId: number; x: number; y: number },
): GameState {
  if (!isActionPhaseForPlayer(state, "raptor")) return state;
  if (!hasActionPoints(state)) return state;

  const mother = state.mother;
  if (!mother.position) return state;

  // Check if there's a fire at the target position
  const targetFire = state.fireTokens.find((f) => f.tileId === action.tileId && f.x === action.x && f.y === action.y);
  if (!targetFire) return state;

  // Mother must be adjacent to the fire
  const motherGlobal = localToGlobal(mother.position.tileId, mother.position.x, mother.position.y);
  const fireGlobal = localToGlobal(action.tileId, action.x, action.y);
  const adjacentCoords = getAdjacentGlobalCoordinates(motherGlobal.globalX, motherGlobal.globalY);
  const isAdjacent = adjacentCoords.some(
    (adj) => adj.globalX === fireGlobal.globalX && adj.globalY === fireGlobal.globalY,
  );
  if (!isAdjacent) return state;

  // Get all connected fires and remove them
  const connectedFires = getConnectedFires(state.fireTokens, action.tileId, action.x, action.y);
  const connectedFireIds = new Set(connectedFires.map((f) => f.id));

  return {
    ...state,
    fireTokens: state.fireTokens.filter((f) => !connectedFireIds.has(f.id)),
    actionPoints: state.actionPoints - 1,
  };
}

export function handleScientistSleepBaby(
  state: GameState,
  action: { scientistId: string; targetId: string },
): GameState {
  if (!isActionPhaseForPlayer(state, "scientist")) return state;
  if (!hasActionPoints(state)) return state;

  const scientist = state.scientists[action.scientistId];
  const baby = state.babies[action.targetId];
  if (!scientist?.position || !baby?.position) return state;

  // Scientist can't act if frightened
  if (scientist.isFrightened) return state;

  // Scientist can only use one aggressive action per round
  if (scientist.hasUsedAggressiveAction) return state;

  // Baby must not already be asleep
  if (baby.isAsleep) return state;

  // Must be adjacent
  if (!arePositionsAdjacent(scientist.position, baby.position)) return state;

  return {
    ...state,
    babies: {
      ...state.babies,
      [action.targetId]: { ...baby, isAsleep: true },
    },
    scientists: {
      ...state.scientists,
      [action.scientistId]: { ...scientist, hasUsedAggressiveAction: true },
    },
    actionPoints: state.actionPoints - 1,
  };
}

function _handleScientistCaptureBaby(state: GameState, action: { scientistId: string; targetId: string }): GameState {
  if (!isActionPhaseForPlayer(state, "scientist")) return state;
  if (!hasActionPoints(state)) return state;

  const scientist = state.scientists[action.scientistId];
  const baby = state.babies[action.targetId];
  if (!scientist?.position || !baby?.position) return state;

  // Scientist can't act if frightened
  if (scientist.isFrightened) return state;

  // Scientist can only use one aggressive action per round
  if (scientist.hasUsedAggressiveAction) return state;

  // Baby must be asleep to capture
  if (!baby.isAsleep) return state;

  // Must be adjacent
  if (!arePositionsAdjacent(scientist.position, baby.position)) return state;

  // Mark baby as captured and remove from board
  return {
    ...state,
    babies: {
      ...state.babies,
      [action.targetId]: { ...baby, position: null, isCaptured: true },
    },
    scientists: {
      ...state.scientists,
      [action.scientistId]: { ...scientist, hasUsedAggressiveAction: true },
    },
    actionPoints: state.actionPoints - 1,
  };
}

function _handleScientistShootMother(state: GameState, action: { scientistId: string }): GameState {
  if (!isActionPhaseForPlayer(state, "scientist")) return state;
  if (!hasActionPoints(state)) return state;

  const scientist = state.scientists[action.scientistId];
  const mother = state.mother;
  if (!scientist?.position || !mother.position) return state;

  // Scientist can't act if frightened
  if (scientist.isFrightened) return state;

  // Scientist can only use one aggressive action per round
  if (scientist.hasUsedAggressiveAction) return state;

  // Must have line of sight
  if (!hasLineOfSight(state, scientist, mother)) return state;

  return {
    ...state,
    mother: { ...state.mother, sleepTokens: state.mother.sleepTokens + 1 },
    scientists: {
      ...state.scientists,
      [action.scientistId]: { ...scientist, hasUsedAggressiveAction: true },
    },
    actionPoints: state.actionPoints - 1,
  };
}

export function handleScientistStandUp(state: GameState, action: { scientistId: string }): GameState {
  if (!isActionPhaseForPlayer(state, "scientist")) return state;
  if (!hasActionPoints(state)) return state;

  const scientist = state.scientists[action.scientistId];
  if (!scientist?.position) return state;

  // Scientist must be frightened to stand up
  if (!scientist.isFrightened) return state;

  // Can't stand up if frightened this round
  if (scientist.frightenedThisRound) return state;

  return {
    ...state,
    scientists: {
      ...state.scientists,
      [action.scientistId]: { ...scientist, isFrightened: false },
    },
    actionPoints: state.actionPoints - 1,
  };
}

// END_ACTION_PHASE is now handled by ADVANCE_PHASE

export function handleResetActionPhase(state: GameState): GameState {
  if (!isPhase(state, "ACTION_PHASE")) return state;
  if (!state.undoSnapshot) return state;

  return {
    ...state.undoSnapshot,
    undoSnapshot: state.undoSnapshot,
  };
}

// Export wrapped versions of handlers that can trigger win conditions
export const handleActionMoveBaby = withWinCheck(_handleActionMoveBaby);
export const handleMotherKillScientist = withWinCheck(_handleMotherKillScientist);
export const handleScientistCaptureBaby = withWinCheck(_handleScientistCaptureBaby);
export const handleScientistShootMother = withWinCheck(_handleScientistShootMother);
