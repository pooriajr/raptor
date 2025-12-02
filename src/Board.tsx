import "./Board.css";
import Tile from "./Tile.tsx";
import HoldingPen from "./HoldingPen.tsx";
import { useState } from "react";
import { createBoard, movePiece } from "./types/board.ts";
import { BabyRaptor } from "./pieces/BabyRaptor.ts";
import { MotherRaptor } from "./pieces/MotherRaptor.ts";
import { Scientist } from "./pieces/Scientist.ts";
import type { Piece } from "./pieces/Piece.ts";

function Board() {
  const [board, setBoard] = useState(() => createBoard());

  // Holding pen pieces (not yet on board)
  const [holdingPenPieces, setHoldingPenPieces] = useState<Piece[]>(() => {
    const pieces: Piece[] = [];
    // Add 1 mother raptor
    pieces.push(new MotherRaptor("mother", -1, 0, 0));
    // Add 5 baby raptors
    for (let i = 0; i < 5; i++) {
      pieces.push(new BabyRaptor(`baby-${i}`, -1, 0, 0));
    }
    // Add 10 scientists
    for (let i = 0; i < 10; i++) {
      pieces.push(new Scientist(`scientist-${i}`, -1, 0, 0));
    }
    return pieces;
  });

  const [draggedPieceId, setDraggedPieceId] = useState<string | null>(null);
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);

  const handleMouseDown = (pieceId: string) => {
    setHoveredPieceId(pieceId);
  };

  const handleMouseUp = () => {
    setHoveredPieceId(null);
  };

  const handleDragStart = (pieceId: string) => {
    setDraggedPieceId(pieceId);
    setHoveredPieceId(null); // Clear hover when drag starts
  };

  const handleDragEnd = () => {
    setDraggedPieceId(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePieceClick = (pieceId: string) => {
    // TODO: Piece click handler (select piece, show info, toggle jeep mode)
  };

  // Get the valid moves for the currently dragged or hovered piece
  const activePieceId = draggedPieceId || hoveredPieceId;
  const activePiece = activePieceId
    ? board.pieces.find((p) => p.id === activePieceId) ||
      holdingPenPieces.find((p) => p.id === activePieceId)
    : null;

  // Calculate valid placement spaces for pieces from holding pen
  const getValidPlacementSpaces = (
    piece: Piece,
  ): Array<{ tileId: number; x: number; y: number }> => {
    const validSpaces: Array<{ tileId: number; x: number; y: number }> = [];

    if (piece instanceof Scientist) {
      // Scientists can only go on L-tiles, not on exit spaces, one per tile
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      for (const tile of lTiles) {
        // Check if this tile already has a scientist
        const hasScientist = board.pieces.some(
          (p) => p instanceof Scientist && p.tileId === tile.id,
        );
        if (hasScientist) continue;

        // Add all valid spaces on this L-tile
        for (const space of tile.spaces) {
          if (
            !space.isExit &&
            !space.isUnusable &&
            !space.hasMountain &&
            !board.pieces.some(
              (p) =>
                p.tileId === tile.id &&
                p.localX === space.coordinate.x &&
                p.localY === space.coordinate.y,
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
    } else if (piece instanceof MotherRaptor) {
      // Mother raptor can only go on central square tiles (2 or 7)
      const centralTiles = [2, 7];
      const squareTiles = board.tiles.filter(
        (t) => t.shape === "square" && centralTiles.includes(t.id),
      );

      for (const tile of squareTiles) {
        // Check if this tile already has a raptor (mother or baby)
        const hasRaptor = board.pieces.some(
          (p) =>
            (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
            p.tileId === tile.id,
        );
        if (hasRaptor) continue;

        // Add all valid spaces on this central tile
        for (const space of tile.spaces) {
          if (
            !space.isUnusable &&
            !space.hasMountain &&
            !board.pieces.some(
              (p) =>
                p.tileId === tile.id &&
                p.localX === space.coordinate.x &&
                p.localY === space.coordinate.y,
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
    } else if (piece instanceof BabyRaptor) {
      // Baby raptors can go on any square tiles, one raptor per tile
      // BUT: must leave at least one central tile (2 or 7) available for mother
      const squareTiles = board.tiles.filter((t) => t.shape === "square");
      const centralTiles = [2, 7];

      // Check which central tiles are already occupied by raptors
      const occupiedCentralTiles = board.pieces.filter(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          centralTiles.includes(p.tileId),
      );

      for (const tile of squareTiles) {
        // Check if this tile already has a raptor (mother or baby)
        const hasRaptor = board.pieces.some(
          (p) =>
            (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
            p.tileId === tile.id,
        );
        if (hasRaptor) continue;

        // If this is a central tile and one central tile is already occupied,
        // don't allow placement (must leave one central tile for mother)
        if (
          centralTiles.includes(tile.id) &&
          occupiedCentralTiles.length >= 1
        ) {
          continue;
        }

        // Add all valid spaces on this square tile
        for (const space of tile.spaces) {
          if (
            !space.isUnusable &&
            !space.hasMountain &&
            !board.pieces.some(
              (p) =>
                p.tileId === tile.id &&
                p.localX === space.coordinate.x &&
                p.localY === space.coordinate.y,
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

  // Filter valid moves to exclude mountains and occupied spaces
  const validMoves =
    activePiece && activePiece.tileId !== -1
      ? // Piece already on board - use movement rules
        activePiece.getValidMoves(board).filter((move) => {
          // Find the target tile
          const targetTile = board.tiles.find((t) => t.id === move.tileId);
          if (!targetTile) return false;

          // Find the target space
          const targetSpace = targetTile.spaces.find(
            (s) => s.coordinate.x === move.x && s.coordinate.y === move.y,
          );
          if (!targetSpace) return false;

          // Exclude mountains
          if (targetSpace.hasMountain) return false;

          // Exclude occupied spaces
          const isOccupied = board.pieces.some(
            (p) =>
              p.id !== activePieceId &&
              p.tileId === move.tileId &&
              p.localX === move.x &&
              p.localY === move.y,
          );
          if (isOccupied) return false;

          return true;
        })
      : activePiece && activePiece.tileId === -1
        ? // Piece in holding pen - use placement rules
          getValidPlacementSpaces(activePiece)
        : [];

  const handleDrop = (tileId: number, localX: number, localY: number) => {
    if (draggedPieceId) {
      // Check if piece is from holding pen
      const holdingPieceIndex = holdingPenPieces.findIndex(
        (p) => p.id === draggedPieceId,
      );

      if (holdingPieceIndex !== -1) {
        // Placing piece from holding pen onto board
        const piece = holdingPenPieces[holdingPieceIndex];

        // Find the target tile and space
        const targetTile = board.tiles.find((t) => t.id === tileId);
        if (!targetTile) return;

        const targetSpace = targetTile.spaces.find(
          (s) => s.coordinate.x === localX && s.coordinate.y === localY,
        );
        if (!targetSpace) return;

        // Check if target space is valid (not mountain, not unusable, not occupied)
        const isOccupied = board.pieces.some(
          (p) =>
            p.tileId === tileId && p.localX === localX && p.localY === localY,
        );

        // Setup rules for piece placement
        if (piece instanceof Scientist) {
          // Scientists can only be placed on L-tiles (not on exit spaces)
          // and only one scientist per L-tile

          // Must be an L-tile
          if (targetTile.shape !== "L") return;

          // Cannot be on exit space
          if (targetSpace.isExit) return;

          // Check if there's already a scientist on this L-tile
          const scientistOnTile = board.pieces.some(
            (p) => p instanceof Scientist && p.tileId === tileId,
          );
          if (scientistOnTile) return;
        } else if (piece instanceof MotherRaptor) {
          // Mother raptor can only be placed on central square tiles (2 or 7)
          // and only one raptor per tile

          // Must be a square tile
          if (targetTile.shape !== "square") return;

          // Must be a central tile (2 or 7)
          const centralTiles = [2, 7];
          if (!centralTiles.includes(tileId)) return;

          // Check if there's already a raptor on this tile
          const raptorOnTile = board.pieces.some(
            (p) =>
              (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
              p.tileId === tileId,
          );
          if (raptorOnTile) return;
        } else if (piece instanceof BabyRaptor) {
          // Baby raptors can be placed on any square tiles
          // and only one raptor per tile
          // BUT: must leave at least one central tile (2 or 7) for mother

          // Must be a square tile
          if (targetTile.shape !== "square") return;

          // Check if there's already a raptor on this tile
          const raptorOnTile = board.pieces.some(
            (p) =>
              (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
              p.tileId === tileId,
          );
          if (raptorOnTile) return;

          // If placing on a central tile, check if the other central tile is occupied
          const centralTiles = [2, 7];
          if (centralTiles.includes(tileId)) {
            const occupiedCentralTiles = board.pieces.filter(
              (p) =>
                (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
                centralTiles.includes(p.tileId),
            );
            // Don't allow if one central tile is already occupied
            if (occupiedCentralTiles.length >= 1) return;
          }
        }

        if (
          !targetSpace.hasMountain &&
          !targetSpace.isUnusable &&
          !isOccupied
        ) {
          // Create a new piece instance with updated position (React immutability)
          const updatedPiece = piece.clone(tileId, localX, localY);

          // Add to board and remove from holding pen
          setBoard({ ...board, pieces: [...board.pieces, updatedPiece] });
          setHoldingPenPieces(
            holdingPenPieces.filter((_, i) => i !== holdingPieceIndex),
          );
        }
      } else {
        // Moving piece already on board
        const result = movePiece(board, draggedPieceId, tileId, localX, localY);
        if (result) {
          setBoard(result);
        }
      }
      setDraggedPieceId(null);
    }
  };

  return (
    <>
      <HoldingPen
        pieces={holdingPenPieces}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPieceClick={handlePieceClick}
      />
      <div className="Board">
        {board.tiles.map((tile) => {
          const piecesOnTile = board.pieces.filter((p) => p.tileId === tile.id);
          // Filter valid moves for this tile
          const validMovesOnTile = validMoves.filter(
            (move) => move.tileId === tile.id,
          );
          return (
            <Tile
              key={tile.id}
              tile={tile}
              pieces={piecesOnTile}
              validMoves={validMovesOnTile}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onPieceClick={handlePieceClick}
            />
          );
        })}
      </div>
    </>
  );
}

export default Board;
