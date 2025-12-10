# Highlight Actions Refactor

## Problem

`handleSpaceClick` in Board.tsx is ~240 lines of complex phase-checking and branching logic. It duplicates validation that already exists in reducer action handlers. The code determines "what happens when you click this space" by walking through conditionals, even though we already compute "which spaces are clickable" when building highlights.

## Solution

Store the action to dispatch alongside each highlight. When a space is clicked, just dispatch the pre-computed action.

### Before

```typescript
type SpaceHighlights = Map<SpaceId, HighlightType>;

const handleSpaceClick = (tileId, x, y, pieceId) => {
  // 240 lines of:
  // - Phase checking
  // - Piece type checking  
  // - Validation
  // - Multiple dispatch calls
  // - Local state updates
};
```

### After

```typescript
type SpaceHighlights = Map<SpaceId, { style: HighlightStyle; action: GameAction }>;

const handleSpaceClick = (tileId, x, y) => {
  const highlight = highlights.get(createSpaceId(tileId, x, y));
  if (highlight) {
    dispatch(highlight.action);
  }
};
```

## Benefits

1. **Single source of truth** - Highlights define both visual state AND click behavior
2. **No duplicate validation** - Action is pre-validated when highlight is built
3. **Simpler click handler** - 240 lines → 5 lines
4. **Better testability** - Unit test highlight builder, not click simulation
5. **Cleaner reducer** - Forces consolidation of multi-dispatch into single actions
6. **Type safety** - TypeScript verifies highlight/action pairing

## Implementation Steps

### 1. Update SpaceHighlights type

```typescript
// Rename HighlightType to HighlightStyle (visual only)
type HighlightStyle = "validMove" | "setupPlacement" | "effectDestination" | ...;

// New type includes the action
type SpaceHighlight = {
  style: HighlightStyle;
  action: GameAction;
};

type SpaceHighlights = Map<SpaceId, SpaceHighlight>;
```

### 2. Consolidate multi-dispatch sequences

Some clicks currently dispatch multiple actions:
```typescript
dispatch({ type: "ADD_MOTHERS_CALL_MOVE", ... });
dispatch({ type: "SELECT_BABY_FOR_CALL", player, babyId: null });
setSelectedBabyPathResults([]); // local state!
```

These need to become single atomic actions that handle all state changes.

### 3. Move local state to reducer

`selectedBabyPathResults` and `selectedScientistJeepDestinations` are React local state used for caching path computations. These should either:
- Move to game state (interaction state)
- Be computed inline (if cheap enough)
- Be handled differently

### 4. Update highlight builder

When building highlights, include the action:
```typescript
// Before
h.set(createSpaceId(tileId, x, y), "setupPlacement");

// After  
h.set(createSpaceId(tileId, x, y), {
  style: "setupPlacement",
  action: { type: "PLACE_MOTHER", tileId, x, y }
});
```

### 5. Simplify handleSpaceClick

Replace entire function with:
```typescript
const handleSpaceClick = (tileId: number, x: number, y: number) => {
  const highlight = highlights.get(createSpaceId(tileId, x, y));
  if (highlight) {
    dispatch(highlight.action);
  }
};
```

### 6. Update Tile component

Change from `data-highlight={highlight}` to `data-highlight={highlight?.style}`.

## Actions to Consolidate

| Current Multi-Dispatch | New Single Action |
|------------------------|-------------------|
| ADD_MOTHERS_CALL_MOVE + SELECT_BABY_FOR_CALL | CONFIRM_MOTHERS_CALL_DESTINATION |
| ADD_JEEP_MOVE + SELECT_SCIENTIST_FOR_JEEP | CONFIRM_JEEP_DESTINATION |
| CLEAR_REINFORCEMENTS + ADD_REINFORCEMENT (loop) | TOGGLE_REINFORCEMENT_PLACEMENT |
| SELECT_ACTION_PIECE + ACTION_SCIENTIST_STAND_UP | Already handled in reducer |

## Local State to Address

- `selectedBabyPathResults` - Cache of path results for selected baby
- `selectedScientistJeepDestinations` - Cache of jeep destinations for selected scientist

Options:
1. Move to interaction state in reducer
2. Compute on demand when building highlights (paths already computed there)
3. Store in highlights themselves (action includes path data)

Option 3 seems cleanest - the action in the highlight already has all the data needed.

## Testing

After refactor, verify:
- [ ] Setup phase: placing mother, babies, scientists
- [ ] Setup phase: removing pieces
- [ ] Setup phase: moving pieces within tile
- [ ] Action phase: moving pieces
- [ ] Action phase: mother killing scientist
- [ ] Action phase: mother waking baby
- [ ] Action phase: mother extinguishing fire
- [ ] Action phase: scientist actions on babies
- [ ] Action phase: scientist shooting mother
- [ ] Effect phase: all effect types (fear, sleeping gas, mothers call, etc.)
- [ ] Mother return phase: placing mother back
