import { useState, type ReactNode } from "react";
import { RevealContext, type RevealStage } from "./revealContext";

export function RevealProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<RevealStage>("hidden");
  const [effectPlayer, setEffectPlayer] = useState<"raptor" | "scientist" | null>(null);

  return (
    <RevealContext.Provider value={{ stage, setStage, effectPlayer, setEffectPlayer }}>
      {children}
    </RevealContext.Provider>
  );
}
