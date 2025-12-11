import "./Tile.css";
import type { Tile as TileType } from "./types/board.ts";
import Space from "./Space.tsx";

interface TileProps {
  tile: TileType;
  isValidSetupTile?: boolean;
  showCoordinates?: boolean;
}

function Tile({ tile, isValidSetupTile = false, showCoordinates = false }: TileProps) {
  return (
    <div
      className="Tile"
      data-shape={tile.shape}
      data-side={tile.shape === "L" ? tile.side : undefined}
      data-exit-position={tile.shape === "L" ? tile.exitPosition : undefined}
      data-valid-setup-tile={isValidSetupTile}
    >
      {showCoordinates && <div className="tile-label">Tile {tile.id}</div>}

      <div className="spaces-grid">
        {tile.spaces.map((space) => (
          <Space key={space.id} space={space} showCoordinates={showCoordinates} />
        ))}
      </div>
    </div>
  );
}

export default Tile;
