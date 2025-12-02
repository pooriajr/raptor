import "./Board.css";
import Tile from "./Tile.tsx";
import { useState } from "react";
import { createBoard, addPiece, movePiece } from "./types/board.ts";

function Board() {
  const [board, setBoard] = useState(() => {
    let newBoard = createBoard();
    // Add two test pieces
    newBoard = addPiece(newBoard, "test-piece-1", 1, 1, 1);
    newBoard = addPiece(newBoard, "test-piece-2", 1, 2, 1);
    return newBoard;
  });

  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);

  const handleDragStart = (pieceId: string) => {
    setDraggedPiece(pieceId);
  };

  const handleDrop = (tileId: number, localX: number, localY: number) => {
    if (draggedPiece) {
      const result = movePiece(board, draggedPiece, tileId, localX, localY);
      if (result) {
        setBoard(result);
      }
      setDraggedPiece(null);
    }
  };

  return (
    <div className="Board">
      {board.tiles.map((tile) => {
        const piecesOnTile = board.pieces.filter((p) => p.tileId === tile.id);
        return (
          <Tile
            key={tile.id}
            tile={tile}
            pieces={piecesOnTile}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
}

export default Board;
