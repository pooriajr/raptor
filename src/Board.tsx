import "./Board.css";
import Tile from "./Tile.tsx";
import { useState, useEffect, useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import type { PieceState } from "./types/gameState.ts";
import {
  createSpaceId,
  type SpaceId,
  type SpaceHighlights,
  type SpaceHighlight,
  type HighlightStyle,
} from "./types/board.ts";
import type { GameAction } from "./state/gameReducer.ts";
import { getPieceEmoji, isMotherPlaced } from "./utils/pieceUtils.ts";
import { MotherRaptor } from "./pieces/MotherRaptor.ts";
import { BabyRaptor } from "./pieces/BabyRaptor.ts";
import { Scientist } from "./pieces/Scientist.ts";

import {
  canBabyReachMotherTile,
  getReachableDestinationsOnMotherTileWithPaths,
  getJeepDestinationsWithPaths,
  type PathResult,
} from "./utils/pathfinding.ts";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "./types/coordinates.ts";
import { getCurrentEffectType, getEffectLimit } from "./utils/effectUtils.ts";

// Type for pending jeep moves
interface PendingJeepMove {
  scientistId: string;
  fromTileId: number;
  fromX: number;
  fromY: number;
  toTileId: number;
  toX: number;
  toY: number;
  path: Array<{ tileId: number; x: number; y: number }>;
}

// Get a scientist's effective position considering pending jeep moves
function getScientistEffectivePosition(
  scientist: PieceState,
  pendingMoves: PendingJeepMove[],
): { tileId: number; x: number; y: number } {
  const movesForThis = pendingMoves.filter((m) => m.scientistId === scientist.id);
  if (movesForThis.length > 0) {
    const last = movesForThis[movesForThis.length - 1];
    return { tileId: last.toTileId, x: last.toX, y: last.toY };
  }
  return { tileId: scientist.tileId, x: scientist.x, y: scientist.y };
}

// Helper to check if a scientist has line of sight to the mother for shooting
// LOS is blocked by: Rocks, Active (standing) scientists
// Can shoot through: Frightened scientists, fire tokens, baby raptors
function hasLineOfSight(
  tiles: import("./types/board.ts").Tile[],
  scientists: PieceState[],
  scientist: PieceState,
  mother: PieceState,
): boolean {
  const sciGlobal = localToGlobal(scientist.tileId, scientist.x, scientist.y);
  const motherGlobal = localToGlobal(mother.tileId, mother.x, mother.y);

  // Must be in same row or column (orthogonal)
  const sameRow = sciGlobal.globalY === motherGlobal.globalY;
  const sameCol = sciGlobal.globalX === motherGlobal.globalX;
  if (!sameRow && !sameCol) return false;

  // Can't shoot at same position
  if (sameRow && sameCol) return false;

  // Check each space between scientist and mother
  if (sameRow) {
    const minX = Math.min(sciGlobal.globalX, motherGlobal.globalX);
    const maxX = Math.max(sciGlobal.globalX, motherGlobal.globalX);
    for (let x = minX + 1; x < maxX; x++) {
      for (const tile of tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
          if (spaceGlobal.globalX === x && spaceGlobal.globalY === sciGlobal.globalY) {
            // Check for mountain
            if (space.hasMountain) return false;

            // Check for standing (non-frightened) scientist
            const pieceHere = scientists.find(
              (s) => s.tileId === tile.id && s.x === space.coordinate.x && s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) {
              return false;
            }
          }
        }
      }
    }
  } else {
    // sameCol
    const minY = Math.min(sciGlobal.globalY, motherGlobal.globalY);
    const maxY = Math.max(sciGlobal.globalY, motherGlobal.globalY);
    for (let y = minY + 1; y < maxY; y++) {
      for (const tile of tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
          if (spaceGlobal.globalX === sciGlobal.globalX && spaceGlobal.globalY === y) {
            // Check for mountain
            if (space.hasMountain) return false;

            // Check for standing (non-frightened) scientist
            const pieceHere = scientists.find(
              (s) => s.tileId === tile.id && s.x === space.coordinate.x && s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) {
              return false;
            }
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

// Adapter to make PieceState compatible with components expecting Piece interface
function adaptPieceForRender(piece: PieceState) {
  return {
    id: piece.id,
    type: piece.type,
    tileId: piece.tileId,
    localX: piece.x,
    localY: piece.y,
    getEmoji: () => getPieceEmoji(piece.type),
    isAsleep: piece.isAsleep,
    isFrightened: piece.isFrightened,
  };
}

function Board() {
  const { state, dispatch } = useGame();

  // Helper to get current player based on phase
  const getCurrentPlayer = (): "raptor" | "scientist" | null => {
    if (state.phase === "RAPTOR_CARD_SELECTION" || state.phase === "RAPTOR_SETUP") return "raptor";
    if (state.phase === "SCIENTIST_CARD_SELECTION" || state.phase === "SCIENTIST_SETUP") return "scientist";
    if (state.phase === "EFFECT_PHASE") {
      // Inline logic from getEffectPlayer to avoid forward reference
      const scientistCard = state.scientistCards.played;
      const raptorCard = state.raptorCards.played;
      if (scientistCard === null || raptorCard === null) return null;
      return raptorCard < scientistCard ? "raptor" : "scientist";
    }
    if (state.phase === "ACTION_PHASE") return state.activePlayer;
    return null;
  };

  // Get interaction state for current player (or raptor as fallback)
  const currentPlayer = getCurrentPlayer();
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;

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

  // Read effect phase state from context
  const selectedEffectTargets = interaction.selectedEffectTargets;
  const selectedBabyForCall = interaction.selectedBabyForCall;
  const pendingMothersCallMoves = interaction.pendingMothersCallMoves;
  const pendingReinforcementPlacements = interaction.pendingReinforcementPlacements;
  const pendingFirePlacements = interaction.pendingFirePlacements;
  const selectedScientistForJeep = interaction.selectedScientistForJeep;
  const pendingJeepMoves = interaction.pendingJeepMoves;

  // Cache the path results for the currently selected baby (local state - computed, not persisted)
  const [selectedBabyPathResults, setSelectedBabyPathResults] = useState<PathResult[]>([]);
  // Cache jeep destinations for the currently selected scientist (local state - computed, not persisted)
  const [selectedScientistJeepDestinations, setSelectedScientistJeepDestinations] = useState<
    Array<{
      tileId: number;
      x: number;
      y: number;
      path: Array<{ tileId: number; x: number; y: number }>;
    }>
  >([]);

  // Read action phase state from context
  const selectedActionPieceId = interaction.selectedActionPieceId;
  const actionPhaseSavedState = state.actionPhaseSavedState;

  // Helper to get all pieces as a single array
  const getAllPieces = (): PieceState[] => {
    const pieces: PieceState[] = [];
    if (state.mother) {
      pieces.push(state.mother);
    }
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

  // Reset effect targets when leaving effect phase
  useEffect(() => {
    if (state.phase !== "EFFECT_PHASE") {
      // Reset both players' interaction state when leaving effect phase
      dispatch({ type: "RESET_ALL_INTERACTIONS" });
      setSelectedBabyPathResults([]);
      setSelectedScientistJeepDestinations([]);
    }
  }, [state.phase, dispatch]);

  // Save state when entering action phase, reset when leaving
  useEffect(() => {
    if (state.phase === "ACTION_PHASE") {
      // Save state on first entry (when savedState is null)
      if (actionPhaseSavedState === null) {
        dispatch({
          type: "SAVE_ACTION_PHASE_STATE",
          savedState: {
            mother: { ...state.mother },
            babies: state.babies.map((b) => ({ ...b })),
            scientists: state.scientists.map((s) => ({ ...s })),
            fireTokens: state.fireTokens.map((f) => ({ ...f })),
            actionPoints: state.actionPoints,
          },
        });
      }
    } else {
      // Reset when leaving action phase
      if (currentPlayer) {
        dispatch({ type: "SELECT_ACTION_PIECE", player: currentPlayer, pieceId: null });
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
        // Disappearance: auto-dispatch since no choices needed
        if (raptorHasEffect && (raptorCard === 2 || raptorCard === 6)) {
          dispatch({ type: "DISAPPEARANCE" });
        }
      }
    }
  }, [state.phase, state.scientistCards.played, state.raptorCards.played, dispatch]);

  // Auto-dispatch round end - processes cards and transitions to next round
  useEffect(() => {
    if (state.phase === "ROUND_END") {
      dispatch({ type: "END_ROUND" });
    }
  }, [state.phase, dispatch]);

  // Handle piece interactions - returns true if the interaction was handled
  const handlePieceInteraction = (pieceId: string): boolean => {
    // Handle effect phase targeting
    if (state.phase === "EFFECT_PHASE") {
      const effectType = getCurrentEffectType(state);
      const piece = findPieceById(pieceId);
      const player = currentPlayer;
      if (!piece || !player) return false;

      // Helper to toggle effect target with limit handling
      const toggleEffectTarget = (targetId: string) => {
        const current = selectedEffectTargets;
        if (current.includes(targetId)) {
          // Remove from selection
          dispatch({
            type: "SET_EFFECT_TARGETS",
            player,
            pieceIds: current.filter((id) => id !== targetId),
          });
        } else {
          const limit = getEffectLimit(state);
          if (current.length >= limit) {
            // At limit - replace oldest with new
            dispatch({
              type: "SET_EFFECT_TARGETS",
              player,
              pieceIds: [...current.slice(1), targetId],
            });
          } else {
            // Add to selection
            dispatch({
              type: "SET_EFFECT_TARGETS",
              player,
              pieceIds: [...current, targetId],
            });
          }
        }
      };

      if (effectType === "fear") {
        // Fear: select scientists to frighten
        if (piece.type !== "scientist" || piece.isFrightened) return false;
        toggleEffectTarget(pieceId);
        return true;
      } else if (effectType === "sleeping_gas") {
        // Sleeping Gas: select babies to put to sleep
        if (piece.type !== "baby" || piece.isAsleep) return false;
        toggleEffectTarget(pieceId);
        return true;
      } else if (effectType === "recovery") {
        // Recovery: select sleeping babies to wake up
        if (piece.type !== "baby" || !piece.isAsleep) return false;
        toggleEffectTarget(pieceId);
        return true;
      } else if (effectType === "mothers_call") {
        // Mother's Call: two-step selection per baby
        // Step 1: Select a baby that can reach mother's tile
        // Step 2: Select destination on mother's tile
        // Repeat for additional babies (if limit allows)
        const mother = state.mother;
        if (!mother) return false;

        if (piece.type === "baby") {
          // Check if this baby already has a pending move
          const hasPendingMove = pendingMothersCallMoves.some((m) => m.babyId === pieceId);

          if (hasPendingMove) {
            // Remove the pending move (undo) - need to filter and set new array
            const newMoves = pendingMothersCallMoves.filter((m) => m.babyId !== pieceId);
            dispatch({ type: "CLEAR_MOTHERS_CALL_MOVES", player });
            newMoves.forEach((move) => dispatch({ type: "ADD_MOTHERS_CALL_MOVE", player, move }));
            return true;
          }

          // If clicking the currently selected baby, deselect it
          if (pieceId === selectedBabyForCall) {
            dispatch({ type: "SELECT_BABY_FOR_CALL", player, babyId: null });
            setSelectedBabyPathResults([]);
            return true;
          }

          // Check if we're at the limit
          const limit = getEffectLimit(state);
          if (pendingMothersCallMoves.length >= limit) return false;

          // Check if baby can reach mother's tile and get paths
          const pathResults = getReachableDestinationsOnMotherTileWithPaths(state.tiles, getAllPieces(), piece, mother);

          // Filter out destinations that are already pending from other babies
          const availablePathResults = pathResults.filter(
            (pr) =>
              !pendingMothersCallMoves.some(
                (m) =>
                  m.destinationTileId === pr.position.tileId &&
                  m.destinationX === pr.position.x &&
                  m.destinationY === pr.position.y,
              ),
          );

          if (availablePathResults.length === 0) return false;

          // Select this baby and cache its path results
          dispatch({ type: "SELECT_BABY_FOR_CALL", player, babyId: pieceId });
          setSelectedBabyPathResults(availablePathResults);
          return true;
        }
        return false;
      } else if (effectType === "jeep") {
        // Jeep: two-step selection per move
        // Step 1: Select a scientist
        // Step 2: Select destination (straight line)
        // Repeat for additional moves (if limit allows)
        // Same scientist can move multiple times

        if (piece.type === "scientist") {
          // If clicking the currently selected scientist, deselect it
          if (pieceId === selectedScientistForJeep) {
            dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player, scientistId: null });
            setSelectedScientistJeepDestinations([]);
            return true;
          }

          // Check if we're at the limit - can't add more moves
          const limit = getEffectLimit(state);
          if (pendingJeepMoves.length >= limit) return false;

          // Get the scientist's effective position (considering pending moves)
          const currentPos = getScientistEffectivePosition(piece, pendingJeepMoves);

          // Create a temporary piece state for pathfinding
          const tempPiece = {
            ...piece,
            tileId: currentPos.tileId,
            x: currentPos.x,
            y: currentPos.y,
          };

          // Get jeep destinations with paths
          const destinations = getJeepDestinationsWithPaths(
            state.tiles,
            getAllPieces(),
            state.fireTokens,
            tempPiece,
            pendingJeepMoves,
          );

          // Filter out destinations that are already occupied by FINAL pending moves
          // (intermediate stops are not occupied - the scientist moved on from there)
          const availableDestinations = destinations.filter((d) => {
            // Check if any scientist's FINAL position is at this destination
            const isFinalDestination = pendingJeepMoves.some((m) => {
              // Is this move's destination at d?
              if (m.toTileId !== d.tileId || m.toX !== d.x || m.toY !== d.y) {
                return false;
              }
              // Check if there's a subsequent move starting from this position
              const hasSubsequentMove = pendingJeepMoves.some(
                (m2) =>
                  m2.scientistId === m.scientistId &&
                  m2.fromTileId === m.toTileId &&
                  m2.fromX === m.toX &&
                  m2.fromY === m.toY,
              );
              // Only block if this is the final destination (no subsequent move)
              return !hasSubsequentMove;
            });
            return !isFinalDestination;
          });

          if (availableDestinations.length === 0) return false;

          // Select this scientist and cache its destinations
          dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player, scientistId: pieceId });
          setSelectedScientistJeepDestinations(availableDestinations);
          return true;
        }
        return false;
      }
      return false;
    }

    // Handle action phase piece selection and target interactions
    if (state.phase === "ACTION_PHASE") {
      const piece = findPieceById(pieceId);
      if (!piece) return false;

      // Check if clicking on an action target (adjacent piece that can be acted upon)
      if (selectedActionPieceId && state.actionPoints > 0) {
        const selectedPiece = findPieceById(selectedActionPieceId);
        if (selectedPiece) {
          // Check if this is a valid target for the selected piece
          const selectedGlobal = localToGlobal(selectedPiece.tileId, selectedPiece.x, selectedPiece.y);
          const targetGlobal = localToGlobal(piece.tileId, piece.x, piece.y);
          const adjacentCoords = getAdjacentGlobalCoordinates(selectedGlobal.globalX, selectedGlobal.globalY);
          const isAdjacent = adjacentCoords.some(
            (adj) => adj.globalX === targetGlobal.globalX && adj.globalY === targetGlobal.globalY,
          );

          if (isAdjacent) {
            // Mother actions
            if (selectedPiece.type === "mother" && state.activePlayer === "raptor") {
              if (piece.type === "scientist") {
                dispatch({
                  type: "ACTION_MOTHER_KILL_SCIENTIST",
                  targetId: pieceId,
                });
                return true;
              } else if (piece.type === "baby" && piece.isAsleep) {
                dispatch({
                  type: "ACTION_MOTHER_WAKE_BABY",
                  targetId: pieceId,
                });
                return true;
              }
            }
            // Scientist actions (adjacent)
            if (
              selectedPiece.type === "scientist" &&
              state.activePlayer === "scientist" &&
              !selectedPiece.isFrightened
            ) {
              if (piece.type === "baby") {
                if (piece.isAsleep) {
                  dispatch({
                    type: "ACTION_SCIENTIST_CAPTURE_BABY",
                    scientistId: selectedActionPieceId,
                    targetId: pieceId,
                  });
                } else {
                  dispatch({
                    type: "ACTION_SCIENTIST_SLEEP_BABY",
                    scientistId: selectedActionPieceId,
                    targetId: pieceId,
                  });
                }
                return true;
              }
            }
          }

          // Scientist shooting mother (not adjacent, but has line of sight)
          if (
            selectedPiece.type === "scientist" &&
            state.activePlayer === "scientist" &&
            !selectedPiece.isFrightened &&
            !state.aggressiveActionsUsed.includes(selectedPiece.id) &&
            piece.type === "mother"
          ) {
            if (hasLineOfSight(state.tiles, state.scientists, selectedPiece, piece)) {
              dispatch({
                type: "ACTION_SCIENTIST_SHOOT_MOTHER",
                scientistId: selectedActionPieceId,
              });
              return true;
            }
          }
        }
      }

      // Check if this piece can be controlled by the active player
      const canControl =
        (state.activePlayer === "raptor" && (piece.type === "baby" || piece.type === "mother")) ||
        (state.activePlayer === "scientist" && piece.type === "scientist");

      if (!canControl) return false;

      // Check if piece can move (not asleep/frightened)
      if (piece.type === "baby" && piece.isAsleep) return false;

      // Frightened scientist clicking themselves to stand up
      // (can't stand up if frightened this round)
      if (piece.type === "scientist" && piece.isFrightened) {
        if (state.actionPoints > 0 && !state.frightenedThisRound.includes(pieceId)) {
          // Stand up and select
          dispatch({
            type: "ACTION_SCIENTIST_STAND_UP",
            scientistId: pieceId,
          });
          if (currentPlayer) {
            dispatch({ type: "SELECT_ACTION_PIECE", player: currentPlayer, pieceId });
          }
        }
        return true;
      }

      // Toggle selection or switch to new piece
      if (currentPlayer) {
        if (selectedActionPieceId === pieceId) {
          dispatch({ type: "SELECT_ACTION_PIECE", player: currentPlayer, pieceId: null });
        } else {
          dispatch({ type: "SELECT_ACTION_PIECE", player: currentPlayer, pieceId });
        }
      }
      return true;
    }

    return false;
  };

  // Unified space click handler - handles all interactions on a tile space
  const handleSpaceClick = (tileId: number, x: number, y: number, pieceId: string | null) => {
    // Handle setup phase clicks
    if (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") {
      // If clicking on a placed piece during setup, remove it (only if it's the right type for this phase)
      if (pieceId) {
        const isRaptorPiece = pieceId === "mother" || pieceId.startsWith("baby-");
        const isScientistPiece = pieceId.startsWith("scientist-");

        // Only allow removing raptors during raptor setup, scientists during scientist setup
        if (
          (state.phase === "RAPTOR_SETUP" && isRaptorPiece) ||
          (state.phase === "SCIENTIST_SETUP" && isScientistPiece)
        ) {
          dispatch({ type: "REMOVE_PIECE", pieceId });
          return;
        }
        // Clicking on wrong piece type - ignore
        return;
      }

      // Check if there's already a piece on this tile that can be moved
      // (clicking empty space on same tile moves the piece there)
      const pieceOnTile = (() => {
        if (state.phase === "RAPTOR_SETUP") {
          // Check for mother on this tile
          if (state.mother?.tileId === tileId) {
            return state.mother;
          }
          // Check for baby on this tile
          return state.babies.find((b) => b.tileId === tileId);
        } else {
          // Scientist setup - check for scientist on this tile
          return state.scientists.find((s) => s.tileId === tileId);
        }
      })();

      if (pieceOnTile) {
        // Check if clicked space is valid (not mountain, not exit for scientists, etc.)
        const tile = state.tiles.find((t) => t.id === tileId);
        const space = tile?.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
        if (space && !space.hasMountain && !space.isUnusable) {
          // For scientists, can't move to exit spaces
          if (state.phase === "SCIENTIST_SETUP" && space.isExit) return;

          dispatch({ type: "MOVE_PIECE_ON_TILE", pieceId: pieceOnTile.id, tileId, x, y });
          return;
        }
        return;
      }

      // Check if this is a valid placement space
      const isValidPlacement = setupPlacementSpaces.some((s) => s.tileId === tileId && s.x === x && s.y === y);

      if (!isValidPlacement) return;

      // Place the appropriate piece based on phase and state
      if (state.phase === "RAPTOR_SETUP") {
        if (!isMotherPlaced(state)) {
          dispatch({ type: "PLACE_MOTHER", tileId, x, y });
        } else {
          dispatch({ type: "PLACE_BABY", tileId, x, y });
        }
      } else if (state.phase === "SCIENTIST_SETUP") {
        dispatch({ type: "PLACE_SCIENTIST", tileId, x, y });
      }
      return;
    }

    // If there's a piece on this space, handle piece-related interactions first
    if (pieceId) {
      const handled = handlePieceInteraction(pieceId);
      if (handled) return;
    }

    // Handle mother return phase - clicking to place mother back on board
    if (state.phase === "MOTHER_RETURN") {
      // Don't allow clicking on occupied spaces
      if (pieceId) return;

      // Validate the space is valid for mother placement
      const tile = state.tiles.find((t) => t.id === tileId);
      const space = tile?.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
      if (!space || space.hasMountain || space.isUnusable || space.isExit) return;

      dispatch({ type: "MOTHER_RETURN", tileId, x, y });
      return;
    }

    // Handle action phase movement and fire extinguishing
    if (state.phase === "ACTION_PHASE") {
      if (!selectedActionPieceId || state.actionPoints <= 0) return;

      const piece = findPieceById(selectedActionPieceId);
      if (!piece) return;

      // Check if clicking on an adjacent fire (mother extinguishing)
      if (piece.type === "mother" && state.activePlayer === "raptor") {
        const isAdjacentFire = actionTargets.friendlyFirePositions.some(
          (f) => f.tileId === tileId && f.x === x && f.y === y,
        );
        if (isAdjacentFire) {
          dispatch({
            type: "ACTION_MOTHER_EXTINGUISH_FIRE",
            tileId,
            x,
            y,
          });
          return;
        }
      }

      // Dispatch the appropriate move action
      if (piece.type === "baby") {
        dispatch({
          type: "ACTION_MOVE_BABY",
          pieceId: selectedActionPieceId,
          tileId,
          x,
          y,
        });
        // Keep piece selected for chaining (selection persists)
      } else if (piece.type === "scientist") {
        dispatch({
          type: "ACTION_MOVE_SCIENTIST",
          pieceId: selectedActionPieceId,
          tileId,
          x,
          y,
        });
        // Keep piece selected for chaining (selection persists)
      } else if (piece.type === "mother") {
        dispatch({
          type: "ACTION_MOVE_MOTHER",
          pieceId: selectedActionPieceId,
          tileId,
          x,
          y,
        });
        // Keep piece selected for chaining (selection persists)
      }
      return;
    }

    if (state.phase !== "EFFECT_PHASE") return;

    const effectType = getCurrentEffectType(state);
    const player = currentPlayer;
    if (!player) return;

    if (effectType === "mothers_call") {
      if (selectedBabyForCall === null) return;

      // Find the path for this destination from cached results
      const pathResult = selectedBabyPathResults.find(
        (pr) => pr.position.tileId === tileId && pr.position.x === x && pr.position.y === y,
      );

      // Add to pending moves with path
      dispatch({
        type: "ADD_MOTHERS_CALL_MOVE",
        player,
        move: {
          babyId: selectedBabyForCall,
          destinationTileId: tileId,
          destinationX: x,
          destinationY: y,
          path: pathResult?.path ?? [],
        },
      });
      dispatch({ type: "SELECT_BABY_FOR_CALL", player, babyId: null });
      setSelectedBabyPathResults([]);
    } else if (effectType === "reinforcements") {
      // Check if already selected (toggle off)
      const alreadySelected = pendingReinforcementPlacements.some((p) => p.tileId === tileId && p.x === x && p.y === y);

      if (alreadySelected) {
        // Remove from pending - need to clear and re-add filtered list
        dispatch({ type: "CLEAR_REINFORCEMENTS", player });
        pendingReinforcementPlacements
          .filter((p) => !(p.tileId === tileId && p.x === x && p.y === y))
          .forEach((p) =>
            dispatch({ type: "ADD_REINFORCEMENT", player, placement: { tileId: p.tileId, x: p.x, y: p.y } }),
          );
      } else {
        const limit = getEffectLimit(state);
        const atLimit = pendingReinforcementPlacements.length >= limit;

        if (atLimit) {
          // At limit - remove oldest and add new
          dispatch({ type: "CLEAR_REINFORCEMENTS", player });
          [...pendingReinforcementPlacements.slice(1), { tileId, x, y }].forEach((p) =>
            dispatch({ type: "ADD_REINFORCEMENT", player, placement: { tileId: p.tileId, x: p.x, y: p.y } }),
          );
        } else {
          // New placement
          dispatch({ type: "ADD_REINFORCEMENT", player, placement: { tileId, x, y } });
        }
      }
    } else if (effectType === "fire") {
      // Fire placement: no undo, no replace - just add until limit
      const limit = getEffectLimit(state);
      if (pendingFirePlacements.length >= limit) {
        // At limit - do nothing, user must use Reset button
        return;
      }

      // Add new fire placement
      dispatch({ type: "ADD_FIRE_PLACEMENT", player, position: { tileId, x, y } });
    } else if (effectType === "jeep") {
      // Jeep move: add move for selected scientist
      if (selectedScientistForJeep === null) return;

      // Find the destination with path from cached results
      const destination = selectedScientistJeepDestinations.find((d) => d.tileId === tileId && d.x === x && d.y === y);
      if (!destination) return;

      // Get the scientist's effective position (start of this move)
      const scientist = findPieceById(selectedScientistForJeep);
      if (!scientist) return;

      const fromPos = getScientistEffectivePosition(scientist, pendingJeepMoves);

      // Add the move
      dispatch({
        type: "ADD_JEEP_MOVE",
        player,
        move: {
          scientistId: selectedScientistForJeep,
          fromTileId: fromPos.tileId,
          fromX: fromPos.x,
          fromY: fromPos.y,
          toTileId: tileId,
          toX: x,
          toY: y,
          path: destination.path,
        },
      });

      // Clear selection - user can select another scientist or same one again
      dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player, scientistId: null });
      setSelectedScientistJeepDestinations([]);
    }
  };

  // Get the valid moves for the currently selected piece on the board
  const activePieceId = state.phase === "ACTION_PHASE" ? selectedActionPieceId : null;
  const activePiece = activePieceId ? findPieceById(activePieceId) : null;

  // Calculate valid placement spaces for pieces from holding pen
  // Helper to check if a space is occupied by any piece
  const isSpaceOccupied = (tileId: number, x: number, y: number): boolean => {
    if (state.mother?.tileId === tileId && state.mother.x === x && state.mother.y === y) {
      return true;
    }
    if (state.babies.some((b) => b.tileId === tileId && b.x === x && b.y === y)) {
      return true;
    }
    if (state.scientists.some((s) => s.tileId === tileId && s.x === x && s.y === y)) {
      return true;
    }
    return false;
  };

  // Helper to check if a tile has any raptors
  const tileHasRaptor = (tileId: number): boolean => {
    if (state.mother?.tileId === tileId) return true;
    return state.babies.some((b) => b.tileId === tileId);
  };

  // Get valid tiles for setup placement (returns tile IDs that should be highlighted)
  const getValidSetupTiles = (): number[] => {
    if (state.phase === "RAPTOR_SETUP") {
      if (!isMotherPlaced(state)) {
        // Mother not placed - only center tiles (2, 7) are valid
        return [2, 7];
      } else {
        // Mother placed - all square tiles without a raptor are valid for babies
        const squareTiles = state.tiles.filter((t) => t.shape === "square");
        return squareTiles.filter((t) => !tileHasRaptor(t.id)).map((t) => t.id);
      }
    } else if (state.phase === "SCIENTIST_SETUP") {
      // L-tiles without a scientist are valid
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      const tilesWithScientist = new Set(state.scientists.map((s) => s.tileId));
      return lTiles.filter((t) => !tilesWithScientist.has(t.id)).map((t) => t.id);
    }
    return [];
  };

  // Get valid spaces for setup placement on a specific tile
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

  // Calculate all valid placement spaces during setup
  const setupPlacementSpaces: Array<{ tileId: number; x: number; y: number }> = (() => {
    if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
      return [];
    }

    const validTiles = getValidSetupTiles();
    const spaces: Array<{ tileId: number; x: number; y: number }> = [];

    for (const tileId of validTiles) {
      const tileSpaces = getValidSetupSpaces(tileId);
      for (const { x, y } of tileSpaces) {
        spaces.push({ tileId, x, y });
      }
    }

    return spaces;
  })();

  // Get the set of valid tile IDs for setup (for tile highlighting)
  const validSetupTileIds = new Set(getValidSetupTiles());

  // Calculate valid moves for action phase
  const validMoves = activePiece
    ? (() => {
        // No valid moves if no action points during action phase
        if (state.phase === "ACTION_PHASE" && state.actionPoints <= 0) {
          return [];
        }

        // Mother must pay wound cost (= sleep tokens) before first movement
        if (state.phase === "ACTION_PHASE" && activePiece.type === "mother") {
          const woundCost = state.motherPaidWoundCost ? 0 : state.motherSleepTokens;
          const totalCost = woundCost + 1; // wound cost + 1 for the move
          if (state.actionPoints < totalCost) {
            return [];
          }
        }

        const allPieces = getAllPieces();
        const pieceInstance = createPieceFromState(activePiece);
        return pieceInstance.getValidMoves(state.tiles, allPieces, state.fireTokens).filter((move) => {
          const targetTile = state.tiles.find((t) => t.id === move.tileId);
          if (!targetTile) return false;

          const targetSpace = targetTile.spaces.find((s) => s.coordinate.x === move.x && s.coordinate.y === move.y);
          if (!targetSpace) return false;

          if (targetSpace.hasMountain) return false;

          const isOccupied = allPieces.some(
            (p) => p.id !== activePieceId && p.tileId === move.tileId && p.x === move.x && p.y === move.y,
          );
          if (isOccupied) return false;

          // Check for fire at destination
          const hasFire = state.fireTokens.some((f) => f.tileId === move.tileId && f.x === move.x && f.y === move.y);
          if (hasFire) {
            // Raptors cannot move onto fire at all
            // Scientists can pass through fire but cannot end on it
            // (for now, both block since this is the final destination)
            return false;
          }

          return true;
        });
      })()
    : [];

  // Calculate adjacent action targets during action phase
  // Returns { hostileTargets: string[], friendlyTargets: string[], friendlyFirePositions: {tileId, x, y}[] }
  // Action targets with their associated actions
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

    if (state.phase !== "ACTION_PHASE" || !selectedActionPieceId || state.actionPoints <= 0) {
      return result;
    }

    const selectedPiece = findPieceById(selectedActionPieceId);
    if (!selectedPiece) return result;

    // Get global coordinates for selected piece
    const selectedGlobal = localToGlobal(selectedPiece.tileId, selectedPiece.x, selectedPiece.y);
    const adjacentCoords = getAdjacentGlobalCoordinates(selectedGlobal.globalX, selectedGlobal.globalY);

    // Find adjacent pieces
    const allPieces = getAllPieces();
    const adjacentPieces = allPieces.filter((p) => {
      if (p.id === selectedActionPieceId) return false;
      const pGlobal = localToGlobal(p.tileId, p.x, p.y);
      return adjacentCoords.some((adj) => adj.globalX === pGlobal.globalX && adj.globalY === pGlobal.globalY);
    });

    if (selectedPiece.type === "mother" && state.activePlayer === "raptor") {
      // Mother can kill adjacent scientists (hostile) or wake adjacent sleeping babies (friendly)
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

      // Mother can also extinguish adjacent fires (friendly action)
      for (const fire of state.fireTokens) {
        const fireGlobal = localToGlobal(fire.tileId, fire.x, fire.y);
        const isAdjacent = adjacentCoords.some(
          (adj) => adj.globalX === fireGlobal.globalX && adj.globalY === fireGlobal.globalY,
        );
        if (isAdjacent) {
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
      // Scientist can put adjacent awake babies to sleep or capture adjacent sleeping babies (both hostile)
      // But only if they haven't used their aggressive action this round
      for (const adj of adjacentPieces) {
        if (adj.type === "baby") {
          const action: GameAction = adj.isAsleep
            ? { type: "ACTION_SCIENTIST_CAPTURE_BABY", scientistId: selectedActionPieceId, targetId: adj.id }
            : { type: "ACTION_SCIENTIST_SLEEP_BABY", scientistId: selectedActionPieceId, targetId: adj.id };
          result.hostileTargets.push({
            pieceId: adj.id,
            tileId: adj.tileId,
            x: adj.x,
            y: adj.y,
            action,
          });
        }
      }

      // Scientist can also shoot the mother if they have line of sight
      const mother = state.mother;
      if (mother && hasLineOfSight(state.tiles, state.scientists, selectedPiece, mother)) {
        result.hostileTargets.push({
          pieceId: mother.id,
          tileId: mother.tileId,
          x: mother.x,
          y: mother.y,
          action: { type: "ACTION_SCIENTIST_SHOOT_MOTHER", scientistId: selectedActionPieceId },
        });
      }
    }

    return result;
  })();

  // Adapt pieces for Tile component
  const adaptedPieces = getAllPieces().map(adaptPieceForRender);

  // Calculate valid effect targets during effect phase
  const effectTargetIds: string[] = (() => {
    if (state.phase !== "EFFECT_PHASE") return [];

    const effectType = getCurrentEffectType(state);

    if (effectType === "fear") {
      return state.scientists.filter((s) => !s.isFrightened).map((s) => s.id);
    } else if (effectType === "sleeping_gas") {
      return state.babies.filter((b) => !b.isAsleep).map((b) => b.id);
    } else if (effectType === "recovery") {
      return state.babies.filter((b) => b.isAsleep).map((b) => b.id);
    } else if (effectType === "mothers_call") {
      const mother = state.mother;
      if (!mother) return [];

      // Get IDs of babies that already have pending moves
      const pendingBabyIds = pendingMothersCallMoves.map((m) => m.babyId);

      // Show babies that can reach mother and don't already have pending moves
      // (unless we're at the limit)
      const limit = getEffectLimit(state);
      if (pendingMothersCallMoves.length >= limit && !selectedBabyForCall) {
        return [];
      }

      return state.babies
        .filter((b) => !pendingBabyIds.includes(b.id) && canBabyReachMotherTile(state.tiles, getAllPieces(), b, mother))
        .map((b) => b.id);
    } else if (effectType === "jeep") {
      // Show all scientists as selectable (they can move multiple times)
      const limit = getEffectLimit(state);
      if (pendingJeepMoves.length >= limit && !selectedScientistForJeep) {
        return [];
      }

      return state.scientists.filter((s) => !s.isFrightened).map((s) => s.id);
    }

    return [];
  })();

  // Calculate valid destination spaces for Reinforcements (long edges of square tiles)
  const reinforcementDestinations: Array<{
    tileId: number;
    x: number;
    y: number;
  }> = (() => {
    if (state.phase !== "EFFECT_PHASE") return [];
    if (getCurrentEffectType(state) !== "reinforcements") return [];
    if (state.scientistReserve <= 0) return [];

    const destinations: Array<{ tileId: number; x: number; y: number }> = [];

    // Top row squares (1, 2, 3) have long edge at y=0
    // Bottom row squares (6, 7, 8) have long edge at y=2
    const topRowTiles = [1, 2, 3];
    const bottomRowTiles = [6, 7, 8];

    for (const tile of state.tiles) {
      if (tile.shape !== "square") continue;

      const isTopRow = topRowTiles.includes(tile.id);
      const isBottomRow = bottomRowTiles.includes(tile.id);
      if (!isTopRow && !isBottomRow) continue;

      const edgeY = isTopRow ? 0 : 2;

      // Check all 3 spaces on the long edge (x = 0, 1, 2)
      for (let x = 0; x < 3; x++) {
        const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === edgeY);
        if (!space || space.hasMountain) continue;

        // Check not occupied by a piece
        if (isSpaceOccupied(tile.id, x, edgeY)) continue;

        // Check not already in pending placements
        const isPending = pendingReinforcementPlacements.some(
          (p) => p.tileId === tile.id && p.x === x && p.y === edgeY,
        );
        if (isPending) continue;

        destinations.push({ tileId: tile.id, x, y: edgeY });
      }
    }

    return destinations;
  })();

  // Calculate valid fire placement destinations (adjacent to scientist or existing fire)
  const fireDestinations: Array<{
    tileId: number;
    x: number;
    y: number;
  }> = (() => {
    if (state.phase !== "EFFECT_PHASE") return [];
    if (getCurrentEffectType(state) !== "fire") return [];

    // Don't show destinations if already at limit
    const limit = getEffectLimit(state);
    if (pendingFirePlacements.length >= limit) return [];

    const destinations: Array<{ tileId: number; x: number; y: number }> = [];

    // Collect all global positions adjacent to scientists
    const scientistAdjacents = new Set<string>();
    for (const scientist of state.scientists) {
      const pGlobal = localToGlobal(scientist.tileId, scientist.x, scientist.y);
      for (const adj of getAdjacentGlobalCoordinates(pGlobal.globalX, pGlobal.globalY)) {
        scientistAdjacents.add(`${adj.globalX},${adj.globalY}`);
      }
    }

    // Collect all global positions adjacent to existing fire (including pending)
    const allFire = [...state.fireTokens, ...pendingFirePlacements];
    const fireAdjacents = new Set<string>();
    for (const fire of allFire) {
      const fGlobal = localToGlobal(fire.tileId, fire.x, fire.y);
      for (const adj of getAdjacentGlobalCoordinates(fGlobal.globalX, fGlobal.globalY)) {
        fireAdjacents.add(`${adj.globalX},${adj.globalY}`);
      }
    }

    // Combine adjacent positions
    const allAdjacents = new Set([...scientistAdjacents, ...fireAdjacents]);

    // Convert to local coordinates and filter valid spaces
    for (const key of allAdjacents) {
      const [gx, gy] = key.split(",").map(Number);
      const local = globalToLocal(state.tiles, gx, gy);
      if (!local) continue;

      const tile = state.tiles.find((t) => t.id === local.tileId);
      if (!tile) continue;

      const space = tile.spaces.find((s) => s.coordinate.x === local.localX && s.coordinate.y === local.localY);
      if (!space || space.hasMountain || space.isUnusable || space.isExit) continue;

      // Check no piece at this location
      if (isSpaceOccupied(local.tileId, local.localX, local.localY)) continue;

      // Check no fire already at this location (including pending)
      const hasFire = allFire.some((f) => f.tileId === local.tileId && f.x === local.localX && f.y === local.localY);
      if (hasFire) continue;

      destinations.push({
        tileId: local.tileId,
        x: local.localX,
        y: local.localY,
      });
    }

    return destinations;
  })();

  // Build highlights map - each space has at most one highlight with style and action
  const highlights: SpaceHighlights<GameAction> = (() => {
    const h = new Map<SpaceId, SpaceHighlight<GameAction>>();

    // Helper to set highlight (won't overwrite existing)
    const set = (spaceId: SpaceId, style: HighlightStyle, action?: GameAction) => {
      if (!h.has(spaceId)) {
        h.set(spaceId, { style, action });
      }
    };

    // Fire tokens (existing)
    for (const fire of state.fireTokens) {
      set(createSpaceId(fire.tileId, fire.x, fire.y), "fire");
    }

    // Pending fire
    for (const fire of pendingFirePlacements) {
      set(createSpaceId(fire.tileId, fire.x, fire.y), "pendingFire");
    }

    // Path trails (origins and intermediate positions)
    for (const move of pendingMothersCallMoves) {
      const baby = state.babies.find((b) => b.id === move.babyId);
      if (baby) {
        set(createSpaceId(baby.tileId, baby.x, baby.y), "pathTrail");
      }
      for (const pos of move.path) {
        set(createSpaceId(pos.tileId, pos.x, pos.y), "pathTrail");
      }
    }

    // Jeep origins and paths
    for (const move of pendingJeepMoves) {
      const isFirstMove = !pendingJeepMoves.some(
        (m) =>
          m.scientistId === move.scientistId &&
          m.toTileId === move.fromTileId &&
          m.toX === move.fromX &&
          m.toY === move.fromY,
      );
      if (isFirstMove) {
        set(createSpaceId(move.fromTileId, move.fromX, move.fromY), "pathTrail");
      }
      for (const pos of move.path) {
        set(createSpaceId(pos.tileId, pos.x, pos.y), "pathTrail");
      }
      const hasSubsequentMove = pendingJeepMoves.some(
        (m2) =>
          m2.scientistId === move.scientistId &&
          m2.fromTileId === move.toTileId &&
          m2.fromX === move.toX &&
          m2.fromY === move.toY,
      );
      if (hasSubsequentMove) {
        set(createSpaceId(move.toTileId, move.toX, move.toY), "pathTrail");
      }
    }

    // Pending destinations
    for (const move of pendingMothersCallMoves) {
      set(createSpaceId(move.destinationTileId, move.destinationX, move.destinationY), "pendingDestination");
    }
    for (const placement of pendingReinforcementPlacements) {
      set(createSpaceId(placement.tileId, placement.x, placement.y), "pendingDestination");
    }

    // Hostile targets (action phase)
    for (const target of actionTargets.hostileTargets) {
      set(createSpaceId(target.tileId, target.x, target.y), "hostileTarget", target.action);
    }

    // Friendly targets (action phase)
    for (const target of actionTargets.friendlyTargets) {
      set(createSpaceId(target.tileId, target.x, target.y), "friendlyTarget", target.action);
    }
    for (const fire of actionTargets.friendlyFirePositions) {
      set(createSpaceId(fire.tileId, fire.x, fire.y), "friendlyTarget", fire.action);
    }

    // Effect destinations
    // Mother's call destinations - include baby ID and path in action
    if (currentPlayer && selectedBabyForCall) {
      for (const pathResult of selectedBabyPathResults) {
        const dest = pathResult.position;
        const action: GameAction = {
          type: "ADD_MOTHERS_CALL_MOVE",
          player: currentPlayer,
          move: {
            babyId: selectedBabyForCall,
            destinationTileId: dest.tileId,
            destinationX: dest.x,
            destinationY: dest.y,
            path: pathResult.path,
          },
        };
        set(createSpaceId(dest.tileId, dest.x, dest.y), "effectDestination", action);
      }
    }
    // Reinforcement destinations - simple single action
    if (currentPlayer) {
      for (const dest of reinforcementDestinations) {
        const action: GameAction = {
          type: "ADD_REINFORCEMENT",
          player: currentPlayer,
          placement: { tileId: dest.tileId, x: dest.x, y: dest.y },
        };
        set(createSpaceId(dest.tileId, dest.x, dest.y), "effectDestination", action);
      }
      // Fire destinations - simple single action
      for (const dest of fireDestinations) {
        const action: GameAction = {
          type: "ADD_FIRE_PLACEMENT",
          player: currentPlayer,
          position: { tileId: dest.tileId, x: dest.x, y: dest.y },
        };
        set(createSpaceId(dest.tileId, dest.x, dest.y), "effectDestination", action);
      }
    }
    // Jeep destinations - include scientist ID, from position, and path in action
    if (currentPlayer && selectedScientistForJeep) {
      const scientist = findPieceById(selectedScientistForJeep);
      if (scientist) {
        const fromPos = getScientistEffectivePosition(scientist, pendingJeepMoves);
        for (const dest of selectedScientistJeepDestinations) {
          const action: GameAction = {
            type: "ADD_JEEP_MOVE",
            player: currentPlayer,
            move: {
              scientistId: selectedScientistForJeep,
              fromTileId: fromPos.tileId,
              fromX: fromPos.x,
              fromY: fromPos.y,
              toTileId: dest.tileId,
              toX: dest.x,
              toY: dest.y,
              path: dest.path,
            },
          };
          set(createSpaceId(dest.tileId, dest.x, dest.y), "effectDestination", action);
        }
      }
    }

    // Valid moves (action phase)
    if (activePiece && selectedActionPieceId) {
      for (const move of validMoves) {
        let action: GameAction | undefined;
        if (activePiece.type === "baby") {
          action = {
            type: "ACTION_MOVE_BABY",
            pieceId: selectedActionPieceId,
            tileId: move.tileId,
            x: move.x,
            y: move.y,
          };
        } else if (activePiece.type === "scientist") {
          action = {
            type: "ACTION_MOVE_SCIENTIST",
            pieceId: selectedActionPieceId,
            tileId: move.tileId,
            x: move.x,
            y: move.y,
          };
        } else if (activePiece.type === "mother") {
          action = {
            type: "ACTION_MOVE_MOTHER",
            pieceId: selectedActionPieceId,
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
        // Find piece on this tile to determine move action
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

    // Mother return destinations (after disappearance effect)
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

  // Build pending previews map
  const pendingPreviews: Map<SpaceId, { type: "baby" | "scientist" | "jeep"; id?: string | number }> = (() => {
    const previews = new Map<SpaceId, { type: "baby" | "scientist" | "jeep"; id?: string | number }>();

    // Baby previews (Mother's Call)
    for (const move of pendingMothersCallMoves) {
      previews.set(createSpaceId(move.destinationTileId, move.destinationX, move.destinationY), { type: "baby" });
    }

    // Scientist previews (Reinforcements)
    for (const placement of pendingReinforcementPlacements) {
      previews.set(createSpaceId(placement.tileId, placement.x, placement.y), {
        type: "scientist",
        id: placement.id,
      });
    }

    // Jeep previews (final destinations only)
    for (const move of pendingJeepMoves) {
      const hasSubsequentMove = pendingJeepMoves.some(
        (m2) =>
          m2.scientistId === move.scientistId &&
          m2.fromTileId === move.toTileId &&
          m2.fromX === move.toX &&
          m2.fromY === move.toY,
      );
      if (!hasSubsequentMove) {
        previews.set(createSpaceId(move.toTileId, move.toX, move.toY), { type: "jeep" });
      }
    }

    return previews;
  })();

  // Compute selected effect targets for piece highlighting
  const computedSelectedEffectTargets =
    getCurrentEffectType(state) === "mothers_call"
      ? [...pendingMothersCallMoves.map((m) => m.babyId), ...(selectedBabyForCall ? [selectedBabyForCall] : [])]
      : selectedEffectTargets;

  return (
    <div className="board-container">
      <LayoutGroup>
        <div className="Board">
          {state.tiles.map((tile) => {
            const piecesOnTile = adaptedPieces.filter((p) => p.tileId === tile.id);
            const isValidSetupTile = validSetupTileIds.has(tile.id);

            return (
              <Tile
                key={tile.id}
                tile={tile}
                pieces={piecesOnTile}
                highlights={highlights}
                isValidSetupTile={isValidSetupTile}
                effectTargetIds={effectTargetIds}
                selectedEffectTargets={computedSelectedEffectTargets}
                selectedActionPieceId={selectedActionPieceId}
                pendingPreviews={pendingPreviews}
                showCoordinates={state.showCoordinates}
                onSpaceClick={handleSpaceClick}
              />
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default Board;
