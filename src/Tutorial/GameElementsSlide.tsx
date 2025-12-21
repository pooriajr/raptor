import type { ReactNode } from "react";
import "../Piece.css";
import BoardView from "../BoardView.tsx";
import Tooltip from "../Tooltip.tsx";
import { buildSpaceActions } from "../utils/buildSpaceActions.ts";
import { createSpaceId, type SpaceId } from "../types/spaceActions.ts";
import { createGameElementsState } from "./gameElementsState.ts";

type TooltipPosition = "top" | "bottom" | "left" | "right";

const tutorialState = createGameElementsState();
const tutorialSpaceActions = buildSpaceActions(tutorialState);

const tooltipSpecs: Array<{ id: SpaceId; text: string; position: TooltipPosition }> = [
  {
    id: createSpaceId(0, 0, 2),
    text: "Baby raptors escape via 4 exit spaces",
    position: "top",
  },
  {
    id: createSpaceId(1, 1, 0),
    text: "Mountains blocks movement and line of sight",
    position: "top",
  },
  {
    id: createSpaceId(3, 2, 0),
    text: "Babies try to escape via exits",
    position: "top",
  },
  {
    id: createSpaceId(3, 2, 1),
    text: "Scientists set fires to blocks raptors",
    position: "bottom",
  },
  {
    id: createSpaceId(6, 0, 1),
    text: "Sleeping babies are vulnerable to capture",
    position: "left",
  },
  {
    id: createSpaceId(6, 1, 1),
    text: "Scientists work together to capture babies",
    position: "bottom",
  },
  {
    id: createSpaceId(6, 2, 1),
    text: "Mother kills scientists and saves babies",
    position: "top",
  },
];

const tutorialSpaceOverlays: Partial<Record<SpaceId, ReactNode>> = {};
const tutorialSpaceClasses: Partial<Record<SpaceId, string>> = {};

for (const { id, text, position } of tooltipSpecs) {
  tutorialSpaceClasses[id] = "z-[2000]";
  tutorialSpaceOverlays[id] = (
    <Tooltip variant="space" position={position}>
      {text}
    </Tooltip>
  );
}

function GameElementsSlide() {
  return (
    <div className="slide-content board-overview-full">
      <BoardView
        state={tutorialState}
        spaceActions={tutorialSpaceActions}
        spaceClassNames={tutorialSpaceClasses}
        spaceOverlays={tutorialSpaceOverlays}
      />
    </div>
  );
}

export default GameElementsSlide;
