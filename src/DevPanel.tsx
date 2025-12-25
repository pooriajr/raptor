import { useState } from "react";
import { useGame } from "./state/GameContext.tsx";
import { countPlacedBabies, countPlacedScientists, isMotherPlaced } from "./utils/pieceUtils.ts";
import { getTileById } from "./utils/boardQueries.ts";
import { isPhase, isSetupPhase } from "./state/guards.ts";

function DevPanel() {
  const { state, dispatch } = useGame();
  const [collapsed, setCollapsed] = useState(true);

  const handleAutoSetup = () => {
    if (!isSetupPhase(state)) {
      return;
    }

    const squareTiles = state.tiles.filter((t) => t.shape === "square");
    const lTiles = state.tiles.filter((t) => t.shape === "L");

    // Place mother on tile 2 if not placed
    if (isPhase(state, "RAPTOR_SETUP") && !isMotherPlaced(state)) {
      const tile2 = getTileById(squareTiles, 2)!;
      const space = tile2.spaces.find((s) => !s.hasMountain)!;
      dispatch({
        type: "PLACE_MOTHER",
        tileId: 2,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }

    // Place babies on remaining square tiles
    if (isPhase(state, "RAPTOR_SETUP")) {
      const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
      let babiesPlaced = countPlacedBabies(state);

      for (const tile of tilesForBabies) {
        if (babiesPlaced >= 5) break;
        const hasRaptor =
          state.mother.position?.tileId === tile.id ||
          Object.values(state.babies).some((b) => b.position?.tileId === tile.id);
        if (hasRaptor) continue;

        const space = tile.spaces.find((s) => !s.hasMountain)!;
        dispatch({
          type: "PLACE_BABY",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
        babiesPlaced++;
      }
    }

    // Place scientists on L-tiles
    if (isPhase(state, "SCIENTIST_SETUP")) {
      let scientistsPlaced = countPlacedScientists(state);

      for (const tile of lTiles) {
        if (scientistsPlaced >= 4) break;
        const hasScientist = Object.values(state.scientists).some((s) => s.position?.tileId === tile.id);
        if (hasScientist) continue;

        const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        dispatch({
          type: "PLACE_SCIENTIST",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
        scientistsPlaced++;
      }
    }
  };

  if (collapsed) {
    return (
      <div
        className="absolute bottom-2.5 left-2.5 z-1000 min-w-0 cursor-pointer rounded-md border border-[#555] bg-[rgba(30,30,30,0.95)] px-3 py-2 text-[0.85rem] text-[#ccc] opacity-70 hover:opacity-100"
        onClick={() => setCollapsed(false)}
      >
        Dev
      </div>
    );
  }

  const setupPhaseActive = isSetupPhase(state);

  return (
    <div className="absolute bottom-2.5 left-2.5 z-1000 min-w-45 rounded-md border border-[#555] bg-[rgba(30,30,30,0.95)] p-3 text-[0.85rem] text-[#ccc]">
      <div className="mb-3 flex items-center justify-between font-bold text-white">
        <span>Dev Panel</span>
        <button
          className="h-5 w-5 cursor-pointer rounded border border-[#666] bg-transparent p-0 text-sm leading-none text-[#ccc] hover:bg-[#444]"
          onClick={() => setCollapsed(true)}
        >
          -
        </button>
      </div>

      <div className="mb-2 last:mb-0">
        <label className="flex items-center gap-2 text-[#999]">
          Phase:
          <span className="font-mono text-[#7cb7ff]">{state.phase}</span>
        </label>
      </div>

      {setupPhaseActive && (
        <div className="mb-2 last:mb-0">
          <button
            className="w-full cursor-pointer rounded bg-[#4a5568] px-3 py-1.5 text-[0.85rem] text-white hover:bg-[#5a6578] active:bg-[#3a4558]"
            onClick={handleAutoSetup}
          >
            Auto Setup
          </button>
        </div>
      )}

      <div className="mb-2 last:mb-0">
        <div className="mb-1 text-[0.7rem] tracking-[0.5px] text-[#888] uppercase">Card Selection</div>
        <div className="flex flex-col gap-1">
          <button
            className="w-full cursor-pointer rounded bg-[#4a4a2d] px-2 py-1 text-[0.75rem] text-[#d6d69e] hover:bg-[#5a5a3d]"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_CARD_SELECTION", player: "scientist" })}
          >
            Scientist Cards
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#4a4a2d] px-2 py-1 text-[0.75rem] text-[#d6d69e] hover:bg-[#5a5a3d]"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_CARD_SELECTION", player: "raptor" })}
          >
            Raptor Cards
          </button>
        </div>
      </div>

      <div className="mb-2 last:mb-0">
        <div className="mb-1 text-[0.7rem] tracking-[0.5px] text-[#888] uppercase">Action Phase</div>
        <div className="flex flex-col gap-1">
          <button
            className="w-full cursor-pointer rounded bg-[#4a3d2d] px-2 py-1 text-[0.75rem] text-[#d6b89e] hover:bg-[#5a4d3d]"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_ACTION", player: "scientist" })}
          >
            Scientist Actions (8)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#4a3d2d] px-2 py-1 text-[0.75rem] text-[#d6b89e] hover:bg-[#5a4d3d]"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_ACTION", player: "raptor" })}
          >
            Raptor Actions (8)
          </button>
        </div>
      </div>

      <div className="mb-2 last:mb-0">
        <div className="mb-1 text-[0.7rem] tracking-[0.5px] text-[#888] uppercase">Raptor Effects</div>
        <div className="flex flex-col gap-1">
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_1_mothers_call",
                scientistCard: "scientist_5_fire",
              })
            }
          >
            Mother's Call (1)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_4_mothers_call",
                scientistCard: "scientist_5_fire",
              })
            }
          >
            Mother's Call (2)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_2_disappearance",
                scientistCard: "scientist_5_fire",
              })
            }
          >
            Disappearance
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_3_fear", scientistCard: "scientist_5_fire" })
            }
          >
            Fear (1)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_8_fear", scientistCard: "scientist_9_none" })
            }
          >
            Fear (2)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_5_recovery",
                scientistCard: "scientist_9_none",
              })
            }
          >
            Recovery (2)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d4a3d] px-2 py-1 text-[0.75rem] text-[#9ed6b8] hover:bg-[#3d5a4d]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_7_recovery",
                scientistCard: "scientist_9_none",
              })
            }
          >
            Recovery (3)
          </button>
        </div>
      </div>

      <div className="mb-2 last:mb-0">
        <div className="mb-1 text-[0.7rem] tracking-[0.5px] text-[#888] uppercase">Scientist Effects</div>
        <div className="flex flex-col gap-1">
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_5_recovery",
                scientistCard: "scientist_1_sleeping_gas",
              })
            }
          >
            Sleep Gas (1)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_9_none",
                scientistCard: "scientist_4_sleeping_gas",
              })
            }
          >
            Sleep Gas (2)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_5_recovery",
                scientistCard: "scientist_2_reinforcements",
              })
            }
          >
            Reinforcements
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_5_fire" })
            }
          >
            Fire (2)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_7_fire" })
            }
          >
            Fire (3)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_3_jeep" })
            }
          >
            Jeep (2)
          </button>
          <button
            className="w-full cursor-pointer rounded bg-[#2d3d4a] px-2 py-1 text-[0.75rem] text-[#9eb8d6] hover:bg-[#3d4d5a]"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_8_jeep" })
            }
          >
            Jeep (4)
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevPanel;
