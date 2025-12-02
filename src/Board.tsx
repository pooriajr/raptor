import "./Board.css";
import Tile from "./Tile.tsx";
import { useState } from "react";
import { createBoard, addPiece, movePiece } from "./types/board.ts";
import { BabyRaptor } from "./pieces/BabyRaptor.ts";

function Board() {
  const [board, setBoard] = useState(() => {
    let newBoard = createBoard();
    // Add two baby raptor pieces
    newBoard = addPiece(newBoard, new BabyRaptor("baby-1", 1, 1, 1));
    newBoard = addPiece(newBoard, new BabyRaptor("baby-2", 1, 2, 1));
    return newBoard;
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

  // Get the valid moves for the currently dragged or hovered piece
  const activePieceId = draggedPieceId || hoveredPieceId;
  const activePiece = activePieceId
    ? board.pieces.find((p) => p.id === activePieceId)
    : null;

  // Filter valid moves to exclude mountains and occupied spaces
  const validMoves = activePiece
    ? activePiece.getValidMoves().filter((move) => {
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
    : [];

  const handleDrop = (tileId: number, localX: number, localY: number) => {
    if (draggedPieceId) {
      const result = movePiece(board, draggedPieceId, tileId, localX, localY);
      if (result) {
        setBoard(result);
      }
      setDraggedPieceId(null);
    }
  };

  return (
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
          />
        );
      })}
    </div>
  );
}

export default Board;
