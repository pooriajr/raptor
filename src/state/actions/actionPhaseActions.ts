import type { GameState, PieceState, FireToken } from "@/types/gameState.ts";
import { getAllPieces, isSpaceOccupied, arePiecesAdjacent } from "@/utils/boardUtils.ts";
import { hasLineOfSight } from "@/utils/lineOfSight.ts";
import { getConnectedFires } from "@/utils/fireUtils.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "@/types/coordinates.ts";
import { BabyRaptor } from "@/pieces/BabyRaptor.ts";
import { MotherRaptor } from "@/pieces/MotherRaptor.ts";
import { Scientist } from "@/pieces/Scientist.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";

// Saved state for action phase reset
export interface ActionPhaseSavedState {
  mother: PieceState;
  babies: PieceState[];
  scientists: PieceState[];
  fireTokens: FireToken[];
  actionPoints: number;
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
  | { type: "END_ACTION_PHASE" }
  | { type: "RESET_ACTION_PHASE"; savedState: ActionPhaseSavedState };

export function handleActionMoveBaby(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Validate: must be in action phase
  if (state.phase !== "ACTION_PHASE") return state;

  // Validate: raptor must be the active player
  if (state.activePlayer !== "raptor") return state;

  // Validate: must have action points
  if (state.actionPoints <= 0) return state;

  // Find the baby
  const baby = state.babies.find((b) => b.id === action.pieceId);
  if (!baby) return state;

  // Baby can't move if asleep
  if (baby.isAsleep) return state;

  // Validate the move using BabyRaptor class
  const allPieces = getAllPieces(state);
  const babyPiece = new BabyRaptor(baby.id, baby.tileId, baby.x, baby.y);
  const validMoves = babyPiece.getValidMoves(state.tiles, allPieces);

  const isValidMove = validMoves.some((m) => m.tileId === action.tileId && m.x === action.x && m.y === action.y);
  if (!isValidMove) return state;

  // Check target space is not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  // Check if this is an exit space (baby escapes)
  const targetTile = state.tiles.find((t) => t.id === action.tileId);
  const targetSpace = targetTile?.spaces.find((s) => s.coordinate.x === action.x && s.coordinate.y === action.y);
  const isExit = targetSpace?.isExit ?? false;

  if (isExit) {
    // Baby escapes - remove from board and increment escaped count
    return {
      ...state,
      babies: state.babies.filter((b) => b.id !== action.pieceId),
      escapedBabies: state.escapedBabies + 1,
      actionPoints: state.actionPoints - 1,
    };
  }

  // Normal move
  return {
    ...state,
    babies: state.babies.map((b) =>
      b.id === action.pieceId ? { ...b, tileId: action.tileId, x: action.x, y: action.y } : b,
    ),
    actionPoints: state.actionPoints - 1,
  };
}

export function handleActionMoveScientist(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Validate: must be in action phase
  if (state.phase !== "ACTION_PHASE") return state;

  // Validate: scientist must be the active player
  if (state.activePlayer !== "scientist") return state;

  // Validate: must have action points
  if (state.actionPoints <= 0) return state;

  // Find the scientist
  const scientist = state.scientists.find((s) => s.id === action.pieceId);
  if (!scientist) return state;

  // Scientist can't move if frightened
  if (scientist.isFrightened) return state;

  // Validate the move using Scientist class (normal mode, not jeep)
  const allPieces = getAllPieces(state);
  const scientistPiece = new Scientist(scientist.id, scientist.tileId, scientist.x, scientist.y);
  const validMoves = scientistPiece.getValidMoves(state.tiles, allPieces);

  const isValidMove = validMoves.some((m) => m.tileId === action.tileId && m.x === action.x && m.y === action.y);
  if (!isValidMove) return state;

  // Check target space is not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  // Check scientist can't end on fire
  const hasFireAtTarget = state.fireTokens.some(
    (f) => f.tileId === action.tileId && f.x === action.x && f.y === action.y,
  );
  if (hasFireAtTarget) return state;

  return {
    ...state,
    scientists: state.scientists.map((s) =>
      s.id === action.pieceId ? { ...s, tileId: action.tileId, x: action.x, y: action.y } : s,
    ),
    actionPoints: state.actionPoints - 1,
  };
}

export function handleActionMoveMother(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Validate: must be in action phase
  if (state.phase !== "ACTION_PHASE") return state;

  // Validate: raptor must be the active player
  if (state.activePlayer !== "raptor") return state;

  // Find the mother
  if (!state.mother) return state;

  // Calculate wound cost: mother must pay AP = sleep tokens before first movement
  const woundCost = state.motherPaidWoundCost ? 0 : state.motherSleepTokens;
  const totalCost = woundCost + 1; // wound cost + 1 for the move itself

  // Validate: must have enough action points
  if (state.actionPoints < totalCost) return state;

  // Validate the move using MotherRaptor class
  const allPieces = getAllPieces(state);
  const motherPiece = new MotherRaptor(state.mother.id, state.mother.tileId, state.mother.x, state.mother.y);
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
      tileId: action.tileId,
      x: action.x,
      y: action.y,
    },
    actionPoints: state.actionPoints - totalCost,
    motherPaidWoundCost: true, // Mark that wound cost has been paid
  };
}

