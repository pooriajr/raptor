import "./Board.css";
import Tile from "./Tile.tsx";
import { useEffect, useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import type { PieceState } from "./types/gameState.ts";
import {
  createSpaceId,
  type SpaceId,
  type SpaceHighlights,
  type SpaceHighlight,
  type HighlightStyle,
} from "./types/highlights.ts";
import type { GameAction } from "./state/gameReducer.ts";
import { isMotherPlaced } from "./utils/pieceUtils.ts";
import { MotherRaptor } from "./pieces/MotherRaptor.ts";
import { BabyRaptor } from "./pieces/BabyRaptor.ts";
import { Scientist } from "./pieces/Scientist.ts";

import { getReachableDestinationsOnMotherTile, getJeepDestinationsWithPaths } from "./utils/pathfinding.ts";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "./types/coordinates.ts";
import { getCurrentEffectType } from "./utils/effectUtils.ts";

// Helper to check if a scientist has line of sight to the mother for shooting
function hasLineOfSight(
  tiles: import("./types/board.ts").Tile[],
  scientists: PieceState[],
  scientist: PieceState,
  mother: PieceState,
): boolean {
  const sciGlobal = localToGlobal(scientist.tileId, scientist.x, scientist.y);
  const motherGlobal = localToGlobal(mother.tileId, mother.x, mother.y);

  const sameRow = sciGlobal.globalY === motherGlobal.globalY;
  const sameCol = sciGlobal.globalX === motherGlobal.globalX;
  if (!sameRow && !sameCol) return false;
  if (sameRow && sameCol) return false;

  if (sameRow) {
    const minX = Math.min(sciGlobal.globalX, motherGlobal.globalX);
    const maxX = Math.max(sciGlobal.globalX, motherGlobal.globalX);
    for (let x = minX + 1; x < maxX; x++) {
      for (const tile of tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
          if (spaceGlobal.globalX === x && spaceGlobal.globalY === sciGlobal.globalY) {
            if (space.hasMountain) return false;
            const pieceHere = scientists.find(
              (s) => s.tileId === tile.id && s.x === space.coordinate.x && s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) return false;
          }
        }
      }
    }
  } else {
    const minY = Math.min(sciGlobal.globalY, motherGlobal.globalY);
    const maxY = Math.max(sciGlobal.globalY, motherGlobal.globalY);
    for (let y = minY + 1; y < maxY; y++) {
      for (const tile of tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
          if (spaceGlobal.globalX === sciGlobal.globalX && spaceGlobal.globalY === y) {
            if (space.hasMountain) return false;
            const pieceHere = scientists.find(
              (s) => s.tileId === tile.id && s.x === space.coordinate.x && s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) return false;
          }
        }
      }
    }
  }
  return true;
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

