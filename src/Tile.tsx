import "./Tile.css";
import type { Tile as TileType } from "./types/board.ts";
import Space from "./Space.tsx";

interface TileProps {
  tile: TileType;
}

function Tile({ tile }: TileProps) {
  if (tile.shape === "L") {
    // Separate spaces into columns
    const exitCol = tile.side === "left" ? 0 : 1;
    const usableCol = tile.side === "left" ? 1 : 0;

    const usableSpaces = tile.spaces.filter((s) => s.coordinate.x === usableCol);
    const exitSpace = tile.spaces.find((s) => s.isExit);

    return (
      <div className="Tile" data-shape={tile.shape} data-side={tile.side} data-exit-position={tile.exitPosition}>
        <div className="l-tile-layout">
          {tile.side === "left" ? (
            <>
              <div className="l-tile-exit-column">{exitSpace && <Space key={exitSpace.id} space={exitSpace} />}</div>
              <div className="l-tile-main-column">
                {usableSpaces.map((space) => (
                  <Space key={space.id} space={space} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="l-tile-main-column">
                {usableSpaces.map((space) => (
                  <Space key={space.id} space={space} />
                ))}
              </div>
              <div className="l-tile-exit-column">{exitSpace && <Space key={exitSpace.id} space={exitSpace} />}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="Tile" data-shape={tile.shape}>
      <div className="spaces-grid">
        {tile.spaces.map((space) => (
          <Space key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
}

export default Tile;
