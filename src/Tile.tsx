import "./Tile.css";
import type { ReactNode } from "react";
import type { Tile as TileType, Space as SpaceType } from "./types/board.ts";
import Space from "./Space.tsx";
import type { SpaceActions, SpaceId } from "./types/spaceActions.ts";
import type { GameAction } from "./state/gameReducer.ts";
import type { GameContextValue } from "./state/GameContext.tsx";

interface TileProps {
  tile: TileType;
  spaceActions: SpaceActions<GameAction>;
  game?: GameContextValue;
  spaceClassNames?: Partial<Record<SpaceId, string>>;
  spaceOverlays?: Partial<Record<SpaceId, ReactNode>>;
}

function Tile({ tile, spaceActions, game, spaceClassNames, spaceOverlays }: TileProps) {
  const renderSpace = (space: SpaceType) => (
    <Space
      key={space.id}
      space={space}
      spaceActions={spaceActions}
      game={game}
      className={spaceClassNames?.[space.id]}
      overlay={spaceOverlays?.[space.id]}
    />
  );

  if (tile.shape === "L") {
    // Separate spaces into columns
    const usableCol = tile.side === "left" ? 1 : 0;

    const usableSpaces = tile.spaces.filter((s) => s.coordinate.x === usableCol);
    const exitSpace = tile.spaces.find((s) => s.isExit);

    return (
      <div className="Tile" data-shape={tile.shape} data-side={tile.side} data-exit-position={tile.exitPosition}>
        <div className="l-tile-layout">
          {tile.side === "left" ? (
            <>
              <div className="l-tile-exit-column">{exitSpace && renderSpace(exitSpace)}</div>
              <div className="l-tile-main-column">{usableSpaces.map(renderSpace)}</div>
            </>
          ) : (
            <>
              <div className="l-tile-main-column">{usableSpaces.map(renderSpace)}</div>
              <div className="l-tile-exit-column">{exitSpace && renderSpace(exitSpace)}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="Tile" data-shape={tile.shape}>
      <div className="spaces-grid">{tile.spaces.map(renderSpace)}</div>
    </div>
  );
}

export default Tile;
