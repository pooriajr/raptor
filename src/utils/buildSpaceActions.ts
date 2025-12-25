import type { GameState } from "../types/gameState";
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
import { getReserveCount } from "./scientistUtils";
import { getAllBoardPositions, isSpaceOccupied, tileHasRaptor } from "./boardUtils";

// Piece type for createPieceFromState
type PieceType = "mother" | "baby" | "scientist";

// Adapter: create a piece class instance from position and type
function createPieceFromPosition(id: string, type: PieceType, tileId: number, x: number, y: number) {
  switch (type) {
    case "mother":
      return new MotherRaptor(id, tileId, x, y);
    case "baby":
      return new BabyRaptor(id, tileId, x, y);
    case "scientist":
      return new Scientist(id, tileId, x, y);
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
    const tilesWithScientist = new Set(
      Object.values(state.scientists)
        .filter((s) => s.position)
        .map((s) => s.position!.tileId),
    );
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
  disabledPositions: Array<{ tileId: number; x: number; y: number; tooltip: string }>;
}

// Helper to get position info for a piece
interface PieceInfo {
  id: string;
  type: PieceType;
  tileId: number;
  x: number;
  y: number;
  isAsleep?: boolean;
}

function getPieceInfo(state: GameState, pieceId: string): PieceInfo | null {
  if (state.mother.id === pieceId && state.mother.position) {
    return {
      id: pieceId,
      type: "mother",
      tileId: state.mother.position.tileId,
      x: state.mother.position.x,
      y: state.mother.position.y,
    };
  }
  const baby = state.babies[pieceId];
  if (baby?.position) {
    return {
      id: pieceId,
      type: "baby",
      tileId: baby.position.tileId,
      x: baby.position.x,
      y: baby.position.y,
      isAsleep: baby.isAsleep,
    };
  }
  const scientist = state.scientists[pieceId];
  if (scientist?.position) {
    return {
      id: pieceId,
      type: "scientist",
      tileId: scientist.position.tileId,
      x: scientist.position.x,
      y: scientist.position.y,
    };
  }
  return null;
}

// Calculate action targets for action phase
function getActionTargets(state: GameState, selectedActorId: string | null): ActionTargets {
  const result: ActionTargets = {
    hostileTargets: [],
    selectables: [],
    friendlyFirePositions: [],
    disabledPositions: [],
  };

  if (state.phase !== "ACTION_PHASE" || !selectedActorId || state.actionPoints <= 0) return result;

  const selectedPiece = getPieceInfo(state, selectedActorId);
  if (!selectedPiece) return result;

  const selectedGlobal = localToGlobal(selectedPiece.tileId, selectedPiece.x, selectedPiece.y);
  const adjacentCoords = getAdjacentGlobalCoordinates(selectedGlobal.globalX, selectedGlobal.globalY);

  // Build list of all pieces with their positions for adjacency check
  const allPiecesInfo: PieceInfo[] = [];
  if (state.mother.position) {
    allPiecesInfo.push({
      id: state.mother.id,
      type: "mother",
      tileId: state.mother.position.tileId,
      x: state.mother.position.x,
      y: state.mother.position.y,
    });
  }
  for (const baby of Object.values(state.babies)) {
    if (baby.position) {
      allPiecesInfo.push({
        id: baby.id,
        type: "baby",
        tileId: baby.position.tileId,
        x: baby.position.x,
        y: baby.position.y,
        isAsleep: baby.isAsleep,
      });
    }
  }
  for (const scientist of Object.values(state.scientists)) {
    if (scientist.position) {
      allPiecesInfo.push({
        id: scientist.id,
        type: "scientist",
        tileId: scientist.position.tileId,
        x: scientist.position.x,
        y: scientist.position.y,
      });
    }
  }

  const adjacentPieces = allPiecesInfo.filter((p) => {
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
      } else if (adj.type === "baby") {
        const baby = state.babies[adj.id];
        if (!baby?.isAsleep) continue;
        if (baby.asleepThisRound) {
          result.disabledPositions.push({
            tileId: adj.tileId,
            x: adj.x,
            y: adj.y,
            tooltip: "Can't wake up a baby raptor the same round it was put to sleep by Sleeping Gas",
          });
          continue;
        }
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
  }

  const scientistState = state.scientists[selectedPiece.id];
  const isScientistActor =
    selectedPiece.type === "scientist" &&
    state.activePlayer === "scientist" &&
    !!scientistState?.position &&
    !scientistState.isFrightened;

  const hasAggressiveLockout = isScientistActor && scientistState.hasUsedAggressiveAction;

  if (isScientistActor && !hasAggressiveLockout) {
    for (const adj of adjacentPieces) {
      if (adj.type === "baby") {
        const baby = state.babies[adj.id];
        const action: GameAction = baby?.isAsleep
          ? { type: "ACTION_SCIENTIST_CAPTURE_BABY", scientistId: selectedActorId, targetId: adj.id }
          : { type: "ACTION_SCIENTIST_SLEEP_BABY", scientistId: selectedActorId, targetId: adj.id };
        result.hostileTargets.push({ pieceId: adj.id, tileId: adj.tileId, x: adj.x, y: adj.y, action });
      }
    }
    const mother = state.mother;
    if (mother.position && hasLineOfSight(state, scientistState, mother)) {
      result.hostileTargets.push({
        pieceId: mother.id,
        tileId: mother.position.tileId,
        x: mother.position.x,
        y: mother.position.y,
        action: { type: "ACTION_SCIENTIST_SHOOT_MOTHER", scientistId: selectedActorId },
      });
    }
  } else if (hasAggressiveLockout) {
    for (const adj of adjacentPieces) {
      if (adj.type === "baby") {
        result.disabledPositions.push({
          tileId: adj.tileId,
          x: adj.x,
          y: adj.y,
          tooltip: "This scientist already used an aggressive action this round",
        });
      }
    }
    const mother = state.mother;
    if (mother.position && hasLineOfSight(state, scientistState, mother)) {
      result.disabledPositions.push({
        tileId: mother.position.tileId,
        x: mother.position.x,
        y: mother.position.y,
        tooltip: "This scientist already used an aggressive action this round",
      });
    }
  }

  return result;
}

// Calculate valid moves for action phase
function getValidMoves(
  state: GameState,
  pieceInfo: PieceInfo,
  selectedActorId: string,
  options?: { ignoreMotherWoundCost?: boolean },
): Array<{ tileId: number; x: number; y: number }> {
  if (state.phase !== "ACTION_PHASE" || state.actionPoints <= 0) return [];
  if (pieceInfo.type === "mother") {
    const woundCost = state.mother.paidWoundCost ? 0 : state.mother.sleepTokens;
    if (!options?.ignoreMotherWoundCost && state.actionPoints < woundCost + 1) return [];
  }
  const allPieces = getAllBoardPositions(state);
  const pieceInstance = createPieceFromPosition(
    pieceInfo.id,
    pieceInfo.type,
    pieceInfo.tileId,
    pieceInfo.x,
    pieceInfo.y,
  );
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
    if (hasFire && pieceInfo.type !== "scientist") return false;
    return true;
  });
}

