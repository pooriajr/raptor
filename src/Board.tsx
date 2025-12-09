import "./Board.css";
import Tile from "./Tile.tsx";
import PlayerArea from "./PlayerArea.tsx";
import { useState, useEffect, useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import type { PieceState } from "./types/gameState.ts";
import { getPieceEmoji, isMotherPlaced, countPlacedBabies, countPlacedScientists } from "./utils/pieceUtils.ts";
import { MotherRaptor } from "./pieces/MotherRaptor.ts";
import { BabyRaptor } from "./pieces/BabyRaptor.ts";
import { Scientist } from "./pieces/Scientist.ts";

import {
  canBabyReachMotherTile,
  getReachableDestinationsOnMotherTileWithPaths,
  getJeepDestinationsWithPaths,
  type Position,
  type PathResult,
} from "./utils/pathfinding.ts";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "./types/coordinates.ts";
import { hasSavedGame, loadGame } from "./utils/saveLoad.ts";

// Effect types for the current card
type EffectType =
  | "fear"
  | "sleeping_gas"
  | "mothers_call"
  | "disappearance"
  | "recovery"
  | "reinforcements"
  | "fire"
  | "jeep"
  | "none";

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

interface BoardProps {
  showCoordinates?: boolean;
}

function Board({ showCoordinates = false }: BoardProps) {
  const { state, dispatch } = useGame();

  const [isScientistNewDraw, setIsScientistNewDraw] = useState(false);
  const [isRaptorNewDraw, setIsRaptorNewDraw] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const scientistDeckRef = useRef<HTMLDivElement>(null);
  const raptorDeckRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef(state.phase);

  // Reset selected card when phase changes
  useEffect(() => {
    setSelectedCard(null);
  }, [state.phase]);

  // Draw cards when entering card selection phases
  useEffect(() => {
    const phaseChanged = state.phase !== prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (!phaseChanged) return;

    const isScientistSelection = state.phase === "SCIENTIST_CARD_SELECTION";
    const isRaptorSelection = state.phase === "RAPTOR_CARD_SELECTION";

    if (isScientistSelection || isRaptorSelection) {
      const player = isScientistSelection ? "scientist" : "raptor";
      const setNewDraw = isScientistSelection ? setIsScientistNewDraw : setIsRaptorNewDraw;

      dispatch({ type: "DRAW_CARDS", player });
      setNewDraw(true);
      const timeout = setTimeout(() => setNewDraw(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.phase, dispatch]);
  const [selectedEffectTargets, setSelectedEffectTargets] = useState<string[]>([]);
  // For Mother's Call: track selected baby and pending moves
  const [selectedBabyForCall, setSelectedBabyForCall] = useState<string | null>(null);
  const [pendingMothersCallMoves, setPendingMothersCallMoves] = useState<
    Array<{
      babyId: string;
      destinationTileId: number;
      destinationX: number;
      destinationY: number;
      path: Position[]; // Intermediate spaces for trail visualization
    }>
  >([]);
  // Cache the path results for the currently selected baby
  const [selectedBabyPathResults, setSelectedBabyPathResults] = useState<PathResult[]>([]);
  // For Reinforcements: track pending placements with stable IDs for animation
  const [pendingReinforcementPlacements, setPendingReinforcementPlacements] = useState<
    Array<{ id: number; tileId: number; x: number; y: number }>
  >([]);
  const [reinforcementIdCounter, setReinforcementIdCounter] = useState(0);
  // For Fire: track pending placements
  const [pendingFirePlacements, setPendingFirePlacements] = useState<Array<{ tileId: number; x: number; y: number }>>(
    [],
  );
  // For Jeep: track selected scientist and pending moves
  const [selectedScientistForJeep, setSelectedScientistForJeep] = useState<string | null>(null);
  const [pendingJeepMoves, setPendingJeepMoves] = useState<PendingJeepMove[]>([]);
  // Cache jeep destinations for the currently selected scientist
  const [selectedScientistJeepDestinations, setSelectedScientistJeepDestinations] = useState<
    Array<{
      tileId: number;
      x: number;
      y: number;
      path: Array<{ tileId: number; x: number; y: number }>;
    }>
  >([]);

  // Action phase state
  const [selectedActionPieceId, setSelectedActionPieceId] = useState<string | null>(null);
  const [actionPhaseSavedState, setActionPhaseSavedState] = useState<{
    mother: PieceState;
    babies: PieceState[];
    scientists: PieceState[];
    fireTokens: typeof state.fireTokens;
    actionPoints: number;
  } | null>(null);

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
      setSelectedEffectTargets([]);
      setSelectedBabyForCall(null);
      setPendingMothersCallMoves([]);
      setSelectedBabyPathResults([]);
      setPendingReinforcementPlacements([]);
      setReinforcementIdCounter(0);
      setPendingFirePlacements([]);
      setSelectedScientistForJeep(null);
      setPendingJeepMoves([]);
      setSelectedScientistJeepDestinations([]);
    }
  }, [state.phase]);

  // Save state when entering action phase, reset when leaving
  useEffect(() => {
    if (state.phase === "ACTION_PHASE") {
      // Save state on first entry (when savedState is null)
      if (actionPhaseSavedState === null) {
        setActionPhaseSavedState({
          mother: { ...state.mother },
          babies: state.babies.map((b) => ({ ...b })),
          scientists: state.scientists.map((s) => ({ ...s })),
          fireTokens: state.fireTokens.map((f) => ({ ...f })),
          actionPoints: state.actionPoints,
        });
      }
    } else {
      // Reset when leaving action phase
      setSelectedActionPieceId(null);
      setActionPhaseSavedState(null);
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

  // Determine the current effect type based on played cards
  const getCurrentEffectType = (): EffectType => {
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return "none";

    const raptorHasEffect = raptorCard < scientistCard;

    if (raptorHasEffect) {
      // Raptor effects: 1=Mother's Call(1), 2=Disappearance, 3=Fear(1), 4=Mother's Call(2), 5=Recovery(2), 6=Disappearance, 7=Recovery(3), 8=Fear(2)
      if (raptorCard === 1 || raptorCard === 4) return "mothers_call";
      if (raptorCard === 2 || raptorCard === 6) return "disappearance";
      if (raptorCard === 3 || raptorCard === 8) return "fear";
      if (raptorCard === 5 || raptorCard === 7) return "recovery";
      return "none";
    } else {
      // Scientist effects: 1=Sleeping Gas(1), 2=Reinforcements(1-2), 3=Jeep(2), 4=Sleeping Gas(2), 5=Fire(2), 6=Reinforcements(1-2), 7=Fire(3), 8=Jeep(4)
      if (scientistCard === 1 || scientistCard === 4) return "sleeping_gas";
      if (scientistCard === 2 || scientistCard === 6) return "reinforcements";
      if (scientistCard === 3 || scientistCard === 8) return "jeep";
      if (scientistCard === 5 || scientistCard === 7) return "fire";
      return "none";
    }
  };

  // Get effect limit for current card
  const getEffectLimit = (): number => {
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return 0;

    const raptorHasEffect = raptorCard < scientistCard;

    if (raptorHasEffect) {
      // Raptor cards: 1=1 baby, 3=1 scientist, 4=2 babies, 5=2 recovery, 7=3 recovery, 8=2 scientists
      if (raptorCard === 1) return 1;
      if (raptorCard === 3) return 1;
      if (raptorCard === 4) return 2;
      if (raptorCard === 5) return 2; // Recovery x2
      if (raptorCard === 7) return 3; // Recovery x3
      if (raptorCard === 8) return 2;
      return 0;
    } else {
      // Scientist cards: 1=1 baby, 2=2 scientists, 3=2 jeep moves, 4=2 babies, 5=2 fire, 6=2 scientists, 7=3 fire, 8=4 jeep moves
      if (scientistCard === 1) return 1;
      if (scientistCard === 2 || scientistCard === 6) return 2; // Reinforcements
      if (scientistCard === 3) return 2; // Jeep x2
      if (scientistCard === 4) return 2;
      if (scientistCard === 5) return 2; // Fire x2
      if (scientistCard === 7) return 3; // Fire x3
      if (scientistCard === 8) return 4; // Jeep x4
      return 0;
    }
  };

  // Determine which player has the effect
  const getEffectPlayer = (): "raptor" | "scientist" | null => {
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return null;
    return raptorCard < scientistCard ? "raptor" : "scientist";
  };

  // Get instruction text for current effect
  const getEffectInstruction = (): string => {
    const effectType = getCurrentEffectType();
    const limit = getEffectLimit();
    const selectionCount = selectedEffectTargets.length;

    if (effectType === "fear") {
      return `Click scientists to frighten (${selectionCount}/${limit})`;
    } else if (effectType === "sleeping_gas") {
      return `Click baby raptors to put to sleep (${selectionCount}/${limit})`;
    } else if (effectType === "mothers_call") {
      if (selectedBabyForCall !== null) {
        return `Click a destination on mother's tile (${pendingMothersCallMoves.length}/${limit})`;
      } else {
        return `Click a baby raptor to call (${pendingMothersCallMoves.length}/${limit})`;
      }
    } else if (effectType === "disappearance") {
      return "Click Confirm to remove mother from the board";
    } else if (effectType === "recovery") {
      return `Click sleeping babies to wake up (${selectionCount}/${limit})`;
    } else if (effectType === "reinforcements") {
      return `Click spaces on edges to place scientists (${pendingReinforcementPlacements.length}/${limit})`;
    } else if (effectType === "fire") {
      return `Click spaces adjacent to scientists or fire (${pendingFirePlacements.length}/${limit})`;
    } else if (effectType === "jeep") {
      if (selectedScientistForJeep !== null) {
        return `Click a destination for the jeep (${pendingJeepMoves.length}/${limit})`;
      } else {
        return `Click a scientist to move by jeep (${pendingJeepMoves.length}/${limit})`;
      }
    }
    return "No effect";
  };

  // Check if effect confirm button should be enabled
  const isEffectConfirmEnabled = (): boolean => {
    const effectType = getCurrentEffectType();
    if (effectType === "mothers_call") return pendingMothersCallMoves.length > 0;
    if (effectType === "disappearance") return true;
    if (effectType === "reinforcements") return pendingReinforcementPlacements.length > 0;
    if (effectType === "fire") return pendingFirePlacements.length > 0;
    if (effectType === "jeep") return pendingJeepMoves.length > 0;
    return selectedEffectTargets.length > 0;
  };

  // Check if undo button should be shown for effect phase
  const shouldShowEffectUndo = (): boolean => {
    const effectType = getCurrentEffectType();
    if (effectType === "fire") return pendingFirePlacements.length > 0;
    if (effectType === "jeep") return pendingJeepMoves.length > 0;
    return false;
  };

  // Handle undo for effect phase
  const handleEffectUndo = () => {
    const effectType = getCurrentEffectType();
    if (effectType === "fire") {
      handleFireReset();
    } else if (effectType === "jeep") {
      handleJeepReset();
    }
  };

  // Handle piece interactions - returns true if the interaction was handled
  const handlePieceInteraction = (pieceId: string): boolean => {
    // Handle effect phase targeting
    if (state.phase === "EFFECT_PHASE") {
      const effectType = getCurrentEffectType();
      const piece = findPieceById(pieceId);
      if (!piece) return false;

      if (effectType === "fear") {
        // Fear: select scientists to frighten
        if (piece.type !== "scientist" || piece.isFrightened) return false;

        setSelectedEffectTargets((prev) => {
          if (prev.includes(pieceId)) {
            return prev.filter((id) => id !== pieceId);
          } else {
            const limit = getEffectLimit();
            if (prev.length >= limit) {
              return [...prev.slice(1), pieceId];
            }
            return [...prev, pieceId];
          }
        });
        return true;
      } else if (effectType === "sleeping_gas") {
        // Sleeping Gas: select babies to put to sleep
        if (piece.type !== "baby" || piece.isAsleep) return false;

        setSelectedEffectTargets((prev) => {
          if (prev.includes(pieceId)) {
            return prev.filter((id) => id !== pieceId);
          } else {
            const limit = getEffectLimit();
            if (prev.length >= limit) {
              return [...prev.slice(1), pieceId];
            }
            return [...prev, pieceId];
          }
        });
        return true;
      } else if (effectType === "recovery") {
        // Recovery: select sleeping babies to wake up
        if (piece.type !== "baby" || !piece.isAsleep) return false;

        setSelectedEffectTargets((prev) => {
          if (prev.includes(pieceId)) {
            return prev.filter((id) => id !== pieceId);
          } else {
            const limit = getEffectLimit();
            if (prev.length >= limit) {
              return [...prev.slice(1), pieceId];
            }
            return [...prev, pieceId];
          }
        });
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
            // Remove the pending move (undo)
            setPendingMothersCallMoves((prev) => prev.filter((m) => m.babyId !== pieceId));
            return true;
          }

          // If clicking the currently selected baby, deselect it
          if (pieceId === selectedBabyForCall) {
            setSelectedBabyForCall(null);
            setSelectedBabyPathResults([]);
            return true;
          }

          // Check if we're at the limit
          const limit = getEffectLimit();
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
          setSelectedBabyForCall(pieceId);
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
            setSelectedScientistForJeep(null);
            setSelectedScientistJeepDestinations([]);
            return true;
          }

          // Check if we're at the limit - can't add more moves
          const limit = getEffectLimit();
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
          setSelectedScientistForJeep(pieceId);
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
          setSelectedActionPieceId(pieceId);
        }
        return true;
      }

      // Toggle selection or switch to new piece
      if (selectedActionPieceId === pieceId) {
        setSelectedActionPieceId(null);
      } else {
        setSelectedActionPieceId(pieceId);
      }
      return true;
    }

    return false;
  };

  const handleEffectConfirm = () => {
    const effectType = getCurrentEffectType();

    if (effectType === "fear") {
      dispatch({
        type: "FRIGHTEN_SCIENTISTS",
        pieceIds: selectedEffectTargets,
      });
      setSelectedEffectTargets([]);
    } else if (effectType === "sleeping_gas") {
      dispatch({
        type: "PUT_BABIES_TO_SLEEP",
        pieceIds: selectedEffectTargets,
      });
      setSelectedEffectTargets([]);
    } else if (effectType === "recovery") {
      dispatch({
        type: "WAKE_BABIES",
        pieceIds: selectedEffectTargets,
      });
      setSelectedEffectTargets([]);
    } else if (effectType === "mothers_call") {
      dispatch({
        type: "MOTHERS_CALL",
        moves: pendingMothersCallMoves,
      });
      setPendingMothersCallMoves([]);
      setSelectedBabyForCall(null);
    } else if (effectType === "disappearance") {
      dispatch({ type: "DISAPPEARANCE" });
    } else if (effectType === "reinforcements") {
      dispatch({
        type: "REINFORCEMENTS",
        placements: pendingReinforcementPlacements,
      });
      setPendingReinforcementPlacements([]);
    } else if (effectType === "fire") {
      dispatch({
        type: "PLACE_FIRE",
        placements: pendingFirePlacements,
      });
      setPendingFirePlacements([]);
    } else if (effectType === "jeep") {
      dispatch({
        type: "JEEP_MOVES",
        moves: pendingJeepMoves,
      });
      setPendingJeepMoves([]);
      setSelectedScientistForJeep(null);
      setSelectedScientistJeepDestinations([]);
    }
  };

  const handleFireReset = () => {
    setPendingFirePlacements([]);
  };

  const handleJeepReset = () => {
    setPendingJeepMoves([]);
    setSelectedScientistForJeep(null);
    setSelectedScientistJeepDestinations([]);
  };

  // Handle action phase reset
  const handleActionReset = () => {
    if (actionPhaseSavedState) {
      dispatch({
        type: "RESET_ACTION_PHASE",
        savedState: actionPhaseSavedState,
      });
      setSelectedActionPieceId(null);
    }
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

    const effectType = getCurrentEffectType();

    if (effectType === "mothers_call") {
      if (selectedBabyForCall === null) return;

      // Find the path for this destination from cached results
      const pathResult = selectedBabyPathResults.find(
        (pr) => pr.position.tileId === tileId && pr.position.x === x && pr.position.y === y,
      );

      // Add to pending moves with path
      setPendingMothersCallMoves((prev) => [
        ...prev,
        {
          babyId: selectedBabyForCall,
          destinationTileId: tileId,
          destinationX: x,
          destinationY: y,
          path: pathResult?.path ?? [],
        },
      ]);
      setSelectedBabyForCall(null);
      setSelectedBabyPathResults([]);
    } else if (effectType === "reinforcements") {
      // Check if already selected (toggle off)
      const alreadySelected = pendingReinforcementPlacements.some((p) => p.tileId === tileId && p.x === x && p.y === y);

      if (alreadySelected) {
        // Remove from pending
        setPendingReinforcementPlacements((prev) =>
          prev.filter((p) => !(p.tileId === tileId && p.x === x && p.y === y)),
        );
      } else {
        const limit = getEffectLimit();
        const atLimit = pendingReinforcementPlacements.length >= limit;

        if (atLimit) {
          // Reuse the ID of the oldest placement so Framer Motion animates the move
          const oldestId = pendingReinforcementPlacements[0].id;
          setPendingReinforcementPlacements((prev) => [...prev.slice(1), { id: oldestId, tileId, x, y }]);
        } else {
          // New placement gets a fresh ID
          const newId = reinforcementIdCounter;
          setReinforcementIdCounter((c) => c + 1);
          setPendingReinforcementPlacements((prev) => [...prev, { id: newId, tileId, x, y }]);
        }
      }
    } else if (effectType === "fire") {
      // Fire placement: no undo, no replace - just add until limit
      const limit = getEffectLimit();
      if (pendingFirePlacements.length >= limit) {
        // At limit - do nothing, user must use Reset button
        return;
      }

      // Add new fire placement
      setPendingFirePlacements((prev) => [...prev, { tileId, x, y }]);
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
      setPendingJeepMoves((prev) => [
        ...prev,
        {
          scientistId: selectedScientistForJeep,
          fromTileId: fromPos.tileId,
          fromX: fromPos.x,
          fromY: fromPos.y,
          toTileId: tileId,
          toX: x,
          toY: y,
          path: destination.path,
        },
      ]);

      // Clear selection - user can select another scientist or same one again
      setSelectedScientistForJeep(null);
      setSelectedScientistJeepDestinations([]);
    }
  };

  const handleCardSelect = (value: number) => {
    // Toggle selection - clicking same card deselects, clicking different card swaps
    setSelectedCard((prev) => (prev === value ? null : value));
  };

  const handleCardConfirm = () => {
    if (selectedCard === null) return;

    const player =
      state.phase === "SCIENTIST_CARD_SELECTION"
        ? "scientist"
        : state.phase === "RAPTOR_CARD_SELECTION"
          ? "raptor"
          : null;

    if (player) {
      dispatch({ type: "PLAY_CARD", player, card: selectedCard });
      setSelectedCard(null);
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
  const actionTargets = (() => {
    const result = {
      hostileTargets: [] as string[],
      friendlyTargets: [] as string[],
      friendlyFirePositions: [] as Array<{
        tileId: number;
        x: number;
        y: number;
      }>,
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
          result.hostileTargets.push(adj.id);
        } else if (adj.type === "baby" && adj.isAsleep && !state.asleepThisRound.includes(adj.id)) {
          result.friendlyTargets.push(adj.id);
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
          result.hostileTargets.push(adj.id);
        }
      }

      // Scientist can also shoot the mother if they have line of sight
      const mother = state.mother;
      if (mother && hasLineOfSight(state.tiles, state.scientists, selectedPiece, mother)) {
        result.hostileTargets.push(mother.id);
      }
    }

    return result;
  })();

  // Adapt pieces for Tile component
  const adaptedPieces = getAllPieces().map(adaptPieceForRender);

  // Calculate valid effect targets during effect phase
  const effectTargetIds: string[] = (() => {
    if (state.phase !== "EFFECT_PHASE") return [];

    const effectType = getCurrentEffectType();

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
      const limit = getEffectLimit();
      if (pendingMothersCallMoves.length >= limit && !selectedBabyForCall) {
        return [];
      }

      return state.babies
        .filter((b) => !pendingBabyIds.includes(b.id) && canBabyReachMotherTile(state.tiles, getAllPieces(), b, mother))
        .map((b) => b.id);
    } else if (effectType === "jeep") {
      // Show all scientists as selectable (they can move multiple times)
      const limit = getEffectLimit();
      if (pendingJeepMoves.length >= limit && !selectedScientistForJeep) {
        return [];
      }

      return state.scientists.filter((s) => !s.isFrightened).map((s) => s.id);
    }

    return [];
  })();

  // Calculate valid destination spaces for Mother's Call (from cached results)
  const mothersCallDestinations: Array<{
    tileId: number;
    x: number;
    y: number;
  }> = selectedBabyPathResults.map((pr) => pr.position);

  // Calculate valid destination spaces for Reinforcements (long edges of square tiles)
  const reinforcementDestinations: Array<{
    tileId: number;
    x: number;
    y: number;
  }> = (() => {
    if (state.phase !== "EFFECT_PHASE") return [];
    if (getCurrentEffectType() !== "reinforcements") return [];
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
    if (getCurrentEffectType() !== "fire") return [];

    // Don't show destinations if already at limit
    const limit = getEffectLimit();
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

  // Calculate path trail positions for visualization
  // Includes paths from pending moves + baby start positions
  const pathTrailPositions: Array<{
    tileId: number;
    x: number;
    y: number;
  }> = (() => {
    const positions: Array<{ tileId: number; x: number; y: number }> = [];

    // Add paths and start positions from pending moves
    for (const move of pendingMothersCallMoves) {
      // Add baby's start position
      const baby = state.babies.find((b) => b.id === move.babyId);
      if (baby) {
        positions.push({ tileId: baby.tileId, x: baby.x, y: baby.y });
      }
      // Add intermediate path positions
      for (const pos of move.path) {
        positions.push(pos);
      }
    }

    return positions;
  })();

  const handleSetupConfirm = () => {
    if (state.phase === "RAPTOR_SETUP") {
      dispatch({ type: "CONFIRM_RAPTOR_SETUP" });
    } else if (state.phase === "SCIENTIST_SETUP") {
      dispatch({ type: "START_GAME" });
    }
  };

  // Helper to get action phase instruction
  const getActionInstruction = () => {
    if (state.actionPoints === 0) {
      return "No action points remaining";
    }
    if (state.activePlayer === "raptor") {
      return "Select a piece, then click to move or act";
    } else {
      return "Select a scientist, then click to move or act";
    }
  };

  // Check if any actions have been taken this action phase
  const hasActionsTaken = actionPhaseSavedState !== null && state.actionPoints < actionPhaseSavedState.actionPoints;

  // Handle loading saved game
  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  // Check if saved game exists (only check during setup phases)
  const showLoadButton = (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") && hasSavedGame();

  return (
    <div className="game-layout">
      {/* Raptor player area (top) */}
      <PlayerArea
        ref={raptorDeckRef}
        player="raptor"
        selectedCard={state.phase === "RAPTOR_CARD_SELECTION" ? selectedCard : null}
        onCardSelect={handleCardSelect}
        isNewDraw={isRaptorNewDraw}
        actionInfo={
          state.phase === "RAPTOR_SETUP"
            ? {
                phaseLabel: "Raptor Setup",
                progress: (
                  <>
                    <span>🦖 {isMotherPlaced(state) ? "1" : "0"}/1</span>
                    <span>🦎 {countPlacedBabies(state)}/5</span>
                  </>
                ),
                instruction: !isMotherPlaced(state)
                  ? "Place mother on center tile"
                  : countPlacedBabies(state) < 5
                    ? "Place babies on square tiles"
                    : "Setup complete!",
              }
            : state.phase === "RAPTOR_CARD_SELECTION"
              ? {
                  phaseLabel: "Pick a Card",
                  instruction: selectedCard ? `Card ${selectedCard} selected` : "Select a card from your hand",
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer() === "raptor"
                ? {
                    phaseLabel: "Effect Phase",
                    instruction: getEffectInstruction(),
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "raptor"
                  ? {
                      phaseLabel: "Action Phase",
                      instruction: getActionInstruction(),
                      actionPoints: state.actionPoints,
                    }
                  : undefined
        }
        actionButton={
          state.phase === "RAPTOR_SETUP"
            ? {
                label: "Done",
                disabled: !isMotherPlaced(state) || countPlacedBabies(state) < 5,
                onClick: handleSetupConfirm,
              }
            : state.phase === "RAPTOR_CARD_SELECTION"
              ? {
                  label: "Confirm",
                  disabled: selectedCard === null,
                  onClick: handleCardConfirm,
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer() === "raptor"
                ? {
                    label: "Confirm",
                    disabled: !isEffectConfirmEnabled(),
                    onClick: handleEffectConfirm,
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "raptor"
                  ? {
                      label: (
                        <>
                          End
                          <br />
                          Turn
                        </>
                      ),
                      disabled: false,
                      onClick: () => dispatch({ type: "END_ACTION_PHASE" }),
                    }
                  : {
                      label: "✓",
                      disabled: true,
                      onClick: () => {},
                      isDone: true,
                    }
        }
        undoButton={
          state.phase === "EFFECT_PHASE" && getEffectPlayer() === "raptor" && shouldShowEffectUndo()
            ? { onClick: handleEffectUndo }
            : state.phase === "ACTION_PHASE" && state.activePlayer === "raptor" && hasActionsTaken
              ? { onClick: handleActionReset, label: "Reset" }
              : undefined
        }
        loadButton={state.phase === "RAPTOR_SETUP" && showLoadButton ? { onClick: handleLoadGame } : undefined}
      />

      {/* Game board */}
      <div className="board-container">
        <LayoutGroup>
          <div className="Board">
            {state.tiles.map((tile) => {
              const piecesOnTile = adaptedPieces.filter((p) => p.tileId === tile.id);
              const validMovesOnTile = validMoves.filter((move) => move.tileId === tile.id);
              const setupPlacementsOnTile = setupPlacementSpaces.filter((s) => s.tileId === tile.id);
              const isValidSetupTile = validSetupTileIds.has(tile.id);

              // Calculate valid move targets for tiles that already have a piece during setup
              const setupMoveTargetsOnTile: Array<{ x: number; y: number }> = (() => {
                if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") return [];

                // Check if this tile has a piece that can be moved
                const hasPieceOnTile =
                  state.phase === "RAPTOR_SETUP"
                    ? state.mother?.tileId === tile.id || state.babies.some((b) => b.tileId === tile.id)
                    : state.scientists.some((s) => s.tileId === tile.id);

                if (!hasPieceOnTile) return [];

                // Return valid spaces on this tile (excluding occupied, mountains, unusable, exits for scientists)
                return tile.spaces
                  .filter((space) => {
                    if (space.hasMountain || space.isUnusable) return false;
                    if (state.phase === "SCIENTIST_SETUP" && space.isExit) return false;
                    // Exclude spaces with pieces
                    if (isSpaceOccupied(tile.id, space.coordinate.x, space.coordinate.y)) return false;
                    return true;
                  })
                  .map((space) => ({ x: space.coordinate.x, y: space.coordinate.y }));
              })();

              return (
                <Tile
                  key={tile.id}
                  tile={tile}
                  pieces={piecesOnTile}
                  validMoves={validMovesOnTile}
                  setupPlacements={setupPlacementsOnTile}
                  setupMoveTargets={setupMoveTargetsOnTile}
                  isValidSetupTile={isValidSetupTile}
                  effectTargetIds={effectTargetIds}
                  selectedEffectTargets={
                    getCurrentEffectType() === "mothers_call"
                      ? [
                          ...pendingMothersCallMoves.map((m) => m.babyId),
                          ...(selectedBabyForCall ? [selectedBabyForCall] : []),
                        ]
                      : selectedEffectTargets
                  }
                  effectDestinations={[
                    ...mothersCallDestinations,
                    ...reinforcementDestinations,
                    ...fireDestinations,
                    ...selectedScientistJeepDestinations.map((d) => ({
                      tileId: d.tileId,
                      x: d.x,
                      y: d.y,
                    })),
                  ]}
                  pendingFirePlacements={pendingFirePlacements}
                  fireTokens={state.fireTokens}
                  pendingJeepMoves={pendingJeepMoves}
                  pendingReinforcementPlacements={pendingReinforcementPlacements}
                  pendingMoves={pendingMothersCallMoves.map((m) => {
                    const baby = state.babies.find((b) => b.id === m.babyId);
                    return {
                      babyId: m.babyId,
                      fromTileId: baby?.tileId ?? 0,
                      fromX: baby?.x ?? 0,
                      fromY: baby?.y ?? 0,
                      toTileId: m.destinationTileId,
                      toX: m.destinationX,
                      toY: m.destinationY,
                    };
                  })}
                  pathTrailPositions={pathTrailPositions}
                  selectedActionPieceId={selectedActionPieceId}
                  hostileTargetIds={actionTargets.hostileTargets}
                  friendlyTargetIds={actionTargets.friendlyTargets}
                  friendlyFirePositions={actionTargets.friendlyFirePositions}
                  showCoordinates={showCoordinates}
                  onSpaceClick={handleSpaceClick}
                />
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* Scientist player area (bottom) */}
      <PlayerArea
        ref={scientistDeckRef}
        player="scientist"
        selectedCard={state.phase === "SCIENTIST_CARD_SELECTION" ? selectedCard : null}
        floatingCard={state.phase === "RAPTOR_CARD_SELECTION" ? state.scientistCards.played : null}
        onCardSelect={handleCardSelect}
        isNewDraw={isScientistNewDraw}
        actionInfo={
          state.phase === "SCIENTIST_SETUP"
            ? {
                phaseLabel: "Scientist Setup",
                progress: <span>🧑‍🔬 {countPlacedScientists(state)}/4</span>,
                instruction: countPlacedScientists(state) < 4 ? "Place scientists on L-tiles" : "Setup complete!",
              }
            : state.phase === "SCIENTIST_CARD_SELECTION"
              ? {
                  phaseLabel: "Pick a Card",
                  instruction: selectedCard ? `Card ${selectedCard} selected` : "Select a card from your hand",
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer() === "scientist"
                ? {
                    phaseLabel: "Effect Phase",
                    instruction: getEffectInstruction(),
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "scientist"
                  ? {
                      phaseLabel: "Action Phase",
                      instruction: getActionInstruction(),
                      actionPoints: state.actionPoints,
                    }
                  : undefined
        }
        actionButton={
          state.phase === "SCIENTIST_SETUP"
            ? {
                label: "Done",
                disabled: countPlacedScientists(state) < 4,
                onClick: handleSetupConfirm,
              }
            : state.phase === "SCIENTIST_CARD_SELECTION"
              ? {
                  label: "Confirm",
                  disabled: selectedCard === null,
                  onClick: handleCardConfirm,
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer() === "scientist"
                ? {
                    label: "Confirm",
                    disabled: !isEffectConfirmEnabled(),
                    onClick: handleEffectConfirm,
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "scientist"
                  ? {
                      label: (
                        <>
                          End
                          <br />
                          Turn
                        </>
                      ),
                      disabled: false,
                      onClick: () => dispatch({ type: "END_ACTION_PHASE" }),
                    }
                  : {
                      label: "✓",
                      disabled: true,
                      onClick: () => {},
                      isDone: true,
                    }
        }
        undoButton={
          state.phase === "EFFECT_PHASE" && getEffectPlayer() === "scientist" && shouldShowEffectUndo()
            ? { onClick: handleEffectUndo }
            : state.phase === "ACTION_PHASE" && state.activePlayer === "scientist" && hasActionsTaken
              ? { onClick: handleActionReset, label: "Reset" }
              : undefined
        }
      />
    </div>
  );
}

export default Board;
