import "./Board.css";
import Tile from "./Tile.tsx";
import { useState } from "react";
import { createBoard, addPiece } from "./types/board.ts";

function Board() {
  const [board] = useState(() => {
    let newBoard = createBoard();
    // Add a test piece to tile 1, position (1, 1)
    newBoard = addPiece(newBoard, "test-piece-1", 1, 1, 1);
    return newBoard;
  });

  return (
    <div className="Board">
      {board.tiles.map((tile) => {
        const piecesOnTile = board.pieces.filter((p) => p.tileId === tile.id);
        return <Tile key={tile.id} tile={tile} pieces={piecesOnTile} />;
      })}
    </div>
  );
}

export default Board;
