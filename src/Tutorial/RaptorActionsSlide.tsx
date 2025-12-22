import { LayoutGroup } from "framer-motion";
import ActionSection from "./ActionSection";
import BoardView from "../BoardView";
import { createInitialGameState } from "../types/gameState";
import { createLShapedTile, createSquareTile } from "../types/board";
import { createSpaceId, type SpaceActions } from "../types/spaceActions";
import type { GameState } from "../types/gameState";

const RAPTOR_ACTIONS = [
  {
    name: "Move a baby raptor",
    description:
      "For one action point, move a baby raptor to a free adjacent space. If by doing so the baby is placed on one of the half-spaces of an L-shaped tile, it escapes; remove the figurine from the board.",
    visual: <BabyMoveActionVisual />,
  },
  {
    name: "Move the mother raptor",
    description:
      "For one action point, move the mother raptor in a straight line as many spaces as you like, or until she runs into an obstacle (i.e. a rock, a fire token, or another figurine). If the mother is wounded: Before moving the mother raptor, lose as many action points as the number of sleep tokens on your player aid.",
    visual: <MotherMoveActionVisual />,
  },
  {
    name: "Kill a scientist",
    description:
      "For one action point, kill a scientist located on a space adjacent to the mother raptor; remove the scientist figurine from the board and return it to the box. Only the mother can kill scientists.",
    visual: <KillScientistActionVisual />,
  },
  {
    name: "Wake up a baby raptor",
    description:
      "For one action point, wake up a sleeping baby raptor located on a space adjacent to the mother raptor. You cannot wake up a baby raptor the same round it was put to sleep by a scientist.",
  },
  {
    name: "Put out a fire",
    description:
      "For one action point, put out a fire located on a space adjacent to the mother raptor; remove the fire token and all fire tokens connected to it orthogonally.",
  },
];

function createBabyMoveState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createLShapedTile(0, "left", "top"), createSquareTile(1, [])];
  const babyId = "baby-1";

  const state: GameState = {
    ...baseState,
    tiles,
    mother: {
      ...baseState.mother,
      position: null,
      lastPosition: null,
    },
    babies: {
      ...baseState.babies,
      [babyId]: {
        ...baseState.babies[babyId],
        position: { tileId: 0, x: 1, y: 0 },
      },
    },
    activePlayer: "raptor",
    raptorInteraction: {
      ...baseState.raptorInteraction,
      selectedActorId: babyId,
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(0, 0, 0), { style: "selectable" }],
    [createSpaceId(0, 1, 1), { style: "selectable" }],
    [createSpaceId(0, 1, 0), { style: "selected" }],
    [createSpaceId(1, 0, 0), { style: "selectable" }],
  ]);

  return { state, spaceActions };
}

function BabyMoveActionVisual() {
  const { state, spaceActions } = createBabyMoveState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-baby-move">
        <BoardView
          state={state}
          spaceActions={spaceActions}
          className="justify-start"
          boardClassName="gap-1.5 p-3 [transform:none]"
        />
      </LayoutGroup>
    </div>
  );
}

function createMotherMoveState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, []), createSquareTile(1, []), createSquareTile(2, []), createSquareTile(3, [])];
  const babyId = "baby-0";
  const scientistId = "scientist-0";

  const state: GameState = {
    ...baseState,
    tiles,
    mother: {
      ...baseState.mother,
      position: { tileId: 1, x: 1, y: 1 },
    },
    babies: {
      ...baseState.babies,
      [babyId]: {
        ...baseState.babies[babyId],
        position: { tileId: 0, x: 2, y: 1 },
      },
    },
    scientists: {
      ...baseState.scientists,
      [scientistId]: {
        ...baseState.scientists[scientistId],
        position: { tileId: 3, x: 1, y: 1 },
      },
    },
    activePlayer: "raptor",
    raptorInteraction: {
      ...baseState.raptorInteraction,
      selectedActorId: "mother",
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(1, 1, 1), { style: "selected" }],
    [createSpaceId(1, 1, 0), { style: "selectable" }],
    [createSpaceId(1, 1, 2), { style: "selectable" }],
    [createSpaceId(1, 0, 1), { style: "selectable" }],
    [createSpaceId(1, 2, 1), { style: "selectable" }],
    [createSpaceId(2, 0, 1), { style: "selectable" }],
    [createSpaceId(2, 1, 1), { style: "selectable" }],
    [createSpaceId(2, 2, 1), { style: "selectable" }],
    [createSpaceId(3, 0, 1), { style: "selectable" }],
  ]);

  return { state, spaceActions };
}

function MotherMoveActionVisual() {
  const { state, spaceActions } = createMotherMoveState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-mother-move">
        <BoardView
          state={state}
          spaceActions={spaceActions}
          className="justify-start"
          boardClassName="gap-1.5 p-3 [transform:none]"
        />
      </LayoutGroup>
    </div>
  );
}

function createKillScientistState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, [])];
  const scientistId = "scientist-1";

  const state: GameState = {
    ...baseState,
    tiles,
    mother: {
      ...baseState.mother,
      position: { tileId: 0, x: 1, y: 1 },
    },
    scientists: {
      ...baseState.scientists,
      [scientistId]: {
        ...baseState.scientists[scientistId],
        position: { tileId: 0, x: 0, y: 1 },
      },
    },
    activePlayer: "raptor",
    raptorInteraction: {
      ...baseState.raptorInteraction,
      selectedActorId: "mother",
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(0, 1, 1), { style: "selected" }],
    [createSpaceId(0, 0, 1), { style: "hostileTarget" }],
  ]);

  return { state, spaceActions };
}

function KillScientistActionVisual() {
  const { state, spaceActions } = createKillScientistState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-kill-scientist">
        <BoardView
          state={state}
          spaceActions={spaceActions}
          className="justify-start"
          boardClassName="gap-1.5 p-3 [transform:none]"
        />
      </LayoutGroup>
    </div>
  );
}

function RaptorActionsSlide() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4">
        <ActionSection
          variant="raptor"
          title="Raptor Actions"
          intro="You can spend action points to perform actions using the mother raptor and any active baby raptors. A baby raptor is active if its figurine is standing up. A raptor can never move to or move through a space occupied by a fire token."
          actions={RAPTOR_ACTIONS}
        />
      </div>
    </div>
  );
}

export default RaptorActionsSlide;
