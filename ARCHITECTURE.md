# Architecture Design Notes

## State Management Approach

### Core Principle: Single State Object with Reducer

All game state lives in one object at the top level (`App`), managed by `useReducer`. Components access state via React Context and dispatch actions to request changes.

### State Machine Phases

```
SETUP → SCIENTIST_CARD_SELECTION → RAPTOR_CARD_SELECTION → CARD_REVEAL → CARD_EFFECT → ACTION_POINTS → ROUND_END → SCIENTIST_CARD_SELECTION
                                                                       ↘ (if cards match) → ROUND_END ↗
                                                                       
If Disappearance card played:
CARD_EFFECT (mother removed) → ACTION_POINTS → MOTHER_REAPPEARANCE → ROUND_END
                                     
Any phase → RAPTOR_WINS | SCIENTIST_WINS (when win condition met)
```

### Phase Definitions

- **SETUP**: Initial piece placement
- **SCIENTIST_CARD_SELECTION**: Scientist player chooses a card (hidden from raptor, unless raptor has observation)
- **RAPTOR_CARD_SELECTION**: Raptor player chooses a card (hidden from scientist)
- **CARD_REVEAL**: Cards revealed, determine who gets effect vs action points
- **CARD_EFFECT**: Lower card player executes their card's special effect
- **ACTION_POINTS**: Higher card player spends action points (difference between cards)
- **MOTHER_REAPPEARANCE**: Raptor places mother back on board after Disappearance card
- **ROUND_END**: Reset round state, draw cards, check win conditions
- **RAPTOR_WINS** / **SCIENTIST_WINS**: Terminal states

### Turn Order for Card Selection

Since this is a single-screen game (not simultaneous like the physical board game):
1. Scientist selects card first (raptor looks away or screen is hidden)
2. Raptor selects card second
3. Both cards revealed

### Active Player

The `activePlayer` field indicates who is currently acting. During card selection phases, it matches that phase. After reveal, it's derived from card comparison:
- Lower card → that player is active during CARD_EFFECT
- Higher card → that player is active during ACTION_POINTS
- Cards match → skip directly to ROUND_END

Action points are computed (not stored) as the difference between played cards.

### State Shape

```typescript
type GamePhase =
  | 'SETUP'
  | 'SCIENTIST_CARD_SELECTION'
  | 'RAPTOR_CARD_SELECTION'
  | 'CARD_REVEAL'
  | 'CARD_EFFECT'
  | 'ACTION_POINTS'
  | 'MOTHER_REAPPEARANCE'
  | 'ROUND_END'
  | 'RAPTOR_WINS'
  | 'SCIENTIST_WINS'

type Player = 'raptor' | 'scientist'

type BabyStatus = 'active' | 'sleeping' | 'captured' | 'escaped'
type ScientistStatus = 'active' | 'frightened' | 'removed'

type CardEffectType =
  | 'MOTHERS_CALL_1'      // Move 1 baby
  | 'MOTHERS_CALL_2'      // Move 1-2 babies
  | 'DISAPPEARANCE'       // Remove mother, replace after opponent acts
  | 'FEAR_1'              // Frighten 1 scientist
  | 'FEAR_2'              // Frighten 1-2 scientists
  | 'RECOVERY_2'          // Remove sleep tokens / wake babies, up to 2 actions
  | 'RECOVERY_3'          // Remove sleep tokens / wake babies, up to 3 actions
  | 'SLEEPING_GAS_1'      // Put 1 baby to sleep
  | 'SLEEPING_GAS_2'      // Put 1-2 babies to sleep
  | 'REINFORCEMENTS'      // Add 1-2 scientists
  | 'JEEP_2'              // 2 straight-line movements
  | 'JEEP_4'              // 4 straight-line movements
  | 'FIRE_2'              // Place 2 fire tokens
  | 'FIRE_3'              // Place 3 fire tokens

type Mother = {
  id: 'mother'
  x: number
  y: number
  sleepTokens: number  // 0-5, 5 = scientist wins
}

type Baby = {
  id: string
  x: number
  y: number
  status: BabyStatus
}

type Scientist = {
  id: string
  x: number
  y: number
  status: ScientistStatus
  hasActedAggressively: boolean  // reset each round
}

type Fire = {
  x: number
  y: number
}

type CardEffect = {
  type: CardEffectType
  remaining: number  // sub-actions left to perform
}

type GameState = {
  phase: GamePhase
  activePlayer: Player
  actionPoints: number
  
  pieces: {
    mother: Mother
    babies: Baby[]
    scientists: Scientist[]
  }
  
  board: {
    tiles: Tile[]
    fires: Fire[]
  }
  
  cards: {
    raptorDeck: number[]
    raptorHand: number[]
    raptorPlayed: number | null
    
    scientistDeck: number[]
    scientistHand: number[]
    scientistPlayed: number | null
  }
  
  // Track multi-step card effects
  cardEffect: CardEffect | null
  
  // Mother must spend action points = sleep tokens before first move each turn
  motherHasMovedThisTurn: boolean
  
  // Disappearance card effects
  motherIsDisappeared: boolean    // mother currently off-board
  raptorCanObserve: boolean       // raptor sees scientist's next card pick
  
  // Scientists in reserve (not yet on board)
  scientistReserve: number
  
  // UI state
  selectedPiece: string | null
}
```

### Reducer Pattern

Main reducer composes sub-reducers for different state slices:

```typescript
function gameReducer(state, action) {
  return {
    pieces: piecesReducer(state.pieces, action),
    board: boardReducer(state.board, action),
    cards: cardsReducer(state.cards, action),
    phase: phaseReducer(state, action),  // needs full state for win checks
    // ...
  }
}
```

### Data vs Logic Separation

- **State**: Plain objects only (no class instances)
- **Logic**: Pure functions that take state and return results
- **Components**: Read state via context, dispatch actions, render UI

Existing piece classes (MotherRaptor, BabyRaptor, Scientist) can be used as logic containers—instantiate temporarily to compute valid moves, but don't store instances in state.

### Derived Values

Compute rather than store:
- Captured baby count: `babies.filter(b => b.status === 'captured').length`
- Escaped baby count: `babies.filter(b => b.status === 'escaped').length`
- Who gets action points: compare `raptorPlayed` vs `scientistPlayed`
- Action point amount: `Math.abs(raptorPlayed - scientistPlayed)`
