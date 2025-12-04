import type { PieceType } from "../types/gameState.ts";

// Get emoji for a piece type
export function getPieceEmoji(type: PieceType): string {
  switch (type) {
    case "mother":
      return "🦖";
    case "baby":
      return "🦎";
    case "scientist":
      return "🧑‍🔬";
  }
}
