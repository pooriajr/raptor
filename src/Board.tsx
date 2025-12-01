import "./Board.css";
import Tile from "./Tile.tsx";
import { useState } from "react";
import { createBoard } from "./types/board.ts";
import type { Board as BoardType } from "./types/board.ts";

function Board() {
  // useState creates the board ONCE and remembers it
  // The () => createBoard() is called a "lazy initializer"
  // It only runs the first time the component renders
  // In Ruby: @board ||= create_board (memoization)
  const [board] = useState(() => createBoard());

  return (
    <div className="Board">
      {/* Loop through all tiles and render each one */}
      {/* Like Ruby: board.tiles.each do |tile| */}
      {board.tiles.map((tile) => (
        // Pass the tile data to the Tile component
        // "key" is required by React for lists (helps React track which items changed)
        <Tile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

export default Board;
