# Architecture Design Notes

## State Management Approach

### Core Principle: Single State Object with Reducer

All game state lives in one object at the top level (`App`), managed by `useReducer`. Components access state via React Context and dispatch actions to request changes.

### State Machine Phases

```
MAIN_MENU → RAPTOR_SETUP → SCIENTIST_SETUP → SCIENTIST_CARD_SELECTION →
RAPTOR_CARD_SELECTION → CARD_REVEAL → EFFECT_PHASE → ACTION_PHASE →
MOTHER_RETURN (if disappearance) → ROUND_END → back to SCIENTIST_CARD_SELECTION

If cards match at CARD_REVEAL → skip directly to ROUND_END
```

### Phase Definitions

- **MAIN_MENU**: Initial game menu
- **RAPTOR_SETUP**: Raptor places mother and babies
- **SCIENTIST_SETUP**: Scientist places 4 scientists on L-tiles
- **SCIENTIST_CARD_SELECTION**: Scientist player chooses a card (hidden from raptor, unless raptor has observation)
- **RAPTOR_CARD_SELECTION**: Raptor player chooses a card (hidden from scientist)
- **CARD_REVEAL**: Cards revealed, determine who gets effect vs action points, set `effectActionsRemaining`
- **EFFECT_PHASE**: Lower card player executes their card's special effect
- **ACTION_PHASE**: Higher card player spends action points (difference between cards)
- **MOTHER_RETURN**: Raptor places mother back on board after Disappearance card
- **ROUND_END**: Reset round state, draw cards, check win conditions

### Turn Order for Card Selection

Since this is a single-screen game (not simultaneous like the physical board game):

1. Scientist selects card first (raptor looks away or screen is hidden)
2. Raptor selects card second
3. Both cards revealed

### Active Player

The `activePlayer` field indicates who is currently acting. During card selection phases, it matches that phase. After reveal, it's derived from card comparison:

- Lower card → that player is active during EFFECT_PHASE
- Higher card → that player is active during ACTION_PHASE
- Cards match → skip directly to ROUND_END

Action points are stored in `actionPoints` field (set during CARD_REVEAL).

### State Shape

See `src/types/gameState.ts` for the full type definitions. Key types:

```typescript
type GamePhase =
  | "MAIN_MENU"
  | "RAPTOR_SETUP"
  | "SCIENTIST_SETUP"
  | "SCIENTIST_CARD_SELECTION"
  | "RAPTOR_CARD_SELECTION"
  | "CARD_REVEAL"
  | "EFFECT_PHASE"
  | "ACTION_PHASE"
  | "MOTHER_RETURN"
  | "ROUND_END"
  | "GAME_OVER";

type Player = "raptor" | "scientist";

type Position = { tileId: number; x: number; y: number };

interface MotherState {
  id: "mother";
  position: Position | null;
  sleepTokens: number;
  paidWoundCost: boolean;
  disappeared: boolean;
  observationActive: boolean;
}

interface BabyState {
  id: string; // "baby-0"..."baby-4"
  position: Position | null;
  isAsleep: boolean;
  isEscaped: boolean;
  isCaptured: boolean;
  asleepThisRound: boolean;
}

interface ScientistState {
  id: string; // "scientist-0"..."scientist-9"
  position: Position | null;
  isDead: boolean;
  isFrightened: boolean;
  hasUsedAggressiveAction: boolean;
  frightenedThisRound: boolean;
}

interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  mother: MotherState;
  babies: Record<string, BabyState>;
  scientists: Record<string, ScientistState>;
  fireTokens: FireToken[];
  raptorCards: CardState;
  scientistCards: CardState;
  activeEffectCard: CardInfo | null;
  actionPoints: number;
  activePlayer: Player | null;
  winner: Player | null;
  winCondition: WinCondition | null;
  effectActionsRemaining: number;
  raptorInteraction: InteractionState;
  scientistInteraction: InteractionState;
  undoSnapshot: GameState | null; // for undo in effect/action phases
}
```

### Reducer Pattern

Single reducer dispatches to domain-specific handlers:

```typescript
function gameReducer(state, action) {
  switch (action.type) {
    case "PLACE_SCIENTIST":
      return handlePlaceScientist(state, action);
    case "FRIGHTEN_SCIENTIST":
      return handleFrightenScientist(state, action);
    // ... etc
  }
}
```

Handlers are organized in `src/state/actions/` by domain (setup, cards, effects, actionPhase, etc.).
Phase transitions are handled by the single `ADVANCE_PHASE` action in `src/state/actions/phaseActions.ts`.

### Data vs Logic Separation

- **State**: Plain objects only (no class instances)
- **Logic**: Pure functions that take state and return results
- **Components**: Read state via context, dispatch actions, render UI

Existing piece classes (MotherRaptor, BabyRaptor, Scientist) can be used as logic containers—instantiate temporarily to compute valid moves, but don't store instances in state.

### Derived Values

Compute rather than store:

- Captured baby count: `Object.values(babies).filter(b => b.isCaptured).length`
- Escaped baby count: `Object.values(babies).filter(b => b.isEscaped).length`
- Effect player: `activeEffectCard?.player`
- Action player: opposite of effect player
