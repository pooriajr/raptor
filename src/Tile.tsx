import "./Tile.css";
import type { Tile as TileType } from "./types/board.ts";
import type { SpaceHighlights, SpaceId } from "./types/highlights.ts";
import Space from "./Space.tsx";

// Pending preview data - what will appear at a space on confirm
interface PendingPreview {
  type: "baby" | "scientist" | "jeep";
  id?: string | number;
}

interface TileProps {
  tile: TileType;
  highlights: SpaceHighlights;
  isValidSetupTile?: boolean;
  pendingPreviews?: Map<SpaceId, PendingPreview>;
  showCoordinates?: boolean;
  onSpaceClick: (tileId: number, x: number, y: number, pieceId: string | null) => void;
}

function Tile({
  tile,
  highlights,
  isValidSetupTile = false,
  pendingPreviews = new Map(),
  showCoordinates = false,
  onSpaceClick,
}: TileProps) {
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
          <Space
            key={space.id}
            tileId={tile.id}
            space={space}
            highlight={highlights.get(space.id)}
            pendingPreview={pendingPreviews.get(space.id)}
            showCoordinates={showCoordinates}
            onSpaceClick={onSpaceClick}
          />
        ))}
      </div>
    </div>
  );
}

export default Tile;
