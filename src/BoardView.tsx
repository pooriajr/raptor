import type { ReactNode } from "react";
import type { GameState } from "./types/gameState.ts";
import type { SpaceActions, SpaceId } from "./types/spaceActions.ts";
import type { GameAction } from "./state/gameReducer.ts";
import Tile from "./Tile.tsx";

interface BoardViewProps {
  state: GameState;
  spaceActions: SpaceActions<GameAction>;
  dispatch?: React.Dispatch<GameAction>;
  className?: string;
  boardClassName?: string;
  spaceClassNames?: Partial<Record<SpaceId, string>>;
  spaceOverlays?: Partial<Record<SpaceId, ReactNode>>;
}

const noopDispatch: React.Dispatch<GameAction> = () => undefined;

const tilePositions = [
  "col-start-1 row-start-1",
  "col-start-2 row-start-1",
  "col-start-3 row-start-1",
  "col-start-4 row-start-1",
  "col-start-5 row-start-1",
  "col-start-1 row-start-2",
  "col-start-2 row-start-2",
  "col-start-3 row-start-2",
  "col-start-4 row-start-2",
  "col-start-5 row-start-2",
];

function BoardView({
  state,
  spaceActions,
  dispatch,
  className,
  boardClassName,
  spaceClassNames,
  spaceOverlays,
}: BoardViewProps) {
  const resolvedDispatch = dispatch ?? noopDispatch;
  const containerClassName = ["flex flex-1 items-center justify-center", className].filter(Boolean).join(" ");
  const boardClassNames = [
    "grid grid-cols-[auto_auto_auto_auto_auto] grid-rows-[auto_auto] gap-px p-5 w-fit [transform:perspective(1200px)_rotateX(15deg)]",
    boardClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className={boardClassNames}>
        {state.tiles.map((tile, index) => (
          <Tile
            key={tile.id}
            tile={tile}
            spaceActions={spaceActions}
            game={{ state, dispatch: resolvedDispatch }}
            spaceClassNames={spaceClassNames}
            spaceOverlays={spaceOverlays}
            className={tilePositions[index]}
          />
        ))}
      </div>
    </div>
  );
}

export default BoardView;
