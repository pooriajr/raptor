import type { GameState, PieceState } from "../types/gameState";
import type { GameAction } from "../state/gameReducer";
import {
  createSpaceId,
  type SpaceId,
  type SpaceActions,
  type SpaceAction,
  type SpaceStyle,
} from "../types/spaceActions";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "../types/coordinates";
import { getReachableDestinationsOnMotherTile, getJeepDestinationsWithPaths } from "./pathfinding";
import { getCurrentEffectType } from "./effectUtils";
import { isMotherPlaced } from "./pieceUtils";
import { MotherRaptor } from "../pieces/MotherRaptor";
import { BabyRaptor } from "../pieces/BabyRaptor";
import { Scientist } from "../pieces/Scientist";
import { hasLineOfSight } from "./lineOfSight";

// Helper to get all pieces as a single array
function getAllPieces(state: GameState): PieceState[] {
  const pieces: PieceState[] = [];
  if (state.mother) pieces.push(state.mother);
  pieces.push(...state.babies);
  pieces.push(...state.scientists);
  return pieces;
}

// Helper to check if a space is occupied
function isSpaceOccupied(state: GameState, tileId: number, x: number, y: number): boolean {
  if (state.mother?.tileId === tileId && state.mother.x === x && state.mother.y === y) return true;
  if (state.babies.some((b) => b.tileId === tileId && b.x === x && b.y === y)) return true;
  if (state.scientists.some((s) => s.tileId === tileId && s.x === x && s.y === y)) return true;
  return false;
}

// Helper to check if tile has raptors
function tileHasRaptor(state: GameState, tileId: number): boolean {
  if (state.mother?.tileId === tileId) return true;
  return state.babies.some((b) => b.tileId === tileId);
}

// Adapter: create a piece class instance from plain state for movement logic
function createPieceFromState(piece: PieceState) {
  switch (piece.type) {
    case "mother":
      return new MotherRaptor(piece.id, piece.tileId, piece.x, piece.y);
    case "baby":
      return new BabyRaptor(piece.id, piece.tileId, piece.x, piece.y);
    case "scientist":
      return new Scientist(piece.id, piece.tileId, piece.x, piece.y);
  }
}

// Get valid setup tiles
function getValidSetupTiles(state: GameState): number[] {
  if (state.phase === "RAPTOR_SETUP") {
    if (!isMotherPlaced(state)) return [2, 7];
    const squareTiles = state.tiles.filter((t) => t.shape === "square");
    return squareTiles.filter((t) => !tileHasRaptor(state, t.id)).map((t) => t.id);
  }
  if (state.phase === "SCIENTIST_SETUP") {
    const lTiles = state.tiles.filter((t) => t.shape === "L");
    const tilesWithScientist = new Set(state.scientists.map((s) => s.tileId));
    return lTiles.filter((t) => !tilesWithScientist.has(t.id)).map((t) => t.id);
  }
  return [];
}

// Get valid setup spaces on a tile
function getValidSetupSpaces(state: GameState, tileId: number): Array<{ x: number; y: number }> {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return [];
  const validSpaces: Array<{ x: number; y: number }> = [];
  for (const space of tile.spaces) {
    if (space.isUnusable || space.hasMountain) continue;
    if (state.phase === "SCIENTIST_SETUP" && space.isExit) continue;
    if (isSpaceOccupied(state, tileId, space.coordinate.x, space.coordinate.y)) continue;
    validSpaces.push({ x: space.coordinate.x, y: space.coordinate.y });
  }
  return validSpaces;
}

interface ActionTarget {
  pieceId: string;
  tileId: number;
  x: number;
  y: number;
  action: GameAction;
}

interface FireTarget {
  tileId: number;
  x: number;
  y: number;
  action: GameAction;
}

interface ActionTargets {
  hostileTargets: ActionTarget[];
  selectables: ActionTarget[];
  friendlyFirePositions: FireTarget[];
}

