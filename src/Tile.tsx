import "./Tile.css";
import type { Tile as TileType } from "./types/board.ts";
import Space from "./Space.tsx";

interface TileProps {
  tile: TileType;
}

function Tile({ tile }: TileProps) {
  return (
    <div
      className="Tile"
      data-shape={tile.shape}
      data-side={tile.shape === "L" ? tile.side : undefined}
      data-exit-position={tile.shape === "L" ? tile.exitPosition : undefined}
    >
      <div className="spaces-grid">
        {tile.spaces.map((space) => (
          <Space key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
}

export default Tile;