export function handleMotherKillScientist(state: GameState, action: { targetId: string }): GameState {
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "raptor") return state;
  if (state.actionPoints <= 0) return state;

  const mother = state.mother;
  const scientist = state.scientists.find((s) => s.id === action.targetId);
  if (!mother || !scientist) return state;

  // Must be adjacent
  if (!arePiecesAdjacent(mother, scientist)) return state;

  // Remove the scientist from the game (killed, not returned to reserve)
  return {
    ...state,
    scientists: state.scientists.filter((s) => s.id !== action.targetId),
    actionPoints: state.actionPoints - 1,
  };
}

export function handleMotherWakeBaby(state: GameState, action: { targetId: string }): GameState {
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "raptor") return state;
  if (state.actionPoints <= 0) return state;

  const mother = state.mother;
  const baby = state.babies.find((b) => b.id === action.targetId);
  if (!mother || !baby) return state;

  // Baby must be asleep
  if (!baby.isAsleep) return state;

  // Can't wake up if put to sleep this round
  if (state.asleepThisRound.includes(action.targetId)) return state;

  // Must be adjacent
  if (!arePiecesAdjacent(mother, baby)) return state;

  return {
    ...state,
    babies: state.babies.map((b) => (b.id === action.targetId ? { ...b, isAsleep: false } : b)),
    actionPoints: state.actionPoints - 1,
  };
}

export function handleMotherExtinguishFire(
  state: GameState,
  action: { tileId: number; x: number; y: number },
): GameState {
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "raptor") return state;
  if (state.actionPoints <= 0) return state;

  const mother = state.mother;
  if (!mother) return state;

  // Check if there's a fire at the target position
  const targetFire = state.fireTokens.find((f) => f.tileId === action.tileId && f.x === action.x && f.y === action.y);
  if (!targetFire) return state;

  // Mother must be adjacent to the fire
  const motherGlobal = localToGlobal(mother.tileId, mother.x, mother.y);
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
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "scientist") return state;
  if (state.actionPoints <= 0) return state;

  const scientist = state.scientists.find((s) => s.id === action.scientistId);
  const baby = state.babies.find((b) => b.id === action.targetId);
  if (!scientist || !baby) return state;

  // Scientist can't act if frightened
  if (scientist.isFrightened) return state;

  // Scientist can only use one aggressive action per round
  if (state.aggressiveActionsUsed.includes(action.scientistId)) return state;

  // Baby must not already be asleep
  if (baby.isAsleep) return state;

  // Must be adjacent
  if (!arePiecesAdjacent(scientist, baby)) return state;

  return {
    ...state,
    babies: state.babies.map((b) => (b.id === action.targetId ? { ...b, isAsleep: true } : b)),
    actionPoints: state.actionPoints - 1,
    aggressiveActionsUsed: [...state.aggressiveActionsUsed, action.scientistId],
  };
}

