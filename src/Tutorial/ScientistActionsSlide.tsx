import { LayoutGroup } from "framer-motion";
import ActionSection from "./ActionSection";
import BoardView from "../BoardView";
import { createInitialGameState } from "../types/gameState";
import { createSquareTile } from "../types/board";
import { createSpaceId, type SpaceActions } from "../types/spaceActions";
import type { GameState } from "../types/gameState";

function createScientistState(
  id: string,
  position: { tileId: number; x: number; y: number } | null,
  overrides?: Partial<{
    isDead: boolean;
    isFrightened: boolean;
    hasUsedAggressiveAction: boolean;
    frightenedThisRound: boolean;
  }>,
) {
  return {
    id,
    position,
    isDead: false,
    isFrightened: false,
    hasUsedAggressiveAction: false,
    frightenedThisRound: false,
    ...overrides,
  };
}

function createBabyState(
  id: string,
  position: { tileId: number; x: number; y: number } | null,
  overrides?: Partial<{
    isAsleep: boolean;
    isEscaped: boolean;
    isCaptured: boolean;
    asleepThisRound: boolean;
  }>,
) {
  return {
    id,
    position,
    isAsleep: false,
    isEscaped: false,
    isCaptured: false,
    asleepThisRound: false,
    ...overrides,
  };
}

const SCIENTIST_ACTIONS = [
  {
    name: "Move a scientist",
    description:
      "For one action point, move a scientist to an adjacent space that is not occupied by a raptor or another scientist.",
    visual: <MoveScientistActionVisual />,
  },
  {
    name: "Stand a scientist back up",
    description:
      "For one action point, stand a frightened scientist's figurine back up. You cannot stand a scientist back up the same round it was frightened.",
    visual: <StandScientistActionVisual />,
  },
  {
    name: "Put a baby raptor to sleep",
    description:
      "For one action point, shoot a baby raptor located on a space adjacent to a scientist to put it to sleep.",
    visual: <PutBabyToSleepActionVisual />,
  },
  {
    name: "Capture a sleeping baby raptor",
    description:
      "For one action point, capture a sleeping baby raptor located on a space adjacent to a scientist; remove its figurine from the board.",
    visual: <CaptureBabyActionVisual />,
  },
  {
    name: "Shoot the mother raptor",
    description:
      "For one action point, use an active scientist to shoot the mother raptor. Scientists can shoot orthogonally in a straight line as far as desired, as long as there are no obstacles between the scientist and the mother raptor. Obstacles that block shooting are rocks and active scientists.",
    visual: <ShootMotherActionVisual />,
  },
];

function createMoveScientistState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, [])];
  const scientistId = "scientist-move";

  const state: GameState = {
    ...baseState,
    tiles,
    scientists: {
      ...baseState.scientists,
      [scientistId]: createScientistState(scientistId, { tileId: 0, x: 1, y: 1 }),
    },
    activePlayer: "scientist",
    scientistInteraction: {
      ...baseState.scientistInteraction,
      selectedActorId: scientistId,
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(0, 1, 1), { style: "selected" }],
    [createSpaceId(0, 0, 1), { style: "selectable" }],
    [createSpaceId(0, 2, 1), { style: "selectable" }],
    [createSpaceId(0, 1, 0), { style: "selectable" }],
    [createSpaceId(0, 1, 2), { style: "selectable" }],
  ]);

  return { state, spaceActions };
}

function MoveScientistActionVisual() {
  const { state, spaceActions } = createMoveScientistState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-scientist-move">
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

function createStandScientistState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, [])];
  const scientistId = "scientist-stand";

  const state: GameState = {
    ...baseState,
    tiles,
    scientists: {
      ...baseState.scientists,
      [scientistId]: createScientistState(scientistId, { tileId: 0, x: 1, y: 1 }, { isFrightened: true }),
    },
    activePlayer: "scientist",
    scientistInteraction: {
      ...baseState.scientistInteraction,
      selectedActorId: scientistId,
    },
  };

  const spaceActions: SpaceActions = new Map([[createSpaceId(0, 1, 1), { style: "selected" }]]);

  return { state, spaceActions };
}

