# Manual Test Checklist

## Bug Fixes to Verify

### 1. Reinforcements Bug Fix

- [ ] Play as scientist with card 2 or 6 (Reinforcements) as the lower card
- [ ] Place 1-2 reinforcement scientists on board edges
- [ ] Verify existing scientists do NOT move from their positions
- [ ] Verify new scientists appear in the clicked locations
- [ ] Verify scientist reserve count decreases correctly

### 2. Recovery Mother Sleep Token Fix

- [ ] Set up a game where mother has sleep tokens (use dev panel or play until mother is shot)
- [ ] Play as raptor with card 5 or 7 (Recovery) as the lower card
- [ ] Verify mother appears as a clickable target (gold highlight)
- [ ] Click on mother to allocate sleep token removal
- [ ] Verify instruction shows combined count (e.g., "2/3" for 1 baby + 1 token)
- [ ] Mix baby wakes and token removals in same recovery action
- [ ] Confirm and verify mother's sleep tokens decrease

### 3. Card 1 Shuffle Fix

- [ ] Play several rounds to build up discard pile
- [ ] Play card 1 as the lower card (either player)
- [ ] Verify discard pile is emptied after effect completes
- [ ] Verify deck now contains the previously discarded cards (shuffled)
- [ ] Note: The shuffle happens when transitioning to action phase after the effect

## New Features to Verify

### 4. Disappearance - Mother Return

- [ ] Use dev panel to skip to Disappearance effect (raptor card 2, scientist card 5)
- [ ] Verify mother is removed from board when effect triggers
- [ ] Complete the action phase (scientist spends action points or ends turn)
- [ ] Verify MOTHER_RETURN phase appears with "Mother Returns" label
- [ ] Verify all unoccupied spaces are highlighted as valid destinations
- [ ] Click on any valid space to place mother
- [ ] Verify mother appears in clicked location
- [ ] Verify game transitions to ROUND_END (cards are drawn for next round)

### 5. Disappearance - Observation Mechanic

- [ ] Trigger disappearance effect (as above)
- [ ] Complete the round (mother returns, round ends)
- [ ] On scientist's card selection: Verify "Being Observed!" label appears
- [ ] Verify instruction warns "Raptor will see your card!"
- [ ] Select and confirm scientist's card
- [ ] On raptor's card selection: Verify "Observation" label appears
- [ ] Verify instruction shows scientist's played card number
- [ ] Select and confirm raptor's card
- [ ] Verify observation is no longer active in subsequent rounds
