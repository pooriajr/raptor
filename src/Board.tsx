import "./Board.css";
import Tile from "./Tile.tsx";
import SetupPanel from "./SetupPanel.tsx";
import CardDeck from "./CardDeck.tsx";
import Hand from "./Hand.tsx";
import EffectPhaseBanner from "./EffectPhaseOverlay.tsx";
import { useState, useEffect, useRef } from "react";
import { useGame } from "./state/GameContext.tsx";
import type { PieceState, PieceType } from "./types/gameState.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";
import { MotherRaptor } from "./pieces/MotherRaptor.ts";
import { BabyRaptor } from "./pieces/BabyRaptor.ts";
import { Scientist } from "./pieces/Scientist.ts";
import {
  canBabyReachMotherTile,
  getReachableDestinationsOnMotherTileWithPaths,
  type Position,
  type PathResult,
} from "./utils/pathfinding.ts";

// Effect types for the current card
type EffectType =
  | "fear"
  | "sleeping_gas"
  | "mothers_call"
  | "reinforcements"
  | "none";

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

  const [draggedPieceId, setDraggedPieceId] = useState<string | null>(null);
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
      const setNewDraw = isScientistSelection
        ? setIsScientistNewDraw
        : setIsRaptorNewDraw;

      dispatch({ type: "DRAW_CARDS", player });
      setNewDraw(true);
      const timeout = setTimeout(() => setNewDraw(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.phase, dispatch]);
  const [draggedHoldingPieceType, setDraggedHoldingPieceType] =
    useState<PieceType | null>(null);
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [selectedEffectTargets, setSelectedEffectTargets] = useState<string[]>(
    [],
  );
  // For Mother's Call: track selected baby and pending moves
  const [selectedBabyForCall, setSelectedBabyForCall] = useState<string | null>(
    null,
  );
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
  const [selectedBabyPathResults, setSelectedBabyPathResults] = useState<
    PathResult[]
  >([]);
  // For Reinforcements: track pending placements with stable IDs for animation
  const [pendingReinforcementPlacements, setPendingReinforcementPlacements] =
    useState<Array<{ id: number; tileId: number; x: number; y: number }>>([]);
  const [reinforcementIdCounter, setReinforcementIdCounter] = useState(0);

  // Reset effect targets when leaving effect phase
  useEffect(() => {
    if (state.phase !== "EFFECT_PHASE") {
      setSelectedEffectTargets([]);
      setSelectedBabyForCall(null);
      setPendingMothersCallMoves([]);
      setSelectedBabyPathResults([]);
      setPendingReinforcementPlacements([]);
      setReinforcementIdCounter(0);
    }
  }, [state.phase]);

  // Determine the current effect type based on played cards
  const getCurrentEffectType = (): EffectType => {
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return "none";

    const raptorHasEffect = raptorCard < scientistCard;

    if (raptorHasEffect) {
      // Raptor effects: 1=Mother's Call(1), 3=Fear(1), 4=Mother's Call(2), 8=Fear(2)
      if (raptorCard === 1 || raptorCard === 4) return "mothers_call";
      if (raptorCard === 3 || raptorCard === 8) return "fear";
      return "none";
    } else {
      // Scientist effects: 1=Sleeping Gas(1), 2=Reinforcements(1-2), 4=Sleeping Gas(2), 6=Reinforcements(1-2)
      if (scientistCard === 1 || scientistCard === 4) return "sleeping_gas";
      if (scientistCard === 2 || scientistCard === 6) return "reinforcements";
      return "none";
    }
  };

  const handleMouseDown = (pieceId: string) => {
    setHoveredPieceId(pieceId);
  };

  const handleMouseUp = () => {
    setHoveredPieceId(null);
  };

  const handleDragStart = (pieceId: string) => {
    setDraggedPieceId(pieceId);
    setHoveredPieceId(null);
  };

  const handleHoldingPenDragStart = (pieceType: PieceType) => {
    setDraggedHoldingPieceType(pieceType);
  };

  const handleDragEnd = () => {
    setDraggedPieceId(null);
    setDraggedHoldingPieceType(null);
  };

  // Get effect limit for current card
  const getEffectLimit = (): number => {
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return 0;

    const raptorHasEffect = raptorCard < scientistCard;

    if (raptorHasEffect) {
      // Raptor cards: 1=1 baby, 3=1 scientist, 4=2 babies, 8=2 scientists
      if (raptorCard === 1) return 1;
      if (raptorCard === 3) return 1;
      if (raptorCard === 4) return 2;
      if (raptorCard === 8) return 2;
      return 0;
    } else {
      // Scientist cards: 1=1 baby, 2=2 scientists, 4=2 babies, 6=2 scientists
      if (scientistCard === 1) return 1;
      if (scientistCard === 2 || scientistCard === 6) return 2; // Reinforcements
      if (scientistCard === 4) return 2;
      return 0;
    }
  };

  const handlePieceClick = (pieceId: string) => {
    // Handle effect phase targeting
    if (state.phase === "EFFECT_PHASE") {
      const effectType = getCurrentEffectType();
      const piece = state.pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      if (effectType === "fear") {
        // Fear: select scientists to frighten
        if (piece.type !== "scientist" || piece.isFrightened) return;

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
      } else if (effectType === "sleeping_gas") {
        // Sleeping Gas: select babies to put to sleep
        if (piece.type !== "baby" || piece.isAsleep) return;

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
      } else if (effectType === "mothers_call") {
        // Mother's Call: two-step selection per baby
        // Step 1: Select a baby that can reach mother's tile
        // Step 2: Select destination on mother's tile
        // Repeat for additional babies (if limit allows)
        const mother = state.pieces.find((p) => p.type === "mother");
        if (!mother) return;

        if (piece.type === "baby") {
          // Check if this baby already has a pending move
          const hasPendingMove = pendingMothersCallMoves.some(
            (m) => m.babyId === pieceId,
          );

          if (hasPendingMove) {
            // Remove the pending move (undo)
            setPendingMothersCallMoves((prev) =>
              prev.filter((m) => m.babyId !== pieceId),
            );
            return;
          }

          // If clicking the currently selected baby, deselect it
          if (pieceId === selectedBabyForCall) {
            setSelectedBabyForCall(null);
            setSelectedBabyPathResults([]);
            return;
          }

          // Check if we're at the limit
          const limit = getEffectLimit();
          if (pendingMothersCallMoves.length >= limit) return;

          // Check if baby can reach mother's tile and get paths
          const pathResults = getReachableDestinationsOnMotherTileWithPaths(
            state.tiles,
            state.pieces,
            piece,
            mother,
          );

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

          if (availablePathResults.length === 0) return;

          // Select this baby and cache its path results
          setSelectedBabyForCall(pieceId);
          setSelectedBabyPathResults(availablePathResults);
        }
      }
      return;
    }

    // TODO: Other piece click handlers (select piece, show info, toggle jeep mode)
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
    } else if (effectType === "mothers_call") {
      dispatch({
        type: "MOTHERS_CALL",
        moves: pendingMothersCallMoves,
      });
      setPendingMothersCallMoves([]);
      setSelectedBabyForCall(null);
    } else if (effectType === "reinforcements") {
      dispatch({
        type: "REINFORCEMENTS",
        placements: pendingReinforcementPlacements,
      });
      setPendingReinforcementPlacements([]);
    }
  };

  const handleEffectSkip = () => {
    dispatch({ type: "END_EFFECT_PHASE" });
    setSelectedEffectTargets([]);
    setSelectedBabyForCall(null);
    setPendingMothersCallMoves([]);
    setPendingReinforcementPlacements([]);
  };

  // Handle space click for effect destinations (Mother's Call, Reinforcements)
  const handleSpaceClick = (tileId: number, x: number, y: number) => {
    if (state.phase !== "EFFECT_PHASE") return;

    const effectType = getCurrentEffectType();

    if (effectType === "mothers_call") {
      if (selectedBabyForCall === null) return;

      // Find the path for this destination from cached results
      const pathResult = selectedBabyPathResults.find(
        (pr) =>
          pr.position.tileId === tileId &&
          pr.position.x === x &&
          pr.position.y === y,
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
      const alreadySelected = pendingReinforcementPlacements.some(
        (p) => p.tileId === tileId && p.x === x && p.y === y,
      );

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
          setPendingReinforcementPlacements((prev) => [
            ...prev.slice(1),
            { id: oldestId, tileId, x, y },
          ]);
        } else {
          // New placement gets a fresh ID
          const newId = reinforcementIdCounter;
          setReinforcementIdCounter((c) => c + 1);
          setPendingReinforcementPlacements((prev) => [
            ...prev,
            { id: newId, tileId, x, y },
          ]);
        }
      }
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

  // Get the valid moves for the currently dragged or hovered piece on the board
  const activePieceId = draggedPieceId || hoveredPieceId;
  const activePiece = activePieceId
    ? state.pieces.find((p) => p.id === activePieceId)
    : null;

  // Calculate valid placement spaces for pieces from holding pen
  const getValidPlacementSpaces = (
    pieceType: PieceType,
  ): Array<{ tileId: number; x: number; y: number }> => {
    const validSpaces: Array<{ tileId: number; x: number; y: number }> = [];

    if (pieceType === "scientist") {
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      for (const tile of lTiles) {
        const hasScientist = state.pieces.some(
          (p) => p.type === "scientist" && p.tileId === tile.id,
        );
        if (hasScientist) continue;

        for (const space of tile.spaces) {
          if (
            !space.isExit &&
            !space.isUnusable &&
            !space.hasMountain &&
            !state.pieces.some(
              (p) =>
                p.tileId === tile.id &&
                p.x === space.coordinate.x &&
                p.y === space.coordinate.y,
            )
          ) {
            validSpaces.push({
              tileId: tile.id,
              x: space.coordinate.x,
              y: space.coordinate.y,
            });
          }
        }
      }
    } else if (pieceType === "mother") {
      const centralTiles = [2, 7];
      const squareTiles = state.tiles.filter(
        (t) => t.shape === "square" && centralTiles.includes(t.id),
      );

      for (const tile of squareTiles) {
        const hasRaptor = state.pieces.some(
          (p) =>
            (p.type === "mother" || p.type === "baby") && p.tileId === tile.id,
        );
        if (hasRaptor) continue;

        for (const space of tile.spaces) {
          if (
            !space.isUnusable &&
            !space.hasMountain &&
            !state.pieces.some(
              (p) =>
                p.tileId === tile.id &&
                p.x === space.coordinate.x &&
                p.y === space.coordinate.y,
            )
          ) {
            validSpaces.push({
              tileId: tile.id,
              x: space.coordinate.x,
              y: space.coordinate.y,
            });
          }
        }
      }
    } else if (pieceType === "baby") {
      const squareTiles = state.tiles.filter((t) => t.shape === "square");
      const centralTiles = [2, 7];
      const motherPlaced = state.pieces.some((p) => p.type === "mother");

      // Only restrict central tiles if mother hasn't been placed yet
      const babiesOnCentralTiles = state.pieces.filter(
        (p) => p.type === "baby" && centralTiles.includes(p.tileId),
      );

      for (const tile of squareTiles) {
        const hasRaptor = state.pieces.some(
          (p) =>
            (p.type === "mother" || p.type === "baby") && p.tileId === tile.id,
        );
        if (hasRaptor) continue;

        // If mother not placed and one central tile has a baby, skip the other central tile
        if (
          centralTiles.includes(tile.id) &&
          !motherPlaced &&
          babiesOnCentralTiles.length >= 1
        ) {
          continue;
        }

        for (const space of tile.spaces) {
          if (
            !space.isUnusable &&
            !space.hasMountain &&
            !state.pieces.some(
              (p) =>
                p.tileId === tile.id &&
                p.x === space.coordinate.x &&
                p.y === space.coordinate.y,
            )
          ) {
            validSpaces.push({
              tileId: tile.id,
              x: space.coordinate.x,
              y: space.coordinate.y,
            });
          }
        }
      }
    }

    return validSpaces;
  };

  // Calculate valid moves
  const validMoves = activePiece
    ? // Piece on board - use movement rules
      (() => {
        const pieceInstance = createPieceFromState(activePiece);
        return pieceInstance
          .getValidMoves(state.tiles, state.pieces)
          .filter((move) => {
            const targetTile = state.tiles.find((t) => t.id === move.tileId);
            if (!targetTile) return false;

            const targetSpace = targetTile.spaces.find(
              (s) => s.coordinate.x === move.x && s.coordinate.y === move.y,
            );
            if (!targetSpace) return false;

            if (targetSpace.hasMountain) return false;

            const isOccupied = state.pieces.some(
              (p) =>
                p.id !== activePieceId &&
                p.tileId === move.tileId &&
                p.x === move.x &&
                p.y === move.y,
            );
            if (isOccupied) return false;

            return true;
          });
      })()
    : draggedHoldingPieceType
      ? // Piece from holding pen - use placement rules
        getValidPlacementSpaces(draggedHoldingPieceType)
      : [];

  const handleDrop = (tileId: number, localX: number, localY: number) => {
    if (draggedHoldingPieceType) {
      // Placing piece from holding pen
      switch (draggedHoldingPieceType) {
        case "scientist":
          dispatch({ type: "PLACE_SCIENTIST", tileId, x: localX, y: localY });
          break;
        case "mother":
          dispatch({ type: "PLACE_MOTHER", tileId, x: localX, y: localY });
          break;
        case "baby":
          dispatch({ type: "PLACE_BABY", tileId, x: localX, y: localY });
          break;
      }
      setDraggedHoldingPieceType(null);
    } else if (draggedPieceId) {
      // Moving piece on board
      dispatch({
        type: "MOVE_PIECE",
        pieceId: draggedPieceId,
        tileId,
        x: localX,
        y: localY,
      });
      setDraggedPieceId(null);
    }
  };

  // Adapt pieces for Tile component
  const adaptedPieces = state.pieces.map(adaptPieceForRender);

  // Calculate valid effect targets during effect phase
  const effectTargetIds: string[] = (() => {
    if (state.phase !== "EFFECT_PHASE") return [];

    const effectType = getCurrentEffectType();

    if (effectType === "fear") {
      return state.pieces
        .filter((p) => p.type === "scientist" && !p.isFrightened)
        .map((p) => p.id);
    } else if (effectType === "sleeping_gas") {
      return state.pieces
        .filter((p) => p.type === "baby" && !p.isAsleep)
        .map((p) => p.id);
    } else if (effectType === "mothers_call") {
      const mother = state.pieces.find((p) => p.type === "mother");
      if (!mother) return [];

      // Get IDs of babies that already have pending moves
      const pendingBabyIds = pendingMothersCallMoves.map((m) => m.babyId);

      // Show babies that can reach mother and don't already have pending moves
      // (unless we're at the limit)
      const limit = getEffectLimit();
      if (pendingMothersCallMoves.length >= limit && !selectedBabyForCall) {
        return [];
      }

      return state.pieces
        .filter(
          (p) =>
            p.type === "baby" &&
            !pendingBabyIds.includes(p.id) &&
            canBabyReachMotherTile(state.tiles, state.pieces, p, mother),
        )
        .map((p) => p.id);
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
        const space = tile.spaces.find(
          (s) => s.coordinate.x === x && s.coordinate.y === edgeY,
        );
        if (!space || space.hasMountain) continue;

        // Check not occupied by a piece
        const isOccupied = state.pieces.some(
          (p) => p.tileId === tile.id && p.x === x && p.y === edgeY,
        );
        if (isOccupied) continue;

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
      const baby = state.pieces.find((p) => p.id === move.babyId);
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

  return (
    <>
      <SetupPanel
        onDragStart={handleHoldingPenDragStart}
        onDragEnd={handleDragEnd}
      />
      {state.phase === "EFFECT_PHASE" && (
        <EffectPhaseBanner
          selectedTargets={selectedEffectTargets}
          effectLimit={getEffectLimit()}
          effectType={getCurrentEffectType()}
          selectedBabyForCall={selectedBabyForCall}
          pendingMothersCallCount={pendingMothersCallMoves.length}
          pendingReinforcementCount={pendingReinforcementPlacements.length}
          onConfirm={handleEffectConfirm}
          onSkip={handleEffectSkip}
        />
      )}
      <div className="game-layout">
        {/* Raptor player area (top) */}
        <div className="player-area raptor-area" ref={raptorDeckRef}>
          <div className="deck-section">
            <CardDeck
              player="raptor"
              cardCount={state.raptorCards.deck.length}
            />
          </div>
          <div className="hand-section">
            {state.phase === "RAPTOR_CARD_SELECTION" && (
              <Hand
                cards={state.raptorCards.hand}
                player="raptor"
                isNewDraw={isRaptorNewDraw}
                deckPosition={{ x: -300, y: 0 }}
                onCardSelect={handleCardSelect}
                onConfirm={handleCardConfirm}
                selectedCard={selectedCard}
              />
            )}
            {state.phase === "SCIENTIST_CARD_SELECTION" &&
              state.raptorCards.hand.length > 0 && (
                <Hand
                  cards={state.raptorCards.hand}
                  player="raptor"
                  faceDown={true}
                  playedCard={state.raptorCards.played}
                />
              )}
          </div>
          <div className="discard-section">
            <div className="discard-placeholder">Discard</div>
          </div>
        </div>

        {/* Game board */}
        <div className="Board">
          {state.tiles.map((tile) => {
            const piecesOnTile = adaptedPieces.filter(
              (p) => p.tileId === tile.id,
            );
            const validMovesOnTile = validMoves.filter(
              (move) => move.tileId === tile.id,
            );
            return (
              <Tile
                key={tile.id}
                tile={tile}
                pieces={piecesOnTile}
                validMoves={validMovesOnTile}
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
                ]}
                pendingReinforcementPlacements={pendingReinforcementPlacements}
                pendingMoves={pendingMothersCallMoves.map((m) => ({
                  babyId: m.babyId,
                  fromTileId:
                    state.pieces.find((p) => p.id === m.babyId)?.tileId ?? 0,
                  fromX: state.pieces.find((p) => p.id === m.babyId)?.x ?? 0,
                  fromY: state.pieces.find((p) => p.id === m.babyId)?.y ?? 0,
                  toTileId: m.destinationTileId,
                  toX: m.destinationX,
                  toY: m.destinationY,
                }))}
                pathTrailPositions={pathTrailPositions}
                showCoordinates={showCoordinates}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onPieceClick={handlePieceClick}
                onSpaceClick={handleSpaceClick}
              />
            );
          })}
        </div>

        {/* Scientist player area (bottom) */}
        <div className="player-area scientist-area" ref={scientistDeckRef}>
          <div className="deck-section">
            <CardDeck
              player="scientist"
              cardCount={state.scientistCards.deck.length}
            />
          </div>
          <div className="hand-section">
            {state.phase === "SCIENTIST_CARD_SELECTION" && (
              <Hand
                cards={state.scientistCards.hand}
                player="scientist"
                isNewDraw={isScientistNewDraw}
                deckPosition={{ x: -300, y: 0 }}
                onCardSelect={handleCardSelect}
                onConfirm={handleCardConfirm}
                selectedCard={selectedCard}
              />
            )}
            {state.phase === "RAPTOR_CARD_SELECTION" &&
              state.scientistCards.played !== null && (
                <Hand
                  cards={[
                    ...state.scientistCards.hand,
                    state.scientistCards.played,
                  ]}
                  player="scientist"
                  faceDown={true}
                  playedCard={state.scientistCards.played}
                />
              )}
          </div>
          <div className="discard-section">
            {/* Scientist discard will go here */}
            <div className="discard-placeholder">Discard</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Board;