// Calculate action targets for action phase
function getActionTargets(state: GameState, selectedActorId: string | null): ActionTargets {
  const result: ActionTargets = {
    hostileTargets: [],
    selectables: [],
    friendlyFirePositions: [],
  };

  if (state.phase !== "ACTION_PHASE" || !selectedActorId || state.actionPoints <= 0) return result;

  const selectedPiece = findPieceById(state, selectedActorId);
  if (!selectedPiece) return result;

  const selectedGlobal = localToGlobal(selectedPiece.tileId, selectedPiece.x, selectedPiece.y);
  const adjacentCoords = getAdjacentGlobalCoordinates(selectedGlobal.globalX, selectedGlobal.globalY);
  const allPieces = getAllPieces(state);
  const adjacentPieces = allPieces.filter((p) => {
    if (p.id === selectedActorId) return false;
    const pGlobal = localToGlobal(p.tileId, p.x, p.y);
    return adjacentCoords.some((adj) => adj.globalX === pGlobal.globalX && adj.globalY === pGlobal.globalY);
  });

  if (selectedPiece.type === "mother" && state.activePlayer === "raptor") {
    for (const adj of adjacentPieces) {
      if (adj.type === "scientist") {
        result.hostileTargets.push({
          pieceId: adj.id,
          tileId: adj.tileId,
          x: adj.x,
          y: adj.y,
          action: { type: "ACTION_MOTHER_KILL_SCIENTIST", targetId: adj.id },
        });
      } else if (adj.type === "baby" && adj.isAsleep && !state.asleepThisRound.includes(adj.id)) {
        result.selectables.push({
          pieceId: adj.id,
          tileId: adj.tileId,
          x: adj.x,
          y: adj.y,
          action: { type: "ACTION_MOTHER_WAKE_BABY", targetId: adj.id },
        });
      }
    }
    for (const fire of state.fireTokens) {
      const fireGlobal = localToGlobal(fire.tileId, fire.x, fire.y);
      if (adjacentCoords.some((adj) => adj.globalX === fireGlobal.globalX && adj.globalY === fireGlobal.globalY)) {
        result.friendlyFirePositions.push({
          tileId: fire.tileId,
          x: fire.x,
          y: fire.y,
          action: { type: "ACTION_MOTHER_EXTINGUISH_FIRE", tileId: fire.tileId, x: fire.x, y: fire.y },
        });
      }
    }
  } else if (
    selectedPiece.type === "scientist" &&
    state.activePlayer === "scientist" &&
    !selectedPiece.isFrightened &&
    !state.aggressiveActionsUsed.includes(selectedPiece.id)
  ) {
    for (const adj of adjacentPieces) {
      if (adj.type === "baby") {
        const action: GameAction = adj.isAsleep
          ? { type: "ACTION_SCIENTIST_CAPTURE_BABY", scientistId: selectedActorId, targetId: adj.id }
          : { type: "ACTION_SCIENTIST_SLEEP_BABY", scientistId: selectedActorId, targetId: adj.id };
        result.hostileTargets.push({ pieceId: adj.id, tileId: adj.tileId, x: adj.x, y: adj.y, action });
      }
    }
    const mother = state.mother;
    if (mother && hasLineOfSight(state, selectedPiece, mother)) {
      result.hostileTargets.push({
        pieceId: mother.id,
        tileId: mother.tileId,
        x: mother.x,
        y: mother.y,
        action: { type: "ACTION_SCIENTIST_SHOOT_MOTHER", scientistId: selectedActorId },
      });
    }
  }

  return result;
}

// Helper to find a piece by ID
function findPieceById(state: GameState, id: string): PieceState | undefined {
  if (state.mother?.id === id) return state.mother;
  const baby = state.babies.find((b) => b.id === id);
  if (baby) return baby;
  return state.scientists.find((s) => s.id === id);
}

