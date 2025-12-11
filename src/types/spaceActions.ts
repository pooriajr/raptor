// Visual styles for clickable spaces (CSS styling)
export type SpaceStyle =
  | "validMove" // Action phase movement destination (green)
  | "setupPlacement" // Setup phase placement (light green)
  | "setupMoveTarget" // Moving piece within tile during setup
  | "effectTarget" // Selectable pieces for effect phase (gold) - step 1 of two-step effects
  | "effectDestination" // Effect destinations like Mother's Call, reinforcements, fire, jeep (teal)
  | "pendingDestination" // Where pieces will move to on confirm (solid green)
  | "pathTrail" // Intermediate path positions / origins (footprints)
  | "hostileTarget" // Enemy pieces that can be attacked (red)
  | "friendlyTarget" // Friendly pieces/fire that can be interacted with (purple)
  | "fire" // Existing fire token (orange)
  | "pendingFire"; // Fire to be placed (orange pulsing)

// SpaceId is a unique identifier for a space: "tileId-x-y"
export type SpaceId = string;

export function createSpaceId(tileId: number, x: number, y: number): SpaceId {
  return `${tileId}-${x}-${y}`;
}

export function parseSpaceId(spaceId: SpaceId): { tileId: number; x: number; y: number } {
  const [tileId, x, y] = spaceId.split("-").map(Number);
  return { tileId, x, y };
}

// SpaceAction represents what happens when a space is clicked
// Style is the visual affordance, action is what gets dispatched
// Some spaces (fire, pathTrail) are display-only and don't have click actions
export interface SpaceAction<TAction = unknown> {
  style: SpaceStyle;
  action?: TAction;
}

// Map from SpaceId to its action - each space has at most one action
export type SpaceActions<TAction = unknown> = Map<SpaceId, SpaceAction<TAction>>;
