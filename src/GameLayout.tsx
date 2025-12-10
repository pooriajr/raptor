import { useState } from "react";
import Board from "./Board.tsx";
import PlayerArea from "./PlayerArea.tsx";
import CardRevealOverlay from "./CardRevealOverlay.tsx";
import PlayerReadyScreen from "./PlayerReadyScreen.tsx";
import DevPanel from "./DevPanel.tsx";
import { useGame } from "./state/GameContext.tsx";
import { isMotherPlaced, countPlacedBabies, countPlacedScientists } from "./utils/pieceUtils.ts";
import {
  getEffectPlayer,
  getEffectInstruction,
  isEffectConfirmEnabled,
  shouldShowEffectUndo,
  getCurrentEffectType,
} from "./utils/effectUtils.ts";
import { hasSavedGame, loadGame } from "./utils/saveLoad.ts";
import "./GameLayout.css";

function GameLayout() {
  const { state, dispatch } = useGame();
  const [showCoordinates, setShowCoordinates] = useState(false);

  // Helper to get current player based on phase
  const getCurrentPlayer = (): "raptor" | "scientist" | null => {
    if (state.phase === "RAPTOR_CARD_SELECTION" || state.phase === "RAPTOR_SETUP") return "raptor";
    if (state.phase === "SCIENTIST_CARD_SELECTION" || state.phase === "SCIENTIST_SETUP") return "scientist";
    if (state.phase === "EFFECT_PHASE") {
      return getEffectPlayer(state);
    }
    if (state.phase === "ACTION_PHASE") return state.activePlayer;
    return null;
  };

  const currentPlayer = getCurrentPlayer();
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
  const selectedCard = interaction.selectedCard;

  // Handle setup confirm
  const handleSetupConfirm = () => {
    if (state.phase === "RAPTOR_SETUP") {
      dispatch({ type: "CONFIRM_RAPTOR_SETUP" });
    } else if (state.phase === "SCIENTIST_SETUP") {
      dispatch({ type: "START_GAME" });
    }
  };

  // Handle card confirm
  const handleCardConfirm = () => {
    if (selectedCard === null) return;

    const player =
      state.phase === "SCIENTIST_CARD_SELECTION"
        ? "scientist"
        : state.phase === "RAPTOR_CARD_SELECTION"
          ? "raptor"
          : null;

    if (player) {
      dispatch({ type: "PLAY_CARD", player, card: selectedCard });
      dispatch({ type: "SELECT_CARD", player, card: null });
    }
  };

  // Handle effect confirm
  const handleEffectConfirm = () => {
    const effectType = getCurrentEffectType(state);
    const player = currentPlayer;
    const effectInteraction = player === "raptor" ? state.raptorInteraction : state.scientistInteraction;

    if (effectType === "fear") {
      dispatch({
        type: "FRIGHTEN_SCIENTISTS",
        pieceIds: effectInteraction.selectedEffectTargets,
      });
      if (player) dispatch({ type: "SET_EFFECT_TARGETS", player, pieceIds: [] });
    } else if (effectType === "sleeping_gas") {
      dispatch({
        type: "PUT_BABIES_TO_SLEEP",
        pieceIds: effectInteraction.selectedEffectTargets,
      });
      if (player) dispatch({ type: "SET_EFFECT_TARGETS", player, pieceIds: [] });
    } else if (effectType === "recovery") {
      dispatch({
        type: "WAKE_BABIES",
        pieceIds: effectInteraction.selectedEffectTargets,
      });
      if (player) dispatch({ type: "SET_EFFECT_TARGETS", player, pieceIds: [] });
    } else if (effectType === "mothers_call") {
      dispatch({
        type: "MOTHERS_CALL",
        moves: effectInteraction.pendingMothersCallMoves,
      });
      if (player) {
        dispatch({ type: "CLEAR_MOTHERS_CALL_MOVES", player });
        dispatch({ type: "SELECT_BABY_FOR_CALL", player, babyId: null });
      }
    } else if (effectType === "disappearance") {
      dispatch({ type: "DISAPPEARANCE" });
    } else if (effectType === "reinforcements") {
      dispatch({
        type: "REINFORCEMENTS",
        placements: effectInteraction.pendingReinforcementPlacements,
      });
      if (player) dispatch({ type: "CLEAR_REINFORCEMENTS", player });
    } else if (effectType === "fire") {
      dispatch({
        type: "PLACE_FIRE",
        placements: effectInteraction.pendingFirePlacements,
      });
      if (player) dispatch({ type: "CLEAR_FIRE_PLACEMENTS", player });
    } else if (effectType === "jeep") {
      dispatch({
        type: "JEEP_MOVES",
        moves: effectInteraction.pendingJeepMoves,
      });
      if (player) {
        dispatch({ type: "CLEAR_JEEP_MOVES", player });
        dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player, scientistId: null });
      }
    }
  };

  // Handle effect undo
  const handleEffectUndo = () => {
    const effectType = getCurrentEffectType(state);
    if (effectType === "fire" && currentPlayer) {
      dispatch({ type: "CLEAR_FIRE_PLACEMENTS", player: currentPlayer });
    } else if (effectType === "jeep" && currentPlayer) {
      dispatch({ type: "CLEAR_JEEP_MOVES", player: currentPlayer });
      dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player: currentPlayer, scientistId: null });
    }
  };

  // Handle action reset
  const handleActionReset = () => {
    if (state.actionPhaseSavedState) {
      dispatch({
        type: "RESET_ACTION_PHASE",
        savedState: state.actionPhaseSavedState,
      });
      if (currentPlayer) {
        dispatch({ type: "SELECT_ACTION_PIECE", player: currentPlayer, pieceId: null });
      }
    }
  };

  // Handle loading saved game
  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  // Helper to get action phase instruction
  const getActionInstruction = () => {
    if (state.actionPoints === 0) {
      return "No action points remaining";
    }
    if (state.activePlayer === "raptor") {
      return "Select a piece, then click to move or act";
    } else {
      return "Select a scientist, then click to move or act";
    }
  };

  // Check if any actions have been taken this action phase
  const hasActionsTaken =
    state.actionPhaseSavedState !== null && state.actionPoints < state.actionPhaseSavedState.actionPoints;

  // Check if saved game exists (only check during setup phases)
  const showLoadButton = (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") && hasSavedGame();

  const layoutClassName = `game-layout${state.activePlayer ? ` active-${state.activePlayer}` : ""}`;

  return (
    <div className={layoutClassName}>
      {/* Raptor player area (top) */}
      <PlayerArea
        player="raptor"
        actionInfo={
          state.phase === "RAPTOR_SETUP"
            ? {
                phaseLabel: "Raptor Setup",
                progress: (
                  <>
                    <span>🦖 {isMotherPlaced(state) ? "1" : "0"}/1</span>
                    <span>🦎 {countPlacedBabies(state)}/5</span>
                  </>
                ),
                instruction: !isMotherPlaced(state)
                  ? "Place mother on center tile"
                  : countPlacedBabies(state) < 5
                    ? "Place babies on square tiles"
                    : "Setup complete!",
              }
            : state.phase === "RAPTOR_CARD_SELECTION"
              ? {
                  phaseLabel: "Pick a Card",
                  instruction: selectedCard ? `Card ${selectedCard} selected` : "Select a card from your hand",
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer(state) === "raptor"
                ? {
                    phaseLabel: "Effect Phase",
                    instruction: getEffectInstruction(state, "raptor"),
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "raptor"
                  ? {
                      phaseLabel: "Action Phase",
                      instruction: getActionInstruction(),
                      actionPoints: state.actionPoints,
                    }
                  : undefined
        }
        actionButton={
          state.phase === "RAPTOR_SETUP"
            ? {
                disabled: !isMotherPlaced(state) || countPlacedBabies(state) < 5,
                onClick: handleSetupConfirm,
              }
            : state.phase === "RAPTOR_CARD_SELECTION"
              ? {
                  disabled: selectedCard === null,
                  onClick: handleCardConfirm,
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer(state) === "raptor"
                ? {
                    disabled: !isEffectConfirmEnabled(state, "raptor"),
                    onClick: handleEffectConfirm,
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "raptor"
                  ? {
                      disabled: false,
                      onClick: () => dispatch({ type: "END_ACTION_PHASE" }),
                    }
                  : {
                      disabled: true,
                      onClick: () => {},
                      isDone: true,
                    }
        }
        undoButton={
          state.phase === "EFFECT_PHASE" && getEffectPlayer(state) === "raptor" && shouldShowEffectUndo(state, "raptor")
            ? { onClick: handleEffectUndo }
            : state.phase === "ACTION_PHASE" && state.activePlayer === "raptor" && hasActionsTaken
              ? { onClick: handleActionReset, label: "Reset" }
              : undefined
        }
        loadButton={state.phase === "RAPTOR_SETUP" && showLoadButton ? { onClick: handleLoadGame } : undefined}
      />

      {/* Game board */}
      <Board showCoordinates={showCoordinates} />

      {/* Scientist player area (bottom) */}
      <PlayerArea
        player="scientist"
        actionInfo={
          state.phase === "SCIENTIST_SETUP"
            ? {
                phaseLabel: "Scientist Setup",
                progress: <span>🧑‍🔬 {countPlacedScientists(state)}/4</span>,
                instruction: countPlacedScientists(state) < 4 ? "Place scientists on L-tiles" : "Setup complete!",
              }
            : state.phase === "SCIENTIST_CARD_SELECTION"
              ? {
                  phaseLabel: "Pick a Card",
                  instruction: selectedCard ? `Card ${selectedCard} selected` : "Select a card from your hand",
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer(state) === "scientist"
                ? {
                    phaseLabel: "Effect Phase",
                    instruction: getEffectInstruction(state, "scientist"),
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "scientist"
                  ? {
                      phaseLabel: "Action Phase",
                      instruction: getActionInstruction(),
                      actionPoints: state.actionPoints,
                    }
                  : undefined
        }
        actionButton={
          state.phase === "SCIENTIST_SETUP"
            ? {
                disabled: countPlacedScientists(state) < 4,
                onClick: handleSetupConfirm,
              }
            : state.phase === "SCIENTIST_CARD_SELECTION"
              ? {
                  disabled: selectedCard === null,
                  onClick: handleCardConfirm,
                }
              : state.phase === "EFFECT_PHASE" && getEffectPlayer(state) === "scientist"
                ? {
                    disabled: !isEffectConfirmEnabled(state, "scientist"),
                    onClick: handleEffectConfirm,
                  }
                : state.phase === "ACTION_PHASE" && state.activePlayer === "scientist"
                  ? {
                      disabled: false,
                      onClick: () => dispatch({ type: "END_ACTION_PHASE" }),
                    }
                  : {
                      disabled: true,
                      onClick: () => {},
                      isDone: true,
                    }
        }
        undoButton={
          state.phase === "EFFECT_PHASE" &&
          getEffectPlayer(state) === "scientist" &&
          shouldShowEffectUndo(state, "scientist")
            ? { onClick: handleEffectUndo }
            : state.phase === "ACTION_PHASE" && state.activePlayer === "scientist" && hasActionsTaken
              ? { onClick: handleActionReset, label: "Reset" }
              : undefined
        }
      />

      {state.phase === "CARD_REVEAL" && <CardRevealOverlay />}
      {state.phase === "SCIENTIST_READY" && <PlayerReadyScreen player="scientist" />}
      {state.phase === "RAPTOR_READY" && <PlayerReadyScreen player="raptor" />}
      <DevPanel showCoordinates={showCoordinates} onToggleCoordinates={setShowCoordinates} />
    </div>
  );
}

export default GameLayout;
