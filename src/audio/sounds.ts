export type SoundSpec = {
  file: string;
  description: string;
};

// Add your mp3 files under `public/sounds/` matching these filenames.
// Example: `public/sounds/ui_click_primary.mp3`
export const SOUNDS = {
  // UI
  ui_click_primary: { file: "ui_click_primary.mp3", description: "Primary button click (Done, confirm, etc.)" },
  ui_click_secondary: { file: "ui_click_secondary.mp3", description: "Secondary button click (misc UI)" },
  ui_card_select: { file: "ui_card_select.mp3", description: "Selecting a card in hand" },
  ui_card_deselect: { file: "ui_card_deselect.mp3", description: "Deselecting a card in hand" },
  ui_actor_select: { file: "ui_actor_select.mp3", description: "Selecting a piece to act with" },
  ui_actor_deselect: { file: "ui_actor_deselect.mp3", description: "Deselecting the currently selected piece" },
  ui_privacy_dismiss: { file: "ui_privacy_dismiss.mp3", description: "Dismiss the privacy screen" },
  ui_undo: { file: "ui_undo.mp3", description: "Undo/reset button" },

  // Setup / placement
  setup_place_mother: { file: "setup_place_mother.mp3", description: "Place mother during setup" },
  setup_place_baby: { file: "setup_place_baby.mp3", description: "Place baby during setup" },
  setup_place_scientist: { file: "setup_place_scientist.mp3", description: "Place scientist during setup" },
  setup_remove_piece: { file: "setup_remove_piece.mp3", description: "Remove a placed piece during setup" },
  setup_move_piece_on_tile: { file: "setup_move_piece_on_tile.mp3", description: "Reposition a piece within its tile during setup" },

  // Effect phase actions
  effect_fear: { file: "effect_fear.mp3", description: "Frighten a scientist (Fear)" },
  effect_sleeping_gas: { file: "effect_sleeping_gas.mp3", description: "Put a baby to sleep (Sleeping Gas)" },
  effect_mothers_call: { file: "effect_mothers_call.mp3", description: "Mother's Call (moving baby to mother's tile)" },
  effect_disappearance: { file: "effect_disappearance.mp3", description: "Disappearance (mother leaves board)" },
  effect_recovery_wake_baby: { file: "effect_recovery_wake_baby.mp3", description: "Recovery: wake a baby" },
  effect_recovery_remove_sleep_token: {
    file: "effect_recovery_remove_sleep_token.mp3",
    description: "Recovery: remove mother sleep token",
  },
  effect_reinforcements: { file: "effect_reinforcements.mp3", description: "Reinforcements: place scientist from reserve" },
  effect_fire_place: { file: "effect_fire_place.mp3", description: "Fire: place a fire token" },
  effect_jeep_move: { file: "effect_jeep_move.mp3", description: "Jeep: move scientist and extinguish fires" },
  effect_revert: { file: "effect_revert.mp3", description: "Effect phase undo/revert" },
  effect_mother_return_place: { file: "effect_mother_return_place.mp3", description: "Place mother back after disappearance" },

  // Action phase actions
  action_move_baby: { file: "action_move_baby.mp3", description: "Move baby (action phase)" },
  action_move_scientist: { file: "action_move_scientist.mp3", description: "Move scientist (action phase)" },
  action_move_mother: { file: "action_move_mother.mp3", description: "Move mother (action phase)" },
  action_mother_kill: { file: "action_mother_kill.mp3", description: "Mother kills adjacent scientist" },
  action_mother_wake_baby: { file: "action_mother_wake_baby.mp3", description: "Mother wakes adjacent baby" },
  action_mother_extinguish_fire: { file: "action_mother_extinguish_fire.mp3", description: "Mother extinguishes connected fire" },
  action_scientist_sleep_baby: { file: "action_scientist_sleep_baby.mp3", description: "Scientist puts baby to sleep" },
  action_scientist_capture_baby: { file: "action_scientist_capture_baby.mp3", description: "Scientist captures sleeping baby" },
  action_scientist_shoot_mother: { file: "action_scientist_shoot_mother.mp3", description: "Scientist shoots mother (adds sleep token)" },
  action_scientist_stand_up: { file: "action_scientist_stand_up.mp3", description: "Scientist stands up (removes fear)" },
  action_reset: { file: "action_reset.mp3", description: "Reset action phase (undo to snapshot)" },

  // Cards / deck lifecycle
  cards_draw: { file: "cards_draw.mp3", description: "A card is drawn into hand" },
  cards_discard: { file: "cards_discard.mp3", description: "Cards are discarded after reveal" },
  cards_shuffle: { file: "cards_shuffle.mp3", description: "Deck shuffle (e.g., card 1 effect)" },

  // Phases / flow
  phase_advance: { file: "phase_advance.mp3", description: "Phase advance (Done/Continue)" },
  phase_enter_card_reveal: { file: "phase_enter_card_reveal.mp3", description: "Entering card reveal" },
  phase_enter_effect: { file: "phase_enter_effect.mp3", description: "Entering effect phase" },
  phase_enter_action: { file: "phase_enter_action.mp3", description: "Entering action phase" },
  phase_enter_round_end: { file: "phase_enter_round_end.mp3", description: "Entering round end countdown" },
  phase_game_over: { file: "phase_game_over.mp3", description: "Game over" },

  // Animations
  anim_card_reveal_in: { file: "anim_card_reveal_in.mp3", description: "Card reveal: cards fly in" },
  anim_card_reveal_effect: { file: "anim_card_reveal_effect.mp3", description: "Card reveal: effect shown / highlight" },
  anim_card_reveal_ap: { file: "anim_card_reveal_ap.mp3", description: "Card reveal: action points shown / highlight" },
  anim_card_reveal_out: { file: "anim_card_reveal_out.mp3", description: "Card reveal: cards fly out" },
  anim_round_end_tick: { file: "anim_round_end_tick.mp3", description: "Round end countdown tick" },
} satisfies Record<string, SoundSpec>;

export type SoundId = keyof typeof SOUNDS;