// Calculate valid moves for action phase
function getValidMoves(
  state: GameState,
  activePiece: PieceState,
  selectedActorId: string,
): Array<{ tileId: number; x: number; y: number }> {
  if (state.phase !== "ACTION_PHASE" || state.actionPoints <= 0) return [];
  if (activePiece.type === "mother") {
    const woundCost = state.motherPaidWoundCost ? 0 : state.motherSleepTokens;
    if (state.actionPoints < woundCost + 1) return [];
  }
  const allPieces = getAllPieces(state);
  const pieceInstance = createPieceFromState(activePiece);
  return pieceInstance.getValidMoves(state.tiles, allPieces, state.fireTokens).filter((move) => {
    const targetTile = state.tiles.find((t) => t.id === move.tileId);
    if (!targetTile) return false;
    const targetSpace = targetTile.spaces.find((s) => s.coordinate.x === move.x && s.coordinate.y === move.y);
    if (!targetSpace || targetSpace.hasMountain) return false;
    const isOccupied = allPieces.some(
      (p) => p.id !== selectedActorId && p.tileId === move.tileId && p.x === move.x && p.y === move.y,
    );
    if (isOccupied) return false;
    const hasFire = state.fireTokens.some((f) => f.tileId === move.tileId && f.x === move.x && f.y === move.y);
    if (hasFire) return false;
    return true;
  });
}

/**
 * Build the highlights map from game state.
 * Returns a map of SpaceId -> SpaceAction with visual style and optional click action.
 */
