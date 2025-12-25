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
    const exitColumnClassName = ["flex flex-col", tile.exitPosition === "top" ? "justify-start" : "justify-end"].join(
      " ",
    );
    const mainColumnCornerClassName =
      tile.side === "left"
        ? tile.exitPosition === "top"
          ? "rounded-r-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-none"
          : "rounded-r-2xl rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl-none"
        : tile.exitPosition === "top"
          ? "rounded-l-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-none"
          : "rounded-l-2xl rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl rounded-br-none";
    const mainColumnClassName = [
      "flex flex-col gap-1.5 bg-[rgba(160,155,145,0.5)] py-2 px-2",
      mainColumnCornerClassName,
    ].join(" ");
    const exitSpaceWrapperClassName = [
      "flex flex-col bg-[rgba(160,155,145,0.5)] py-2",
      tile.side === "left" ? "pl-2 pr-0 rounded-l-2xl rounded-r-none" : "pl-0 pr-2 rounded-r-2xl rounded-l-none",
    ].join(" ");

    return (
      <div
        className={tileClassName}
        data-shape={tile.shape}
        data-side={tile.side}
        data-exit-position={tile.exitPosition}
      >
        <div className="flex gap-0">
          {tile.side === "left" ? (
            <>
              <div className={exitColumnClassName}>
                {exitSpace && <div className={exitSpaceWrapperClassName}>{renderSpace(exitSpace)}</div>}
              </div>
              <div className={mainColumnClassName}>{usableSpaces.map(renderSpace)}</div>
            </>
          ) : (
            <>
              <div className={mainColumnClassName}>{usableSpaces.map(renderSpace)}</div>
              <div className={exitColumnClassName}>
                {exitSpace && <div className={exitSpaceWrapperClassName}>{renderSpace(exitSpace)}</div>}
              </div>
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
