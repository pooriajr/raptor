import { useCallback, useEffect } from "react";
import { useGame } from "../state/GameContext";
import { countPlacedScientists } from "../utils/pieceUtils";
import { getEffectPlayer } from "../utils/effectUtils";
import { isRaptorSetupComplete } from "../utils/boardUtils";
import { hasScientistOnFire } from "../utils/fireUtils";

interface DoneButtonProps {
  player: "raptor" | "scientist";
}

function DoneButton({ player }: DoneButtonProps) {
  const { state, dispatch } = useGame();
  const isRaptor = player === "raptor";

  const interaction = isRaptor ? state.raptorInteraction : state.scientistInteraction;
  const selectedCard = interaction.selectedCard;

  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  const isThisPlayerSetup =
    (isRaptor && state.phase === "RAPTOR_SETUP") || (!isRaptor && state.phase === "SCIENTIST_SETUP");

  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;
  const isMotherReturn = state.phase === "MOTHER_RETURN" && isRaptor;
  const scientistOnFire = hasScientistOnFire(state);

  // === Handler ===

  const handleClick = useCallback(() => {
    // Advance the phase - selectedCard stays in interaction state until card reveal
    dispatch({ type: "ADVANCE_PHASE" });
  }, [dispatch]);

  // Determine if this is the active player's done button
  const isActivePlayer =
    isThisPlayerSetup || isThisPlayerSelecting || isThisPlayerEffect || isThisPlayerAction || isMotherReturn;

  // === Compute button disabled state ===

  const disabledReason = (() => {
    if (isThisPlayerSetup) {
      const setupComplete = isRaptor ? isRaptorSetupComplete(state) : countPlacedScientists(state) >= 4;
      return setupComplete ? null : "Complete setup to continue";
    }
    if (isThisPlayerSelecting) {
      return selectedCard === null ? "Select a card to continue" : null;
    }
    if (isThisPlayerEffect || isThisPlayerAction) {
      if (isThisPlayerAction && !isRaptor && scientistOnFire) {
        return "Move scientists off fire before ending the turn";
      }
      return null;
    }
    if (isMotherReturn) {
      // Only enabled if mother has been placed back on the board
      return state.mother.position === null ? "Place the mother to continue" : null;
    }
    // Not this player's turn
    return "Wait for your turn";
  })();
  const disabled = disabledReason !== null;

  // Keyboard shortcut: Space triggers Done for active player
  useEffect(() => {
    if (!isActivePlayer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !disabled) {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, handleClick, isActivePlayer]);

  const isScientist = player === "scientist";
  const buttonClassName = [
    "group/done relative h-31.25 w-31.25 rounded-[20px] border-0 bg-transparent p-0 outline-offset-4 transition-[filter] duration-150",
    disabled ? "cursor-not-allowed brightness-50" : "cursor-pointer hover:brightness-110",
  ].join(" ");

  const edgeClassName = [
    "absolute left-0 top-0 h-full w-full rounded-[20px]",
    isScientist
      ? disabled
        ? "bg-[linear-gradient(to_left,#3a2508_0%,#5a3a10_8%,#5a3a10_92%,#3a2508_100%)]"
        : "bg-[linear-gradient(to_left,#8a4a0a_0%,#b56a1a_8%,#b56a1a_92%,#8a4a0a_100%)]"
      : disabled
        ? "bg-[linear-gradient(to_left,#0f2f0f_0%,#1a4a1a_8%,#1a4a1a_92%,#0f2f0f_100%)]"
        : "bg-[linear-gradient(to_left,#1a4a1a_0%,#2d6a2d_8%,#2d6a2d_92%,#1a4a1a_100%)]",
  ].join(" ");

  const frontClassName = [
    "relative flex h-full w-full flex-col items-center justify-center rounded-[20px] text-[1.75rem] font-bold uppercase tracking-[1px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] transition-transform [transition-timing-function:cubic-bezier(0.3,0.7,0.4,1)]",
    disabled
      ? "-translate-y-0.5"
      : "-translate-y-1.5 group-hover/done:-translate-y-2 group-active/done:-translate-y-0.5 group-active/done:duration-[34ms]",
    isScientist
      ? disabled
        ? "bg-[linear-gradient(180deg,#8a5a20_0%,#6a4a18_40%,#4a3510_100%)]"
        : "bg-[linear-gradient(180deg,#ffb347_0%,#e68a11_40%,#c97a0a_100%)]"
      : disabled
        ? "bg-[linear-gradient(180deg,#3a6a3a_0%,#2d5d2d_40%,#1f4f1f_100%)]"
        : "bg-[linear-gradient(180deg,#5fcf5f_0%,#4caf50_40%,#388e3c_100%)]",
  ].join(" ");

  return (
    <button className={buttonClassName} disabled={disabled} onClick={handleClick} title={disabledReason ?? undefined}>
      <span className={edgeClassName} />
      <span className={frontClassName}>
        Done
        <span className="text-[0.8rem] font-normal opacity-60">[space]</span>
      </span>
    </button>
  );
}

export default DoneButton;
