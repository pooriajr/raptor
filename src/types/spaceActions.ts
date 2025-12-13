// Visual styles for clickable spaces (CSS styling)
export type SpaceStyle =
  | "selectable" // Any clickable/interactive space (blue)
  | "selected" // Currently selected piece (yellow)
  | "hostileTarget" // Enemy pieces that can be attacked (red)
  | "disabled" // Normally valid, but currently not allowed (gray)
  | "fire"; // Existing fire token (orange)

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
// Some spaces (fire) are display-only and don't have click actions
export interface SpaceAction<TAction = unknown> {
  style: SpaceStyle;
  action?: TAction;
  tooltip?: string;
}

// Map from SpaceId to its action - each space has at most one action
export type SpaceActions<TAction = unknown> = Map<SpaceId, SpaceAction<TAction>>;
