import "./Board.css";
import Tile from "./Tile.tsx";
import { useState } from "react";
import { createBoard } from "./types/board.ts";

function Board() {
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
