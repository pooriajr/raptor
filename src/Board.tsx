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

  // Reset effect targets when leaving effect phase
  useEffect(() => {
    if (state.phase !== "EFFECT_PHASE") {
      setSelectedEffectTargets([]);
    }
  }, [state.phase]);

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
    // For now, hardcode Fear x2 and Sleeping Gas x2
    // Later this will be determined by actual card effects
    return raptorHasEffect ? 2 : 2;
  };

  const handlePieceClick = (pieceId: string) => {
    // Handle effect phase targeting
    if (state.phase === "EFFECT_PHASE") {
      const scientistCard = state.scientistCards.played;
      const raptorCard = state.raptorCards.played;
      if (scientistCard === null || raptorCard === null) return;

      const raptorHasEffect = raptorCard < scientistCard;
      const piece = state.pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      // Check if this is a valid target
      const isValidTarget =
        (raptorHasEffect &&
          piece.type === "scientist" &&
          !piece.isFrightened) ||
        (!raptorHasEffect && piece.type === "baby" && !piece.isAsleep);

      if (!isValidTarget) return;

      // Toggle selection
      setSelectedEffectTargets((prev) => {
        if (prev.includes(pieceId)) {
          // Deselect
          return prev.filter((id) => id !== pieceId);
        } else {
          // Select (if under limit)
          const limit = getEffectLimit();
          if (prev.length >= limit) {
            // At limit - replace oldest selection
            return [...prev.slice(1), pieceId];
          }
          return [...prev, pieceId];
        }
      });
      return;
    }

    // TODO: Other piece click handlers (select piece, show info, toggle jeep mode)
  };

  const handleEffectConfirm = () => {
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return;

    const raptorHasEffect = raptorCard < scientistCard;

    if (raptorHasEffect) {
      dispatch({
        type: "FRIGHTEN_SCIENTISTS",
        pieceIds: selectedEffectTargets,
      });
    } else {
      dispatch({
        type: "PUT_BABIES_TO_SLEEP",
        pieceIds: selectedEffectTargets,
      });
    }
    setSelectedEffectTargets([]);
  };

  const handleEffectSkip = () => {
    dispatch({ type: "END_EFFECT_PHASE" });
    setSelectedEffectTargets([]);
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
    const scientistCard = state.scientistCards.played;
    const raptorCard = state.raptorCards.played;
    if (scientistCard === null || raptorCard === null) return [];

    const raptorHasEffect = raptorCard < scientistCard;
    if (raptorHasEffect) {
      return state.pieces
        .filter((p) => p.type === "scientist" && !p.isFrightened)
        .map((p) => p.id);
    } else {
      return state.pieces
        .filter((p) => p.type === "baby" && !p.isAsleep)
        .map((p) => p.id);
    }
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
                selectedEffectTargets={selectedEffectTargets}
                showCoordinates={showCoordinates}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onPieceClick={handlePieceClick}
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
