import "./Board.css";
import Tile from "./Tile.tsx";
import SetupPanel from "./SetupPanel.tsx";
import CardDeck from "./CardDeck.tsx";
import { useState } from "react";
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
  };
}

interface BoardProps {
  showCoordinates?: boolean;
}

function Board({ showCoordinates = false }: BoardProps) {
  const { state, dispatch } = useGame();

  const [draggedPieceId, setDraggedPieceId] = useState<string | null>(null);
  const [draggedHoldingPieceType, setDraggedHoldingPieceType] =
    useState<PieceType | null>(null);
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);

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

  const handlePieceClick = (_pieceId: string) => {
    // TODO: Piece click handler (select piece, show info, toggle jeep mode)
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

  return (
    <>
      <SetupPanel
        onDragStart={handleHoldingPenDragStart}
        onDragEnd={handleDragEnd}
      />
      <div className="board-area">
        <div className="deck-area left">
          <CardDeck player="raptor" cardCount={9} />
        </div>
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
        <div className="deck-area right">
          <CardDeck player="scientist" cardCount={9} />
        </div>
      </div>
    </>
  );
}

export default Board;
