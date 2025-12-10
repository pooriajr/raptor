import Board from "./Board.tsx";
import PlayerArea from "./PlayerArea.tsx";
import CardRevealOverlay from "./CardRevealOverlay.tsx";
import PlayerReadyScreen from "./PlayerReadyScreen.tsx";
import DevPanel from "./DevPanel.tsx";
import { useGame } from "./state/GameContext.tsx";
import "./GameLayout.css";

function GameLayout() {
  const { state } = useGame();

  const layoutClassName = `game-layout${state.activePlayer ? ` active-${state.activePlayer}` : ""}`;

  return (
    <div className={layoutClassName}>
      <PlayerArea player="raptor" />
      <Board />
      <PlayerArea player="scientist" />

      {state.phase === "CARD_REVEAL" && <CardRevealOverlay />}
      {state.phase === "SCIENTIST_READY" && <PlayerReadyScreen player="scientist" />}
      {state.phase === "RAPTOR_READY" && <PlayerReadyScreen player="raptor" />}
      <DevPanel />
    </div>
  );
}

export default GameLayout;
