# Setup Phase Refactor Plan

## Overview
Replace drag-and-drop setup with click-to-place interaction. Highlight valid tiles to guide placement.

## Current State
- Pieces dragged from holding pen to board
- SetupPanel component manages holding pen display
- Drag handlers in Board.tsx and Tile.tsx

## New Interaction Model

### Raptor Setup Phase

**Mother Placement (must be placed first):**
- Valid tiles highlighted: center tiles (2, 7)
- Click any space on center tile → places mother there
- Mother not yet placed = only center tiles are valid

**Moving Mother (after placed):**
- Click on mother → removes her from board (back to "unplaced" state)
- Center tiles highlight again
- Click center tile → places mother (if baby was there, baby is removed)

**Baby Placement (after mother placed):**
- Valid tiles highlighted: all square tiles without a raptor
- Click any space on valid tile → places baby there
- One baby per tile rule enforced

**Moving Baby:**
- Click on baby → removes from board
- Click valid tile → places baby

### Scientist Setup Phase

**Scientist Placement:**
- Valid tiles highlighted: L-tiles without a scientist
- Click any non-exit, non-mountain space on L-tile → places scientist
- One scientist per L-tile rule enforced

**Moving Scientist:**
- Click on placed scientist → removes from board
- Click valid L-tile → places scientist

## UI Changes

### Tile Highlighting
- Add `data-valid-placement="true"` attribute to valid tiles during setup
- CSS styling for valid placement tiles (similar to valid move highlighting)
- Different highlight for "mother required" center tiles vs general baby tiles?

### SetupPanel Changes
- Remove draggable pieces from holding pen
- Show remaining piece counts as info only (e.g., "Mother: 1, Babies: 5")
- Or remove SetupPanel entirely and show counts in a simpler way

### Visual Feedback
- Highlight valid tiles based on current setup state
- Show which piece type will be placed on click
- Consider subtle indicator on cursor or near mouse

## State Changes

### New/Modified State
- Track setup mode: `'placing_mother' | 'placing_baby' | 'placing_scientist'`
- Or derive from: mother placed? → babies mode, else → mother mode

### Reducer Actions
- Modify `PLACE_MOTHER`, `PLACE_BABY`, `PLACE_SCIENTIST` to work with click
- Add `REMOVE_PIECE` action for clicking placed pieces
- Handle baby removal when mother placed on occupied center tile

## Implementation Steps

1. **Remove drag-drop from SetupPanel**
   - Keep piece count display
   - Remove draggable elements and handlers

2. **Add tile validity calculation for setup**
   - Function to determine valid tiles based on phase and placed pieces
   - Pass to Tile component for highlighting

3. **Update Tile click handling for setup**
   - Detect setup phase clicks
   - Dispatch appropriate place/remove actions

4. **Add piece removal on click**
   - Click placed piece during setup → remove it
   - Update holding pen counts

5. **Handle mother-replaces-baby logic**
   - When placing mother on tile with baby, remove baby first

6. **Update CSS for setup tile highlighting**
   - Valid placement tiles get highlighted
   - Possibly different colors for mother vs baby valid tiles

## Potential Refactor: Tile/Piece Components
Before implementing, consider extracting:
- Piece rendering into separate `Piece` component
- Cleaner separation of setup vs gameplay interactions
- Shared highlighting logic

## Testing Considerations
- Mother must be placed before babies
- One raptor per square tile
- One scientist per L-tile
- Clicking piece removes it
- Mother placement removes existing baby
- Piece counts update correctly
