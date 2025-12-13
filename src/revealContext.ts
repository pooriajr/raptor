import { createContext, useContext } from "react";

export type RevealStage =
  | "hidden" // Not in reveal
  | "cards-center" // Cards are in the center, pausing
  | "show-effect" // Effect player highlighted, effect half visible
  | "show-ap" // AP player highlighted, AP half visible
  | "complete"; // Reveal complete

export interface RevealContextType {
  stage: RevealStage;
  setStage: (stage: RevealStage) => void;
  effectPlayer: "raptor" | "scientist" | null;
  setEffectPlayer: (player: "raptor" | "scientist" | null) => void;
}

export const RevealContext = createContext<RevealContextType | null>(null);

export function useReveal(): RevealContextType {
  const context = useContext(RevealContext);
  if (!context) {
    throw new Error("useReveal must be used within a RevealProvider");
  }
  return context;
}
