import type { GameState, PieceState } from "../types/gameState.ts";

// Re-export commonly used helpers for external use
export { findById, getAllPieces } from "../utils/boardUtils.ts";
export type { ActionPhaseSavedState } from "./actionPhaseActions.ts";

// Import action handlers
import {
  handlePlaceScientist,
  handlePlaceMother,
  handlePlaceBaby,
  handleMovePiece,
  handleStartGame,
  type SetupAction,
} from "./setupActions.ts";

import {
  handlePlayerReady,
  handleDrawCards,
  handlePlayCard,
  handleConfirmReveal,
  type CardAction,
} from "./cardActions.ts";

import {
  handleFrightenScientists,
  handlePutBabiesToSleep,
  handleMothersCall,
  handleDisappearance,
  handleWakeBabies,
  handleReinforcements,
  handlePlaceFire,
  handleJeepMoves,
  handleEndEffectPhase,
  type EffectAction,
} from "./effectActions.ts";

import {
  handleActionMoveBaby,
  handleActionMoveScientist,
  handleActionMoveMother,
  handleMotherKillScientist,
  handleMotherWakeBaby,
  handleMotherExtinguishFire,
  handleScientistSleepBaby,
  handleScientistCaptureBaby,
  handleScientistShootMother,
  handleScientistStandUp,
  handleEndActionPhase,
  handleResetActionPhase,
  type ActionPhaseAction,
} from "./actionPhaseActions.ts";

// Dev action types
type DevAction =
  | { type: "DEV_SKIP_TO_EFFECT"; raptorCard: number; scientistCard: number }
  | { type: "DEV_SKIP_TO_ACTION"; player: "scientist" | "raptor" };

// Combined action type
export type GameAction =
  | SetupAction
  | CardAction
  | EffectAction
  | ActionPhaseAction
  | DevAction;

// Dev helper: auto-setup pieces if none placed
function devAutoSetup(state: GameState): GameState {
  if (state.mother || state.babies.length > 0) return state;

  let newState = { ...state };
  const squareTiles = newState.tiles.filter((t) => t.shape === "square");
  const lTiles = newState.tiles.filter((t) => t.shape === "L");

  // Place mother on tile 2
  const tile2 = squareTiles.find((t) => t.id === 2)!;
  const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;
  newState = {
    ...newState,
    mother: {
      id: "mother",
      type: "mother",
      tileId: 2,
      x: motherSpace.coordinate.x,
      y: motherSpace.coordinate.y,
    },
    holdingPen: { ...newState.holdingPen, mother: 0 },
  };

  // Place babies on other square tiles
  const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
  const newBabies: PieceState[] = [];
  let babyIndex = 0;
  for (const tile of tilesForBabies) {
    if (babyIndex >= 5) break;
    const space = tile.spaces.find((s) => !s.hasMountain)!;
    newBabies.push({
      id: `baby-${babyIndex}`,
      type: "baby",
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    });
    babyIndex++;
  }
  newState = {
    ...newState,
    babies: newBabies,
    holdingPen: { ...newState.holdingPen, babies: 0 },
  };

  // Place scientists on L-tiles
  const newScientists: PieceState[] = [];
  let scientistIndex = 0;
  for (const tile of lTiles) {
    if (scientistIndex >= 4) break;
    const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
    newScientists.push({
      id: `scientist-${scientistIndex}`,
      type: "scientist",
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    });
    scientistIndex++;
  }
  newState = {
    ...newState,
    scientists: newScientists,
    holdingPen: { ...newState.holdingPen, scientists: 0 },
  };

  return newState;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // Setup actions
    case "PLACE_SCIENTIST":
      return handlePlaceScientist(state, action);
    case "PLACE_MOTHER":
      return handlePlaceMother(state, action);
    case "PLACE_BABY":
      return handlePlaceBaby(state, action);
    case "MOVE_PIECE":
      return handleMovePiece(state, action);
    case "START_GAME":
      return handleStartGame(state);

    // Card actions
    case "PLAYER_READY":
      return handlePlayerReady(state, action);
    case "DRAW_CARDS":
      return handleDrawCards(state, action);
    case "PLAY_CARD":
      return handlePlayCard(state, action);
    case "CONFIRM_REVEAL":
      return handleConfirmReveal(state);

    // Effect actions
    case "FRIGHTEN_SCIENTISTS":
      return handleFrightenScientists(state, action);
    case "PUT_BABIES_TO_SLEEP":
      return handlePutBabiesToSleep(state, action);
    case "MOTHERS_CALL":
      return handleMothersCall(state, action);
    case "DISAPPEARANCE":
      return handleDisappearance(state);
    case "WAKE_BABIES":
      return handleWakeBabies(state, action);
    case "REINFORCEMENTS":
      return handleReinforcements(state, action);
    case "PLACE_FIRE":
      return handlePlaceFire(state, action);
    case "JEEP_MOVES":
      return handleJeepMoves(state, action);
    case "END_EFFECT_PHASE":
      return handleEndEffectPhase(state);

    // Action phase actions
    case "ACTION_MOVE_BABY":
      return handleActionMoveBaby(state, action);
    case "ACTION_MOVE_SCIENTIST":
      return handleActionMoveScientist(state, action);
    case "ACTION_MOVE_MOTHER":
      return handleActionMoveMother(state, action);
    case "ACTION_MOTHER_KILL_SCIENTIST":
      return handleMotherKillScientist(state, action);
    case "ACTION_MOTHER_WAKE_BABY":
      return handleMotherWakeBaby(state, action);
    case "ACTION_MOTHER_EXTINGUISH_FIRE":
      return handleMotherExtinguishFire(state, action);
    case "ACTION_SCIENTIST_SLEEP_BABY":
      return handleScientistSleepBaby(state, action);
    case "ACTION_SCIENTIST_CAPTURE_BABY":
      return handleScientistCaptureBaby(state, action);
    case "ACTION_SCIENTIST_SHOOT_MOTHER":
      return handleScientistShootMother(state, action);
    case "ACTION_SCIENTIST_STAND_UP":
      return handleScientistStandUp(state, action);
    case "END_ACTION_PHASE":
      return handleEndActionPhase(state);
    case "RESET_ACTION_PHASE":
      return handleResetActionPhase(state, action);

    // Dev actions
    case "DEV_SKIP_TO_EFFECT": {
      const newState = devAutoSetup(state);
      return {
        ...newState,
        phase: "EFFECT_PHASE",
        scientistCards: {
          ...newState.scientistCards,
          played: action.scientistCard,
          hand: newState.scientistCards.hand.filter(
            (c) => c !== action.scientistCard,
          ),
        },
        raptorCards: {
          ...newState.raptorCards,
          played: action.raptorCard,
          hand: newState.raptorCards.hand.filter(
            (c) => c !== action.raptorCard,
          ),
        },
      };
    }

    case "DEV_SKIP_TO_ACTION": {
      const newState = devAutoSetup(state);
      const raptorCard = action.player === "raptor" ? 9 : 1;
      const scientistCard = action.player === "scientist" ? 9 : 1;

      return {
        ...newState,
        phase: "ACTION_PHASE",
        scientistCards: {
          ...newState.scientistCards,
          played: scientistCard,
          hand: newState.scientistCards.hand.filter((c) => c !== scientistCard),
        },
        raptorCards: {
          ...newState.raptorCards,
          played: raptorCard,
          hand: newState.raptorCards.hand.filter((c) => c !== raptorCard),
        },
        actionPoints: 8,
        activePlayer: action.player,
      };
    }

    default:
      return state;
  }
}