function StandScientistActionVisual() {
  const { state, spaceActions } = createStandScientistState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-scientist-stand">
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

function createPutBabyToSleepState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, [])];
  const scientistId = "scientist-sleep";
  const babyId = "baby-sleep";

  const state: GameState = {
    ...baseState,
    tiles,
    scientists: {
      ...baseState.scientists,
      [scientistId]: createScientistState(scientistId, { tileId: 0, x: 1, y: 1 }),
    },
    babies: {
      ...baseState.babies,
      [babyId]: createBabyState(babyId, { tileId: 0, x: 0, y: 1 }),
    },
    activePlayer: "scientist",
    scientistInteraction: {
      ...baseState.scientistInteraction,
      selectedActorId: scientistId,
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(0, 1, 1), { style: "selected" }],
    [createSpaceId(0, 0, 1), { style: "hostileTarget" }],
  ]);

  return { state, spaceActions };
}

function PutBabyToSleepActionVisual() {
  const { state, spaceActions } = createPutBabyToSleepState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-scientist-sleep">
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

function createCaptureBabyState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, [])];
  const scientistId = "scientist-capture";
  const babyId = "baby-capture";

  const state: GameState = {
    ...baseState,
    tiles,
    scientists: {
      ...baseState.scientists,
      [scientistId]: createScientistState(scientistId, { tileId: 0, x: 1, y: 1 }),
    },
    babies: {
      ...baseState.babies,
      [babyId]: createBabyState(babyId, { tileId: 0, x: 0, y: 1 }, { isAsleep: true }),
    },
    activePlayer: "scientist",
    scientistInteraction: {
      ...baseState.scientistInteraction,
      selectedActorId: scientistId,
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(0, 1, 1), { style: "selected" }],
    [createSpaceId(0, 0, 1), { style: "hostileTarget" }],
  ]);

  return { state, spaceActions };
}

function CaptureBabyActionVisual() {
  const { state, spaceActions } = createCaptureBabyState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-scientist-capture">
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

function createShootMotherState(): { state: GameState; spaceActions: SpaceActions } {
  const baseState = createInitialGameState();
  const tiles = [createSquareTile(0, []), createSquareTile(1, []), createSquareTile(2, [])];
  const scientistId = "scientist-shoot";
  const motherId = "mother-shot";
  const babyId = "baby-shot";

  const state: GameState = {
    ...baseState,
    tiles,
    mother: {
      ...baseState.mother,
      id: motherId,
      position: { tileId: 2, x: 1, y: 1 },
    },
    scientists: {
      ...baseState.scientists,
      [scientistId]: createScientistState(scientistId, { tileId: 0, x: 1, y: 1 }),
    },
    babies: {
      ...baseState.babies,
      [babyId]: createBabyState(babyId, { tileId: 1, x: 1, y: 1 }),
    },
    activePlayer: "scientist",
    scientistInteraction: {
      ...baseState.scientistInteraction,
      selectedActorId: scientistId,
    },
  };

  const spaceActions: SpaceActions = new Map([
    [createSpaceId(0, 1, 1), { style: "selected" }],
    [createSpaceId(2, 1, 1), { style: "hostileTarget" }],
  ]);

  return { state, spaceActions };
}

function ShootMotherActionVisual() {
  const { state, spaceActions } = createShootMotherState();

  return (
    <div className="flex w-full justify-start">
      <LayoutGroup id="tutorial-scientist-shoot">
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

function ScientistActionsSlide() {
  return (
    <div className="h-full">
      <div className="flex flex-col gap-4">
        <ActionSection
          variant="scientist"
          title="Scientist Actions"
          intro="You can spend action points to perform actions using any active scientist. A scientist is active if its figurine is standing up. Scientists can move through and shoot through fire, but you cannot end the turn with any scientist standing on a fire space."
          important="Each scientist can perform ONLY ONE aggressive action (shoot or capture) per round."
          actions={SCIENTIST_ACTIONS}
        />
      </div>
    </div>
  );
}

export default ScientistActionsSlide;