/**
 * Build the highlights map from game state.
 * Returns a map of SpaceId -> SpaceAction with visual style and optional click action.
 */
export function buildSpaceActions(state: GameState): SpaceActions<GameAction> {
  const h = new Map<SpaceId, SpaceAction<GameAction>>();

  const set = (spaceId: SpaceId, style: SpaceStyle, action?: GameAction, tooltip?: string) => {
    if (!h.has(spaceId)) {
      h.set(spaceId, { style, action, tooltip });
      return;
    }
    const existing = h.get(spaceId);
    if (!existing) return;
    if (existing.style === "fire" && style !== "fire") {
      existing.style = style;
    }
    if (action && !existing.action) {
      existing.action = action;
    }
    if (tooltip) {
      existing.tooltip = tooltip;
    }
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
    set(createSpaceId(fire.tileId, fire.x, fire.y), "hostileTarget", fire.action);
  }
  for (const disabled of actionTargets.disabledPositions) {
    set(createSpaceId(disabled.tileId, disabled.x, disabled.y), "disabled", undefined, disabled.tooltip);
  }

  // Effect phase highlights
  if (state.phase === "EFFECT_PHASE" && state.effectActionsRemaining > 0) {
    const effectType = getCurrentEffectType(state);
    const allPieces = getAllBoardPositions(state);

    // Fear: highlight scientists that can be frightened
    if (effectType === "fear") {
      for (const scientist of Object.values(state.scientists)) {
        if (!scientist.position || scientist.isFrightened) continue;
        const action: GameAction = { type: "FRIGHTEN_SCIENTIST", pieceId: scientist.id };
        set(createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y), "selectable", action);
      }
    }

    // Sleeping Gas: highlight babies that can be put to sleep
    if (effectType === "sleeping_gas") {
      for (const baby of Object.values(state.babies)) {
        if (!baby.position || baby.isAsleep) continue;
        const action: GameAction = { type: "PUT_BABY_TO_SLEEP", pieceId: baby.id };
        set(createSpaceId(baby.position.tileId, baby.position.x, baby.position.y), "selectable", action);
      }
    }

    // Disappearance: highlight mother to trigger disappearance
    if (effectType === "disappearance" && state.mother.position && !state.mother.disappeared) {
      const action: GameAction = { type: "DISAPPEARANCE" };
      set(
        createSpaceId(state.mother.position.tileId, state.mother.position.x, state.mother.position.y),
        "selectable",
        action,
      );
    }

    // Recovery: highlight sleeping babies that can be woken
    if (effectType === "recovery") {
      for (const baby of Object.values(state.babies)) {
        if (!baby.position || !baby.isAsleep) continue;
        const action: GameAction = { type: "WAKE_BABY", pieceId: baby.id };
        set(createSpaceId(baby.position.tileId, baby.position.x, baby.position.y), "selectable", action);
      }
    }

    // Mother's Call: two-step selection - first select baby, then destination
    if (effectType === "mothers_call" && state.mother.position) {
      const selectedBaby = selectedActorId ? state.babies[selectedActorId] : null;

      if (selectedBaby?.position) {
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
        // Allow clicking on selected baby to deselect, or other babies to switch
        for (const baby of Object.values(state.babies)) {
          if (!baby.position) continue;
          const babyDestinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
          if (babyDestinations.length === 0) continue;
          const isSelected = baby.id === selectedActorId;
          const action: GameAction = {
            type: "SELECT_ACTOR",
            player: "raptor",
            pieceId: isSelected ? null : baby.id,
          };
          set(
            createSpaceId(baby.position.tileId, baby.position.x, baby.position.y),
            isSelected ? "selected" : "selectable",
            action,
          );
        }
      } else {
        // Step 1: Highlight babies that can be called (have reachable destinations)
        for (const baby of Object.values(state.babies)) {
          if (!baby.position) continue;
          const destinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
          if (destinations.length > 0) {
            const action: GameAction = { type: "SELECT_ACTOR", player: "raptor", pieceId: baby.id };
            set(createSpaceId(baby.position.tileId, baby.position.x, baby.position.y), "selectable", action);
          }
        }
      }
    }

    // Reinforcements: highlight valid edge spaces
    if (effectType === "reinforcements" && getReserveCount(state.scientists) > 0) {
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
    if (effectType === "recovery" && state.mother.position && state.mother.sleepTokens > 0) {
      const action: GameAction = { type: "REMOVE_MOTHER_SLEEP_TOKEN" };
      set(
        createSpaceId(state.mother.position.tileId, state.mother.position.x, state.mother.position.y),
        "selectable",
        action,
      );
    }

    // Fire: highlight valid fire placement spaces
    if (effectType === "fire") {
      const scientistAdjacents = new Set<string>();
      for (const scientist of Object.values(state.scientists)) {
        if (!scientist.position) continue;
        const pGlobal = localToGlobal(scientist.position.tileId, scientist.position.x, scientist.position.y);
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
      const selectedScientistState = selectedActorId ? state.scientists[selectedActorId] : null;

      if (selectedScientistState?.position && !selectedScientistState.isFrightened) {
        // Step 2: Show destinations for the selected scientist only
        const destinations = getJeepDestinationsWithPaths(
          state.tiles,
          allPieces,
          state.fireTokens,
          selectedScientistState.id,
          selectedScientistState.position,
          [],
        );
        for (const dest of destinations) {
          const action: GameAction = {
            type: "MOVE_JEEP",
            scientistId: selectedScientistState.id,
            tileId: dest.tileId,
            x: dest.x,
            y: dest.y,
            path: dest.path,
          };
          set(createSpaceId(dest.tileId, dest.x, dest.y), "selectable", action);
        }
        // Allow clicking on selected scientist to deselect, or other scientists to switch
        for (const scientist of Object.values(state.scientists)) {
          if (!scientist.position || scientist.isFrightened) continue;
          const isSelected = scientist.id === selectedActorId;
          const action: GameAction = {
            type: "SELECT_ACTOR",
            player: "scientist",
            pieceId: isSelected ? null : scientist.id,
          };
          set(
            createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y),
            isSelected ? "selected" : "selectable",
            action,
          );
        }
      } else {
        // Step 1: Highlight scientists that can use jeep (have reachable destinations)
        for (const scientist of Object.values(state.scientists)) {
          if (!scientist.position || scientist.isFrightened) continue;
          const destinations = getJeepDestinationsWithPaths(
            state.tiles,
            allPieces,
            state.fireTokens,
            scientist.id,
            scientist.position,
            [],
          );
          if (destinations.length > 0) {
            const action: GameAction = { type: "SELECT_ACTOR", player: "scientist", pieceId: scientist.id };
            set(
              createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y),
              "selectable",
              action,
            );
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
      if (state.mother.position) {
        const isSelected = selectedActorId === state.mother.id;
        const action: GameAction = isSelected
          ? { type: "SELECT_ACTOR", player: "raptor", pieceId: null }
          : { type: "SELECT_ACTOR", player: "raptor", pieceId: state.mother.id };
        set(
          createSpaceId(state.mother.position.tileId, state.mother.position.x, state.mother.position.y),
          isSelected ? "selected" : "selectable",
          action,
        );
      }
      // Babies can be selected (awake only)
      for (const baby of Object.values(state.babies)) {
        if (!baby.position || baby.isAsleep) continue;
        const isSelected = selectedActorId === baby.id;
        const action: GameAction = isSelected
          ? { type: "SELECT_ACTOR", player: "raptor", pieceId: null }
          : { type: "SELECT_ACTOR", player: "raptor", pieceId: baby.id };
        set(
          createSpaceId(baby.position.tileId, baby.position.x, baby.position.y),
          isSelected ? "selected" : "selectable",
          action,
        );
      }
    } else if (player === "scientist") {
      for (const scientist of Object.values(state.scientists)) {
        if (!scientist.position) continue;

        // Frightened scientist: can stand up (costs 1 AP, not same round frightened)
        if (scientist.isFrightened) {
          if (state.actionPoints > 0 && !scientist.frightenedThisRound) {
            const action: GameAction = { type: "ACTION_SCIENTIST_STAND_UP", scientistId: scientist.id };
            set(
              createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y),
              "selectable",
              action,
            );
          } else if (state.actionPoints > 0 && scientist.frightenedThisRound) {
            set(
              createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y),
              "disabled",
              undefined,
              "Can't stand up a scientist the same round they were frightened by Fear",
            );
          }
          continue;
        }

        // Non-frightened scientist: can be selected
        const isSelected = selectedActorId === scientist.id;
        const action: GameAction = isSelected
          ? { type: "SELECT_ACTOR", player: "scientist", pieceId: null }
          : { type: "SELECT_ACTOR", player: "scientist", pieceId: scientist.id };
        set(
          createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y),
          isSelected ? "selected" : "selectable",
          action,
        );
      }
    }
  }

  // Valid moves (action phase) - destinations for selected piece
  const activePiece = selectedActorId ? getPieceInfo(state, selectedActorId) : null;
  if (activePiece && selectedActorId && state.phase === "ACTION_PHASE") {
    const woundCost = activePiece.type === "mother" && !state.mother.paidWoundCost ? state.mother.sleepTokens : 0;
    const cannotAffordMotherMove =
      activePiece.type === "mother" && state.actionPoints > 0 && state.actionPoints < woundCost + 1;

    const moves = cannotAffordMotherMove
      ? getValidMoves(state, activePiece, selectedActorId, { ignoreMotherWoundCost: true })
      : getValidMoves(state, activePiece, selectedActorId);

    for (const move of moves) {
      if (cannotAffordMotherMove) {
        set(
          createSpaceId(move.tileId, move.x, move.y),
          "disabled",
          undefined,
          `Not enough action points: moving the mother costs ${woundCost + 1} AP (${woundCost} from sleep tokens + 1 move)`,
        );
        continue;
      }

      let action: GameAction | undefined;
      if (activePiece.type === "baby") {
        action = { type: "ACTION_MOVE_BABY", pieceId: selectedActorId, tileId: move.tileId, x: move.x, y: move.y };
      } else if (activePiece.type === "scientist") {
        action = {
          type: "ACTION_MOVE_SCIENTIST",
          pieceId: selectedActorId,
          tileId: move.tileId,
          x: move.x,
          y: move.y,
        };
      } else if (activePiece.type === "mother") {
        action = { type: "ACTION_MOVE_MOTHER", pieceId: selectedActorId, tileId: move.tileId, x: move.x, y: move.y };
      }
      set(createSpaceId(move.tileId, move.x, move.y), "selectable", action);
    }
  }

  // Setup phase
  if (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") {
    // Placed pieces can be removed by clicking on them
    if (state.phase === "RAPTOR_SETUP") {
      if (state.mother.position) {
        const action: GameAction = { type: "REMOVE_PIECE", pieceId: state.mother.id };
        set(
          createSpaceId(state.mother.position.tileId, state.mother.position.x, state.mother.position.y),
          "selectable",
          action,
        );
      }
      for (const baby of Object.values(state.babies)) {
        if (!baby.position) continue;
        const action: GameAction = { type: "REMOVE_PIECE", pieceId: baby.id };
        set(createSpaceId(baby.position.tileId, baby.position.x, baby.position.y), "selectable", action);
      }
    } else {
      for (const scientist of Object.values(state.scientists)) {
        if (!scientist.position) continue;
        const action: GameAction = { type: "REMOVE_PIECE", pieceId: scientist.id };
        set(createSpaceId(scientist.position.tileId, scientist.position.x, scientist.position.y), "selectable", action);
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
      let pieceOnTile: { id: string; tileId: number } | null = null;
      if (state.phase === "RAPTOR_SETUP") {
        if (state.mother.position?.tileId === tile.id) {
          pieceOnTile = { id: state.mother.id, tileId: tile.id };
        } else {
          const baby = Object.values(state.babies).find((b) => b.position?.tileId === tile.id);
          if (baby) {
            pieceOnTile = { id: baby.id, tileId: tile.id };
          }
        }
      } else {
        // Find scientist on this tile
        const scientist = Object.values(state.scientists).find((s) => s.position?.tileId === tile.id);
        if (scientist) {
          pieceOnTile = { id: scientist.id, tileId: tile.id };
        }
      }

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
        // Allow clicking any empty space
        if (isSpaceOccupied(state, tile.id, space.coordinate.x, space.coordinate.y)) continue;
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
