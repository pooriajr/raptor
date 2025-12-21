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
  className?: string;
}

function Tile({ tile, spaceActions, game, spaceClassNames, spaceOverlays, className }: TileProps) {
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

    const tileClassName = ["relative rounded-2xl transition-shadow", "bg-transparent p-0", className]
      .filter(Boolean)
      .join(" ");
    const exitColumnClassName = [
      "flex flex-col",
      tile.exitPosition === "top" ? "justify-start pt-2" : "justify-end pb-2",
    ].join(" ");

    return (
      <div
        className={tileClassName}
        data-shape={tile.shape}
        data-side={tile.side}
        data-exit-position={tile.exitPosition}
      >
        <div className="flex gap-1.5">
          {tile.side === "left" ? (
            <>
              <div className={exitColumnClassName}>{exitSpace && renderSpace(exitSpace)}</div>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-[rgba(160,155,145,0.5)] p-2">
                {usableSpaces.map(renderSpace)}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-[rgba(160,155,145,0.5)] p-2">
                {usableSpaces.map(renderSpace)}
              </div>
              <div className={exitColumnClassName}>{exitSpace && renderSpace(exitSpace)}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={["relative rounded-2xl bg-[rgba(160,155,145,0.5)] p-2 transition-shadow", className]
        .filter(Boolean)
        .join(" ")}
      data-shape={tile.shape}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5">{tile.spaces.map(renderSpace)}</div>
    </div>
  );
}

export default Tile;
