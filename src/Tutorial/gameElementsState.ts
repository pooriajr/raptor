import { createInitialGameState, type GameState } from "../types/gameState.ts";
import { createLShapedTile, createSquareTile, type Tile } from "../types/board.ts";

const tutorialTiles: Tile[] = [
  createLShapedTile(0, "left", "bottom"),
  createSquareTile(1, [
    { x: 1, y: 0 },
    { x: 0, y: 2 },
  ]),
  createSquareTile(2, [{ x: 2, y: 0 }]),
  createSquareTile(3, [
    { x: 0, y: 1 },
    { x: 1, y: 2 },
  ]),
  createLShapedTile(4, "right", "top"),
  createLShapedTile(5, "left", "top"),
  createSquareTile(6, [
    { x: 2, y: 0 },
    { x: 1, y: 2 },
  ]),
  createSquareTile(7, [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
  ]),
  createSquareTile(8, [
    { x: 1, y: 0 },
    { x: 0, y: 2 },
  ]),
  createLShapedTile(9, "right", "bottom"),
];

export function createGameElementsState(): GameState {
  const baseState = createInitialGameState();
  const babies = { ...baseState.babies };
  const scientists = { ...baseState.scientists };

  const placeBaby = (id: string, tileId: number, x: number, y: number, isAsleep = false) => {
    babies[id] = {
      ...babies[id],
      position: { tileId, x, y },
      isAsleep,
      isEscaped: false,
      isCaptured: false,
      asleepThisRound: false,
    };
  };

  const placeScientist = (id: string, tileId: number, x: number, y: number) => {
    scientists[id] = {
      ...scientists[id],
      position: { tileId, x, y },
      isDead: false,
      isFrightened: false,
      hasUsedAggressiveAction: false,
      frightenedThisRound: false,
    };
  };

  placeBaby("baby-0", 0, 1, 2);
  placeBaby("baby-1", 2, 0, 1);
  placeBaby("baby-2", 3, 2, 0);
  placeBaby("baby-3", 6, 0, 1, true);
  placeBaby("baby-4", 8, 1, 1);

  placeScientist("scientist-0", 1, 1, 1);
  placeScientist("scientist-1", 3, 1, 1);
  placeScientist("scientist-2", 6, 1, 1);
  placeScientist("scientist-3", 7, 1, 0);
  placeScientist("scientist-4", 9, 0, 2);

  return {
    ...baseState,
    phase: "MAIN_MENU",
    tiles: tutorialTiles,
    mother: {
      ...baseState.mother,
      position: { tileId: 6, x: 2, y: 1 },
      lastPosition: null,
      sleepTokens: 0,
      paidWoundCost: false,
      disappeared: false,
      observationActive: false,
    },
    babies,
    scientists,
    fireTokens: [
      { id: "fire-0", tileId: 3, x: 2, y: 1 },
      { id: "fire-1", tileId: 4, x: 0, y: 0 },
      { id: "fire-2", tileId: 4, x: 0, y: 1 },
    ],
    activeEffectCard: null,
    actionPoints: 0,
    activePlayer: "raptor",
    winner: null,
    winCondition: null,
    effectActionsRemaining: 0,
    undoSnapshot: null,
  };
}