function Board() {
  const { state, dispatch } = useGame();

  const currentPlayer = state.activePlayer;
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
  const selectedActorId = interaction.selectedActorId;

  const prevPhaseRef = useRef(state.phase);

  // Reset selected card when phase changes
  useEffect(() => {
    if (currentPlayer) {
      dispatch({ type: "SELECT_CARD", player: currentPlayer, card: null });
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw cards when entering card selection phases
  useEffect(() => {
    const phaseChanged = state.phase !== prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (!phaseChanged) return;

    const isScientistSelection = state.phase === "SCIENTIST_CARD_SELECTION";
    const isRaptorSelection = state.phase === "RAPTOR_CARD_SELECTION";

    if (isScientistSelection || isRaptorSelection) {
      const player = isScientistSelection ? "scientist" : "raptor";

      dispatch({ type: "DRAW_CARDS", player });
      dispatch({ type: "SET_NEW_DRAW", player, isNewDraw: true });
      const timeout = setTimeout(() => {
        dispatch({ type: "SET_NEW_DRAW", player, isNewDraw: false });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.phase, dispatch]);

  // Read action phase state from context
  const actionPhaseSavedState = state.actionPhaseSavedState;

  // Helper to get all pieces as a single array
  const getAllPieces = (): PieceState[] => {
    const pieces: PieceState[] = [];
    if (state.mother) pieces.push(state.mother);
    pieces.push(...state.babies);
    pieces.push(...state.scientists);
    return pieces;
  };

  // Helper to find a piece by ID
  const findPieceById = (id: string): PieceState | undefined => {
    if (state.mother?.id === id) return state.mother;
    const baby = state.babies.find((b) => b.id === id);
    if (baby) return baby;
    return state.scientists.find((s) => s.id === id);
  };

  // Reset interactions when leaving effect/action phases
  useEffect(() => {
    if (state.phase !== "EFFECT_PHASE" && state.phase !== "ACTION_PHASE") {
      dispatch({ type: "RESET_ALL_INTERACTIONS" });
    }
  }, [state.phase, dispatch]);

  // Save state when entering action phase, reset when leaving
  useEffect(() => {
    if (state.phase === "ACTION_PHASE") {
      if (actionPhaseSavedState === null) {
        dispatch({ type: "SAVE_ACTION_PHASE_STATE", savedState: state });
      }
    } else {
      if (currentPlayer) {
        dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId: null });
      }
      dispatch({ type: "CLEAR_ACTION_PHASE_STATE" });
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dispatch effects that require no user input
  useEffect(() => {
    if (state.phase === "EFFECT_PHASE") {
      const scientistCard = state.scientistCards.played;
      const raptorCard = state.raptorCards.played;
      if (scientistCard !== null && raptorCard !== null) {
        const raptorHasEffect = raptorCard < scientistCard;
        if (raptorHasEffect && (raptorCard === 2 || raptorCard === 6)) {
          dispatch({ type: "DISAPPEARANCE" });
        }
      }
    }
  }, [state.phase, state.scientistCards.played, state.raptorCards.played, dispatch]);

  // Auto-dispatch round end
  useEffect(() => {
    if (state.phase === "ROUND_END") {
      dispatch({ type: "END_ROUND" });
    }
  }, [state.phase, dispatch]);

  // Handle piece interactions - returns true if handled
  const handlePieceInteraction = (pieceId: string): boolean => {
    // Handle effect phase targeting (immediate execution)
    if (state.phase === "EFFECT_PHASE" && state.effectActionsRemaining > 0) {
      const effectType = getCurrentEffectType(state);
      const piece = findPieceById(pieceId);
      if (!piece) return false;

      if (effectType === "fear" && piece.type === "scientist" && !piece.isFrightened) {
        dispatch({ type: "FRIGHTEN_SCIENTIST", pieceId });
        return true;
      }
      if (effectType === "sleeping_gas" && piece.type === "baby" && !piece.isAsleep) {
        dispatch({ type: "PUT_BABY_TO_SLEEP", pieceId });
        return true;
      }
      if (effectType === "recovery" && piece.type === "baby" && piece.isAsleep) {
        dispatch({ type: "WAKE_BABY", pieceId });
        return true;
      }
      // Mother's Call and Jeep are handled via highlights (two-step: piece then destination)
      return false;
    }

    // Handle action phase
    if (state.phase === "ACTION_PHASE") {
      const piece = findPieceById(pieceId);
      if (!piece) return false;

      // Check if clicking on an action target
      if (selectedActorId && state.actionPoints > 0) {
        const selectedPiece = findPieceById(selectedActorId);
        if (selectedPiece) {
          const selectedGlobal = localToGlobal(selectedPiece.tileId, selectedPiece.x, selectedPiece.y);
          const targetGlobal = localToGlobal(piece.tileId, piece.x, piece.y);
          const adjacentCoords = getAdjacentGlobalCoordinates(selectedGlobal.globalX, selectedGlobal.globalY);
          const isAdjacent = adjacentCoords.some(
            (adj) => adj.globalX === targetGlobal.globalX && adj.globalY === targetGlobal.globalY,
          );

          if (isAdjacent) {
            if (selectedPiece.type === "mother" && state.activePlayer === "raptor") {
              if (piece.type === "scientist") {
                dispatch({ type: "ACTION_MOTHER_KILL_SCIENTIST", targetId: pieceId });
                return true;
              }
              if (piece.type === "baby" && piece.isAsleep) {
                dispatch({ type: "ACTION_MOTHER_WAKE_BABY", targetId: pieceId });
                return true;
              }
            }
            if (
              selectedPiece.type === "scientist" &&
              state.activePlayer === "scientist" &&
              !selectedPiece.isFrightened
            ) {
              if (piece.type === "baby") {
                if (piece.isAsleep) {
                  dispatch({
                    type: "ACTION_SCIENTIST_CAPTURE_BABY",
                    scientistId: selectedActorId,
                    targetId: pieceId,
                  });
                } else {
                  dispatch({
                    type: "ACTION_SCIENTIST_SLEEP_BABY",
                    scientistId: selectedActorId,
                    targetId: pieceId,
                  });
                }
                return true;
              }
            }
          }

          // Shooting mother (line of sight, not adjacent)
          if (
            selectedPiece.type === "scientist" &&
            state.activePlayer === "scientist" &&
            !selectedPiece.isFrightened &&
            !state.aggressiveActionsUsed.includes(selectedPiece.id) &&
            piece.type === "mother"
          ) {
            if (hasLineOfSight(state.tiles, state.scientists, selectedPiece, piece)) {
              dispatch({ type: "ACTION_SCIENTIST_SHOOT_MOTHER", scientistId: selectedActorId });
              return true;
            }
          }
        }
      }

      // Check if piece can be controlled
      const canControl =
        (state.activePlayer === "raptor" && (piece.type === "baby" || piece.type === "mother")) ||
        (state.activePlayer === "scientist" && piece.type === "scientist");

      if (!canControl) return false;
      if (piece.type === "baby" && piece.isAsleep) return false;

      // Frightened scientist standing up
      if (piece.type === "scientist" && piece.isFrightened) {
        if (state.actionPoints > 0 && !state.frightenedThisRound.includes(pieceId)) {
          dispatch({ type: "ACTION_SCIENTIST_STAND_UP", scientistId: pieceId });
          if (currentPlayer) {
            dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId });
          }
        }
        return true;
      }

      // Toggle selection
      if (currentPlayer) {
        if (selectedActorId === pieceId) {
          dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId: null });
        } else {
          dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId });
        }
      }
      return true;
    }

    return false;
  };

  // Unified space click handler
  const handleSpaceClick = (tileId: number, x: number, y: number, pieceId: string | null) => {
    const spaceId = createSpaceId(tileId, x, y);

    // Setup phase: clicking on a placed piece removes it
    if (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") {
      if (pieceId) {
        const isRaptorPiece = pieceId === "mother" || pieceId.startsWith("baby-");
        const isScientistPiece = pieceId.startsWith("scientist-");
        if (
          (state.phase === "RAPTOR_SETUP" && isRaptorPiece) ||
          (state.phase === "SCIENTIST_SETUP" && isScientistPiece)
        ) {
          dispatch({ type: "REMOVE_PIECE", pieceId });
          return;
        }
        return;
      }
    }

    // Check if space has a highlight with action
    const highlight = highlights.get(spaceId);
    if (highlight?.action) {
      dispatch(highlight.action);
      return;
    }

    // Handle piece interactions
    if (pieceId) {
      handlePieceInteraction(pieceId);
    }
  };

  // Helper to check if a space is occupied
  const isSpaceOccupied = (tileId: number, x: number, y: number): boolean => {
    if (state.mother?.tileId === tileId && state.mother.x === x && state.mother.y === y) return true;
    if (state.babies.some((b) => b.tileId === tileId && b.x === x && b.y === y)) return true;
    if (state.scientists.some((s) => s.tileId === tileId && s.x === x && s.y === y)) return true;
    return false;
  };

  // Helper to check if tile has raptors
  const tileHasRaptor = (tileId: number): boolean => {
    if (state.mother?.tileId === tileId) return true;
    return state.babies.some((b) => b.tileId === tileId);
  };

  // Get valid setup tiles
  const getValidSetupTiles = (): number[] => {
    if (state.phase === "RAPTOR_SETUP") {
      if (!isMotherPlaced(state)) return [2, 7];
      const squareTiles = state.tiles.filter((t) => t.shape === "square");
      return squareTiles.filter((t) => !tileHasRaptor(t.id)).map((t) => t.id);
    }
    if (state.phase === "SCIENTIST_SETUP") {
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      const tilesWithScientist = new Set(state.scientists.map((s) => s.tileId));
      return lTiles.filter((t) => !tilesWithScientist.has(t.id)).map((t) => t.id);
    }
    return [];
  };

  // Get valid setup spaces on a tile
  const getValidSetupSpaces = (tileId: number): Array<{ x: number; y: number }> => {
    const tile = state.tiles.find((t) => t.id === tileId);
    if (!tile) return [];
    const validSpaces: Array<{ x: number; y: number }> = [];
    for (const space of tile.spaces) {
      if (space.isUnusable || space.hasMountain) continue;
      if (state.phase === "SCIENTIST_SETUP" && space.isExit) continue;
      if (isSpaceOccupied(tileId, space.coordinate.x, space.coordinate.y)) continue;
      validSpaces.push({ x: space.coordinate.x, y: space.coordinate.y });
    }
    return validSpaces;
  };

  // Calculate setup placement spaces
  const setupPlacementSpaces: Array<{ tileId: number; x: number; y: number }> = (() => {
    if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") return [];
    const validTiles = getValidSetupTiles();
    const spaces: Array<{ tileId: number; x: number; y: number }> = [];
    for (const tileId of validTiles) {
      for (const { x, y } of getValidSetupSpaces(tileId)) {
        spaces.push({ tileId, x, y });
      }
    }
    return spaces;
  })();

  const validSetupTileIds = new Set(getValidSetupTiles());

  // Get selected action piece for movement
  const activePieceId = state.phase === "ACTION_PHASE" ? selectedActorId : null;
  const activePiece = activePieceId ? findPieceById(activePieceId) : null;

  // Calculate valid moves for action phase
  const validMoves = activePiece
    ? (() => {
        if (state.phase === "ACTION_PHASE" && state.actionPoints <= 0) return [];
        if (state.phase === "ACTION_PHASE" && activePiece.type === "mother") {
          const woundCost = state.motherPaidWoundCost ? 0 : state.motherSleepTokens;
          if (state.actionPoints < woundCost + 1) return [];
        }
        const allPieces = getAllPieces();
        const pieceInstance = createPieceFromState(activePiece);
        return pieceInstance.getValidMoves(state.tiles, allPieces, state.fireTokens).filter((move) => {
          const targetTile = state.tiles.find((t) => t.id === move.tileId);
          if (!targetTile) return false;
          const targetSpace = targetTile.spaces.find((s) => s.coordinate.x === move.x && s.coordinate.y === move.y);
          if (!targetSpace || targetSpace.hasMountain) return false;
          const isOccupied = allPieces.some(
            (p) => p.id !== activePieceId && p.tileId === move.tileId && p.x === move.x && p.y === move.y,
          );
          if (isOccupied) return false;
          const hasFire = state.fireTokens.some((f) => f.tileId === move.tileId && f.x === move.x && f.y === move.y);
          if (hasFire) return false;
          return true;
        });
      })()
    : [];

  // Calculate action targets
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

  const actionTargets = (() => {
    const result = {
      hostileTargets: [] as ActionTarget[],
      friendlyTargets: [] as ActionTarget[],
      friendlyFirePositions: [] as FireTarget[],
    };

    if (state.phase !== "ACTION_PHASE" || !selectedActorId || state.actionPoints <= 0) return result;

    const selectedPiece = findPieceById(selectedActorId);
    if (!selectedPiece) return result;

    const selectedGlobal = localToGlobal(selectedPiece.tileId, selectedPiece.x, selectedPiece.y);
    const adjacentCoords = getAdjacentGlobalCoordinates(selectedGlobal.globalX, selectedGlobal.globalY);
    const allPieces = getAllPieces();
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
          result.friendlyTargets.push({
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
      if (mother && hasLineOfSight(state.tiles, state.scientists, selectedPiece, mother)) {
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
  })();

  // Build highlights map
  const highlights: SpaceHighlights<GameAction> = (() => {
    const h = new Map<SpaceId, SpaceHighlight<GameAction>>();

    const set = (spaceId: SpaceId, style: HighlightStyle, action?: GameAction) => {
      if (!h.has(spaceId)) h.set(spaceId, { style, action });
    };

    // Fire tokens
    for (const fire of state.fireTokens) {
      set(createSpaceId(fire.tileId, fire.x, fire.y), "fire");
    }

    // Action phase targets
    for (const target of actionTargets.hostileTargets) {
      set(createSpaceId(target.tileId, target.x, target.y), "hostileTarget", target.action);
    }
    for (const target of actionTargets.friendlyTargets) {
      set(createSpaceId(target.tileId, target.x, target.y), "friendlyTarget", target.action);
    }
    for (const fire of actionTargets.friendlyFirePositions) {
      set(createSpaceId(fire.tileId, fire.x, fire.y), "friendlyTarget", fire.action);
    }

    // Effect phase destinations (immediate execution)
    if (state.phase === "EFFECT_PHASE" && state.effectActionsRemaining > 0) {
      const effectType = getCurrentEffectType(state);

      // Mother's Call: two-step selection - first select baby, then destination
      if (effectType === "mothers_call" && state.mother) {
        const allPieces = getAllPieces();
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
            set(createSpaceId(dest.tileId, dest.x, dest.y), "effectDestination", action);
          }
        } else {
          // Step 1: Highlight babies that can be called (have reachable destinations)
          for (const baby of state.babies) {
            if (baby.tileId === -1) continue;
            const destinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
            if (destinations.length > 0) {
              const action: GameAction = { type: "SELECT_ACTOR", player: "raptor", pieceId: baby.id };
              set(createSpaceId(baby.tileId, baby.x, baby.y), "effectTarget", action);
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
            if (isSpaceOccupied(tile.id, x, edgeY)) continue;
            const action: GameAction = { type: "PLACE_REINFORCEMENT", tileId: tile.id, x, y: edgeY };
            set(createSpaceId(tile.id, x, edgeY), "effectDestination", action);
          }
        }
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
          if (isSpaceOccupied(local.tileId, local.localX, local.localY)) continue;
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
          set(createSpaceId(local.tileId, local.localX, local.localY), "effectDestination", action);
        }
      }

      // Jeep: two-step selection - first select scientist, then destination
      if (effectType === "jeep") {
        const allPieces = getAllPieces();
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
            set(createSpaceId(dest.tileId, dest.x, dest.y), "effectDestination", action);
          }
        } else {
          // Step 1: Highlight scientists that can use jeep (have reachable destinations)
          for (const scientist of state.scientists) {
            if (scientist.tileId === -1 || scientist.isFrightened) continue;
            const destinations = getJeepDestinationsWithPaths(state.tiles, allPieces, state.fireTokens, scientist, []);
            if (destinations.length > 0) {
              const action: GameAction = { type: "SELECT_ACTOR", player: "scientist", pieceId: scientist.id };
              set(createSpaceId(scientist.tileId, scientist.x, scientist.y), "effectTarget", action);
            }
          }
        }
      }
    }

    // Valid moves (action phase)
    if (activePiece && selectedActorId) {
      for (const move of validMoves) {
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
        set(createSpaceId(move.tileId, move.x, move.y), "validMove", action);
      }
    }

    // Setup placements
    for (const space of setupPlacementSpaces) {
      let action: GameAction | undefined;
      if (state.phase === "RAPTOR_SETUP") {
        action = !isMotherPlaced(state)
          ? { type: "PLACE_MOTHER", tileId: space.tileId, x: space.x, y: space.y }
          : { type: "PLACE_BABY", tileId: space.tileId, x: space.x, y: space.y };
      } else if (state.phase === "SCIENTIST_SETUP") {
        action = { type: "PLACE_SCIENTIST", tileId: space.tileId, x: space.x, y: space.y };
      }
      set(createSpaceId(space.tileId, space.x, space.y), "setupPlacement", action);
    }

    // Setup move targets
    if (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") {
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
            if (isSpaceOccupied(tile.id, space.coordinate.x, space.coordinate.y)) continue;
            const action: GameAction = {
              type: "MOVE_PIECE_ON_TILE",
              pieceId: pieceOnTile.id,
              tileId: tile.id,
              x: space.coordinate.x,
              y: space.coordinate.y,
            };
            set(space.id, "setupMoveTarget", action);
          }
        }
      }
    }

    // Mother return destinations
    if (state.phase === "MOTHER_RETURN") {
      for (const tile of state.tiles) {
        for (const space of tile.spaces) {
          if (space.hasMountain || space.isUnusable || space.isExit) continue;
          if (isSpaceOccupied(tile.id, space.coordinate.x, space.coordinate.y)) continue;
          const action: GameAction = {
            type: "MOTHER_RETURN",
            tileId: tile.id,
            x: space.coordinate.x,
            y: space.coordinate.y,
          };
          set(space.id, "effectDestination", action);
        }
      }
    }

    return h;
  })();

  return (
    <div className="board-container">
      <LayoutGroup>
        <div className="Board">
          {state.tiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              highlights={highlights}
              isValidSetupTile={validSetupTileIds.has(tile.id)}
              showCoordinates={state.showCoordinates}
              onSpaceClick={handleSpaceClick}
            />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default Board;