export function handleScientistCaptureBaby(
  state: GameState,
  action: { scientistId: string; targetId: string },
): GameState {
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "scientist") return state;
  if (state.actionPoints <= 0) return state;

  const scientist = state.scientists.find((s) => s.id === action.scientistId);
  const baby = state.babies.find((b) => b.id === action.targetId);
  if (!scientist || !baby) return state;

  // Scientist can't act if frightened
  if (scientist.isFrightened) return state;

  // Scientist can only use one aggressive action per round
  if (state.aggressiveActionsUsed.includes(action.scientistId)) return state;

  // Baby must be asleep to capture
  if (!baby.isAsleep) return state;

  // Must be adjacent
  if (!arePiecesAdjacent(scientist, baby)) return state;

  // Remove baby and increment captured count
  return {
    ...state,
    babies: state.babies.filter((b) => b.id !== action.targetId),
    capturedBabies: state.capturedBabies + 1,
    actionPoints: state.actionPoints - 1,
    aggressiveActionsUsed: [...state.aggressiveActionsUsed, action.scientistId],
  };
}

export function handleScientistShootMother(state: GameState, action: { scientistId: string }): GameState {
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "scientist") return state;
  if (state.actionPoints <= 0) return state;

  const scientist = state.scientists.find((s) => s.id === action.scientistId);
  const mother = state.mother;
  if (!scientist || !mother) return state;

  // Scientist can't act if frightened
  if (scientist.isFrightened) return state;

  // Scientist can only use one aggressive action per round
  if (state.aggressiveActionsUsed.includes(action.scientistId)) return state;

  // Must have line of sight
  if (!hasLineOfSight(state, scientist, mother)) return state;

  return {
    ...state,
    motherSleepTokens: state.motherSleepTokens + 1,
    actionPoints: state.actionPoints - 1,
    aggressiveActionsUsed: [...state.aggressiveActionsUsed, action.scientistId],
  };
}

export function handleScientistStandUp(state: GameState, action: { scientistId: string }): GameState {
  if (state.phase !== "ACTION_PHASE") return state;
  if (state.activePlayer !== "scientist") return state;
  if (state.actionPoints <= 0) return state;

  const scientist = state.scientists.find((s) => s.id === action.scientistId);
  if (!scientist) return state;

  // Scientist must be frightened to stand up
  if (!scientist.isFrightened) return state;

  // Can't stand up if frightened this round
  if (state.frightenedThisRound.includes(action.scientistId)) return state;

  return {
    ...state,
    scientists: state.scientists.map((s) => (s.id === action.scientistId ? { ...s, isFrightened: false } : s)),
    actionPoints: state.actionPoints - 1,
  };
}

export function handleEndActionPhase(state: GameState): GameState {
  if (state.phase !== "ACTION_PHASE") return state;

  // If mother disappeared this round, go to MOTHER_RETURN phase first
  if (state.motherDisappeared) {
    return transitionToPhase(state, "MOTHER_RETURN");
  }

  // Transition to round end phase - this triggers END_ROUND action
  return transitionToPhase(state, "ROUND_END");
}

export function handleResetActionPhase(state: GameState, action: { savedState: ActionPhaseSavedState }): GameState {
  if (state.phase !== "ACTION_PHASE") return state;

  // Restore the saved state from the start of the action phase
  return {
    ...state,
    mother: action.savedState.mother,
    babies: action.savedState.babies,
    scientists: action.savedState.scientists,
    fireTokens: action.savedState.fireTokens,
    actionPoints: action.savedState.actionPoints,
  };
}

// Handler map for action phase actions
export const actionPhaseHandlers = {
  ACTION_MOVE_BABY: handleActionMoveBaby,
  ACTION_MOVE_SCIENTIST: handleActionMoveScientist,
  ACTION_MOVE_MOTHER: handleActionMoveMother,
  ACTION_MOTHER_KILL_SCIENTIST: handleMotherKillScientist,
  ACTION_MOTHER_WAKE_BABY: handleMotherWakeBaby,
  ACTION_MOTHER_EXTINGUISH_FIRE: handleMotherExtinguishFire,
  ACTION_SCIENTIST_SLEEP_BABY: handleScientistSleepBaby,
  ACTION_SCIENTIST_CAPTURE_BABY: handleScientistCaptureBaby,
  ACTION_SCIENTIST_SHOOT_MOTHER: handleScientistShootMother,
  ACTION_SCIENTIST_STAND_UP: handleScientistStandUp,
  END_ACTION_PHASE: handleEndActionPhase,
  RESET_ACTION_PHASE: handleResetActionPhase,
};