export function buildSpaceActions(state: GameState): SpaceActions<GameAction> {
  const h = new Map<SpaceId, SpaceAction<GameAction>>();

  const set = (spaceId: SpaceId, style: SpaceStyle, action?: GameAction) => {
    if (!h.has(spaceId)) h.set(spaceId, { style, action });
  };

  // Get selected actor from current player's interaction state
  const currentPlayer = state.activePlayer;
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
  const selectedActorId = interaction.selectedActorId;

  // Fire tokens
  for (const fire of state.fireTokens) {
    set(createSpaceId(fire.tileId, fire.x, fire.y), "fire");
  }

  // Action phase targets
  const actionTargets = getActionTargets(state, selectedActorId);
  for (const target of actionTargets.hostileTargets) {
    set(createSpaceId(target.tileId, target.x, target.y), "hostileTarget", target.action);
  }
  for (const target of actionTargets.selectables) {
    set(createSpaceId(target.tileId, target.x, target.y), "selectable", target.action);
  }
  for (const fire of actionTargets.friendlyFirePositions) {
    set(createSpaceId(fire.tileId, fire.x, fire.y), "selectable", fire.action);
  }

  // Effect phase highlights
  if (state.phase === "EFFECT_PHASE" && state.effectActionsRemaining > 0) {
    const effectType = getCurrentEffectType(state);
    const allPieces = getAllPieces(state);

    // Fear: highlight scientists that can be frightened
    if (effectType === "fear") {
      for (const scientist of state.scientists) {
        if (scientist.tileId === -1 || scientist.isFrightened) continue;
        const action: GameAction = { type: "FRIGHTEN_SCIENTIST", pieceId: scientist.id };
        set(createSpaceId(scientist.tileId, scientist.x, scientist.y), "selectable", action);
      }
    }

    // Sleeping Gas: highlight babies that can be put to sleep
    if (effectType === "sleeping_gas") {
      for (const baby of state.babies) {
        if (baby.tileId === -1 || baby.isAsleep) continue;
        const action: GameAction = { type: "PUT_BABY_TO_SLEEP", pieceId: baby.id };
        set(createSpaceId(baby.tileId, baby.x, baby.y), "selectable", action);
      }
    }

    // Recovery: highlight sleeping babies that can be woken
    if (effectType === "recovery") {
      for (const baby of state.babies) {
        if (baby.tileId === -1 || !baby.isAsleep) continue;
        const action: GameAction = { type: "WAKE_BABY", pieceId: baby.id };
        set(createSpaceId(baby.tileId, baby.x, baby.y), "selectable", action);
      }
    }

    // Mother's Call: two-step selection - first select baby, then destination
    if (effectType === "mothers_call" && state.mother) {
      const selectedBaby = selectedActorId ? state.babies.find((b) => b.id === selectedActorId) : null;

      if (selectedBaby && selectedBaby.tileId !== -1) {
        // Step 2: Show destinations for the selected baby only
        const destinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, selectedBaby, state.mother);
        for (const dest of destinations) {
          const action: GameAction = {
            type: "CALL_BABY",
            babyId: selectedBaby.id,
            tileId: dest.tileId,
            x: dest.x,
            y: dest.y,
          };
          set(createSpaceId(dest.tileId, dest.x, dest.y), "selectable", action);
        }
      } else {
        // Step 1: Highlight babies that can be called (have reachable destinations)
        for (const baby of state.babies) {
          if (baby.tileId === -1) continue;
          const destinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
          if (destinations.length > 0) {
            const action: GameAction = { type: "SELECT_ACTOR", player: "raptor", pieceId: baby.id };
            set(createSpaceId(baby.tileId, baby.x, baby.y), "selectable", action);
          }
        }
      }
    }

    // Reinforcements: highlight valid edge spaces
    if (effectType === "reinforcements" && state.scientistReserve > 0) {
      const topRowTiles = [1, 2, 3];
      const bottomRowTiles = [6, 7, 8];
      for (const tile of state.tiles) {
        if (tile.shape !== "square") continue;
        const isTopRow = topRowTiles.includes(tile.id);
        const isBottomRow = bottomRowTiles.includes(tile.id);
        if (!isTopRow && !isBottomRow) continue;
        const edgeY = isTopRow ? 0 : 2;
        for (let x = 0; x < 3; x++) {
          const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === edgeY);
          if (!space || space.hasMountain) continue;
          if (isSpaceOccupied(state, tile.id, x, edgeY)) continue;
          const action: GameAction = { type: "PLACE_REINFORCEMENT", tileId: tile.id, x, y: edgeY };
          set(createSpaceId(tile.id, x, edgeY), "selectable", action);
        }
      }
    }

    // Recovery: highlight mother if she has sleep tokens
    if (effectType === "recovery" && state.mother && state.motherSleepTokens > 0 && state.mother.tileId !== -1) {
      const action: GameAction = { type: "REMOVE_MOTHER_SLEEP_TOKEN" };
      set(createSpaceId(state.mother.tileId, state.mother.x, state.mother.y), "selectable", action);
    }

    // Fire: highlight valid fire placement spaces
    if (effectType === "fire") {
      const scientistAdjacents = new Set<string>();
      for (const scientist of state.scientists) {
        if (scientist.tileId === -1) continue;
        const pGlobal = localToGlobal(scientist.tileId, scientist.x, scientist.y);
        for (const adj of getAdjacentGlobalCoordinates(pGlobal.globalX, pGlobal.globalY)) {
          scientistAdjacents.add(`${adj.globalX},${adj.globalY}`);
        }
      }
      const fireAdjacents = new Set<string>();
      for (const fire of state.fireTokens) {
        const fGlobal = localToGlobal(fire.tileId, fire.x, fire.y);
        for (const adj of getAdjacentGlobalCoordinates(fGlobal.globalX, fGlobal.globalY)) {
          fireAdjacents.add(`${adj.globalX},${adj.globalY}`);
        }
      }
      const allAdjacents = new Set([...scientistAdjacents, ...fireAdjacents]);
      for (const key of allAdjacents) {
        const [gx, gy] = key.split(",").map(Number);
        const local = globalToLocal(state.tiles, gx, gy);
        if (!local) continue;
        const tile = state.tiles.find((t) => t.id === local.tileId);
        if (!tile) continue;
        const space = tile.spaces.find((s) => s.coordinate.x === local.localX && s.coordinate.y === local.localY);
        if (!space || space.hasMountain || space.isUnusable || space.isExit) continue;
        if (isSpaceOccupied(state, local.tileId, local.localX, local.localY)) continue;
        const hasFire = state.fireTokens.some(
          (f) => f.tileId === local.tileId && f.x === local.localX && f.y === local.localY,
        );
        if (hasFire) continue;
        const action: GameAction = {
          type: "PLACE_FIRE_TOKEN",
          tileId: local.tileId,
          x: local.localX,
          y: local.localY,
        };
        set(createSpaceId(local.tileId, local.localX, local.localY), "selectable", action);
      }
    }

    // Jeep: two-step selection - first select scientist, then destination
    if (effectType === "jeep") {
      const selectedScientist = selectedActorId ? state.scientists.find((s) => s.id === selectedActorId) : null;

      if (selectedScientist && selectedScientist.tileId !== -1 && !selectedScientist.isFrightened) {
        // Step 2: Show destinations for the selected scientist only
        const destinations = getJeepDestinationsWithPaths(
          state.tiles,
          allPieces,
          state.fireTokens,
          selectedScientist,
          [],
        );
        for (const dest of destinations) {
          const action: GameAction = {
            type: "MOVE_JEEP",
            scientistId: selectedScientist.id,
            tileId: dest.tileId,
            x: dest.x,
            y: dest.y,
            path: dest.path,
          };
          set(createSpaceId(dest.tileId, dest.x, dest.y), "selectable", action);
        }
      } else {
        // Step 1: Highlight scientists that can use jeep (have reachable destinations)
        for (const scientist of state.scientists) {
          if (scientist.tileId === -1 || scientist.isFrightened) continue;
          const destinations = getJeepDestinationsWithPaths(state.tiles, allPieces, state.fireTokens, scientist, []);
          if (destinations.length > 0) {
            const action: GameAction = { type: "SELECT_ACTOR", player: "scientist", pieceId: scientist.id };
            set(createSpaceId(scientist.tileId, scientist.x, scientist.y), "selectable", action);
          }
        }
      }
    }
  }

  // Action phase piece selection
  if (state.phase === "ACTION_PHASE") {
    const player = state.activePlayer;

    // Controllable pieces can be clicked to select/deselect
    if (player === "raptor") {
      // Mother can be selected (if not already selected via highlights above)
      if (state.mother && state.mother.tileId !== -1) {
        const action: GameAction =
          selectedActorId === state.mother.id
            ? { type: "SELECT_ACTOR", player: "raptor", pieceId: null }
            : { type: "SELECT_ACTOR", player: "raptor", pieceId: state.mother.id };
        set(createSpaceId(state.mother.tileId, state.mother.x, state.mother.y), "selectable", action);
      }
      // Babies can be selected (awake only)
      for (const baby of state.babies) {
        if (baby.tileId === -1 || baby.isAsleep) continue;
        const action: GameAction =
          selectedActorId === baby.id
            ? { type: "SELECT_ACTOR", player: "raptor", pieceId: null }
            : { type: "SELECT_ACTOR", player: "raptor", pieceId: baby.id };
        set(createSpaceId(baby.tileId, baby.x, baby.y), "selectable", action);
      }
    } else if (player === "scientist") {
      for (const scientist of state.scientists) {
        if (scientist.tileId === -1) continue;

        // Frightened scientist: can stand up (costs 1 AP, not same round frightened)
        if (scientist.isFrightened) {
          if (state.actionPoints > 0 && !state.frightenedThisRound.includes(scientist.id)) {
            const action: GameAction = { type: "ACTION_SCIENTIST_STAND_UP", scientistId: scientist.id };
            set(createSpaceId(scientist.tileId, scientist.x, scientist.y), "selectable", action);
          }
          continue;
        }

        // Non-frightened scientist: can be selected
        const action: GameAction =
          selectedActorId === scientist.id
            ? { type: "SELECT_ACTOR", player: "scientist", pieceId: null }
            : { type: "SELECT_ACTOR", player: "scientist", pieceId: scientist.id };
        set(createSpaceId(scientist.tileId, scientist.x, scientist.y), "selectable", action);
      }
    }
  }

  // Valid moves (action phase) - destinations for selected piece
  const activePiece = selectedActorId ? findPieceById(state, selectedActorId) : null;
  if (activePiece && selectedActorId && state.phase === "ACTION_PHASE") {
    const selectables = getValidMoves(state, activePiece, selectedActorId);
    for (const move of selectables) {
      let action: GameAction | undefined;
      if (activePiece.type === "baby") {
        action = {
          type: "ACTION_MOVE_BABY",
          pieceId: selectedActorId,
          tileId: move.tileId,
          x: move.x,
          y: move.y,
        };
      } else if (activePiece.type === "scientist") {
        action = {
          type: "ACTION_MOVE_SCIENTIST",
          pieceId: selectedActorId,
          tileId: move.tileId,
          x: move.x,
          y: move.y,
        };
      } else if (activePiece.type === "mother") {
        action = {
          type: "ACTION_MOVE_MOTHER",
          pieceId: selectedActorId,
          tileId: move.tileId,
          x: move.x,
          y: move.y,
        };
      }
      set(createSpaceId(move.tileId, move.x, move.y), "selectable", action);
    }
  }

  // Setup phase
  if (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") {
    // Placed pieces can be removed by clicking on them
    if (state.phase === "RAPTOR_SETUP") {
      if (state.mother && state.mother.tileId !== -1) {
        const action: GameAction = { type: "REMOVE_PIECE", pieceId: state.mother.id };
        set(createSpaceId(state.mother.tileId, state.mother.x, state.mother.y), "selectable", action);
      }
      for (const baby of state.babies) {
        if (baby.tileId === -1) continue;
        const action: GameAction = { type: "REMOVE_PIECE", pieceId: baby.id };
        set(createSpaceId(baby.tileId, baby.x, baby.y), "selectable", action);
      }
    } else {
      for (const scientist of state.scientists) {
        if (scientist.tileId === -1) continue;
        const action: GameAction = { type: "REMOVE_PIECE", pieceId: scientist.id };
        set(createSpaceId(scientist.tileId, scientist.x, scientist.y), "selectable", action);
      }
    }

    // Empty spaces for placement
    const validTiles = getValidSetupTiles(state);
    for (const tileId of validTiles) {
      for (const { x, y } of getValidSetupSpaces(state, tileId)) {
        let action: GameAction | undefined;
        if (state.phase === "RAPTOR_SETUP") {
          action = !isMotherPlaced(state)
            ? { type: "PLACE_MOTHER", tileId, x, y }
            : { type: "PLACE_BABY", tileId, x, y };
        } else if (state.phase === "SCIENTIST_SETUP") {
          action = { type: "PLACE_SCIENTIST", tileId, x, y };
        }
        set(createSpaceId(tileId, x, y), "selectable", action);
      }
    }

    // Setup move targets (empty spaces on tiles with pieces)
    for (const tile of state.tiles) {
      const pieceOnTile =
        state.phase === "RAPTOR_SETUP"
          ? state.mother?.tileId === tile.id
            ? state.mother
            : state.babies.find((b) => b.tileId === tile.id)
          : state.scientists.find((s) => s.tileId === tile.id);

      if (pieceOnTile) {
        for (const space of tile.spaces) {
          if (space.hasMountain || space.isUnusable) continue;
          if (state.phase === "SCIENTIST_SETUP" && space.isExit) continue;
          if (isSpaceOccupied(state, tile.id, space.coordinate.x, space.coordinate.y)) continue;
          const action: GameAction = {
            type: "MOVE_PIECE_ON_TILE",
            pieceId: pieceOnTile.id,
            tileId: tile.id,
            x: space.coordinate.x,
            y: space.coordinate.y,
          };
          set(space.id, "selectable", action);
        }
      }
    }
  }

  // Mother return destinations
  if (state.phase === "MOTHER_RETURN") {
    for (const tile of state.tiles) {
      for (const space of tile.spaces) {
        if (space.hasMountain || space.isUnusable || space.isExit) continue;
        // Allow clicking on mother's current position (to see it's selected) or any empty space
        const isMotherHere =
          state.mother.tileId === tile.id &&
          state.mother.x === space.coordinate.x &&
          state.mother.y === space.coordinate.y;
        if (!isMotherHere && isSpaceOccupied(state, tile.id, space.coordinate.x, space.coordinate.y)) continue;
        const action: GameAction = {
          type: "MOTHER_RETURN",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        };
        set(space.id, "selectable", action);
      }
    }
  }

  return h;
}
