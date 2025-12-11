import "./Board.css";
import Tile from "./Tile.tsx";
import { useEffect } from "react";
import { LayoutGroup } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";

function Board() {
  const { state, dispatch } = useGame();

  const currentPlayer = state.activePlayer;

  // Reset selected card when phase changes
  useEffect(() => {
    if (currentPlayer) {
      dispatch({ type: "SELECT_CARD", player: currentPlayer, card: null });
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="board-container">
      <LayoutGroup>
        <div className="Board">
          {state.tiles.map((tile) => (
            <Tile key={tile.id} tile={tile} />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default Board;
