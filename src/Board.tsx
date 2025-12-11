import "./Board.css";
import Tile from "./Tile.tsx";
import { useEffect, useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import type { PieceState } from "./types/gameState.ts";
import { buildHighlights, getValidSetupTileIds } from "./utils/buildHighlights.ts";
import { getCurrentEffectType } from "./utils/effectUtils.ts";

function Board() {
  const { state, dispatch } = useGame();

  const currentPlayer = state.activePlayer;
  const prevPhaseRef = useRef(state.phase);

  // Reset selected card when phase changes
  useEffect(() => {
    if (currentPlayer) {
      dispatch({ type: "SELECT_CARD", player: currentPlayer, card: null });
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw cards when entering card selection phases
  useEffect(() => {
    const phaseChanged = state.phase !== prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (!phaseChanged) return;

    const isScientistSelection = state.phase === "SCIENTIST_CARD_SELECTION";
    const isRaptorSelection = state.phase === "RAPTOR_CARD_SELECTION";

    if (isScientistSelection || isRaptorSelection) {
      const player = isScientistSelection ? "scientist" : "raptor";

      dispatch({ type: "DRAW_CARDS", player });
      dispatch({ type: "SET_NEW_DRAW", player, isNewDraw: true });
      const timeout = setTimeout(() => {
        dispatch({ type: "SET_NEW_DRAW", player, isNewDraw: false });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.phase, dispatch]);

  // Helper to find a piece by ID
  const findPieceById = (id: string): PieceState | undefined => {
    if (state.mother?.id === id) return state.mother;
    const baby = state.babies.find((b) => b.id === id);
    if (baby) return baby;
    return state.scientists.find((s) => s.id === id);
  };

  // Reset interactions when leaving effect/action phases
  useEffect(() => {
    if (state.phase !== "EFFECT_PHASE" && state.phase !== "ACTION_PHASE") {
      dispatch({ type: "RESET_ALL_INTERACTIONS" });
    }
  }, [state.phase, dispatch]);

  // Save state when entering action phase, reset when leaving
  useEffect(() => {
    if (state.phase === "ACTION_PHASE") {
      if (state.actionPhaseSavedState === null) {
        dispatch({ type: "SAVE_ACTION_PHASE_STATE", savedState: state });
      }
    } else {
      if (currentPlayer) {
        dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId: null });
      }
      dispatch({ type: "CLEAR_ACTION_PHASE_STATE" });
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dispatch effects that require no user input
  useEffect(() => {
    if (state.phase === "EFFECT_PHASE") {
      const scientistCard = state.scientistCards.played;
      const raptorCard = state.raptorCards.played;
      if (scientistCard !== null && raptorCard !== null) {
        const raptorHasEffect = raptorCard < scientistCard;
        if (raptorHasEffect && (raptorCard === 2 || raptorCard === 6)) {
          dispatch({ type: "DISAPPEARANCE" });
        }
      }
    }
  }, [state.phase, state.scientistCards.played, state.raptorCards.played, dispatch]);

  // Auto-dispatch round end
  useEffect(() => {
    if (state.phase === "ROUND_END") {
      dispatch({ type: "END_ROUND" });
    }
  }, [state.phase, dispatch]);

  // Handle piece interactions - returns true if handled
  const handlePieceInteraction = (pieceId: string): boolean => {
    // Handle effect phase targeting (immediate execution for simple effects)
    if (state.phase === "EFFECT_PHASE" && state.effectActionsRemaining > 0) {
      const effectType = getCurrentEffectType(state);
      const piece = findPieceById(pieceId);
      if (!piece) return false;

      if (effectType === "fear" && piece.type === "scientist" && !piece.isFrightened) {
        dispatch({ type: "FRIGHTEN_SCIENTIST", pieceId });
        return true;
      }
      if (effectType === "sleeping_gas" && piece.type === "baby" && !piece.isAsleep) {
        dispatch({ type: "PUT_BABY_TO_SLEEP", pieceId });
        return true;
      }
      if (effectType === "recovery" && piece.type === "baby" && piece.isAsleep) {
        dispatch({ type: "WAKE_BABY", pieceId });
        return true;
      }
      // Mother's Call, Jeep, and Recovery (mother) are handled via highlights
      return false;
    }

    // Handle action phase
    if (state.phase === "ACTION_PHASE") {
      const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
      const selectedActorId = interaction.selectedActorId;
      const piece = findPieceById(pieceId);
      if (!piece) return false;

      // Check if piece can be controlled
      const canControl =
        (state.activePlayer === "raptor" && (piece.type === "baby" || piece.type === "mother")) ||
        (state.activePlayer === "scientist" && piece.type === "scientist");

      if (!canControl) return false;
      if (piece.type === "baby" && piece.isAsleep) return false;

      // Frightened scientist standing up
      if (piece.type === "scientist" && piece.isFrightened) {
        if (state.actionPoints > 0 && !state.frightenedThisRound.includes(pieceId)) {
          dispatch({ type: "ACTION_SCIENTIST_STAND_UP", scientistId: pieceId });
          if (currentPlayer) {
            dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId });
          }
        }
        return true;
      }

      // Toggle selection
      if (currentPlayer) {
        if (selectedActorId === pieceId) {
          dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId: null });
        } else {
          dispatch({ type: "SELECT_ACTOR", player: currentPlayer, pieceId });
        }
      }
      return true;
    }

    return false;
  };

  // Build highlights from state
  const highlights = buildHighlights(state);
  const validSetupTileIds = getValidSetupTileIds(state);

  // Unified space click handler
  const handleSpaceClick = (tileId: number, x: number, y: number, pieceId: string | null) => {
    const spaceId = `${tileId}-${x}-${y}`;

    // Setup phase: clicking on a placed piece removes it
    if (state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP") {
      if (pieceId) {
        const isRaptorPiece = pieceId === "mother" || pieceId.startsWith("baby-");
        const isScientistPiece = pieceId.startsWith("scientist-");
        if (
          (state.phase === "RAPTOR_SETUP" && isRaptorPiece) ||
          (state.phase === "SCIENTIST_SETUP" && isScientistPiece)
        ) {
          dispatch({ type: "REMOVE_PIECE", pieceId });
          return;
        }
        return;
      }
    }

    // Check if space has a highlight with action
    const highlight = highlights.get(spaceId);
    if (highlight?.action) {
      dispatch(highlight.action);
      return;
    }

    // Handle piece interactions
    if (pieceId) {
      handlePieceInteraction(pieceId);
    }
  };

  return (
    <div className="board-container">
      <LayoutGroup>
        <div className="Board">
          {state.tiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              highlights={highlights}
              isValidSetupTile={validSetupTileIds.has(tile.id)}
              showCoordinates={state.showCoordinates}
              onSpaceClick={handleSpaceClick}
            />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default Board;
