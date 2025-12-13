#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const outDir = path.join(publicDir, "sounds");

mkdirSync(outDir, { recursive: true });

const src = {
  interface: (name) => path.join(publicDir, "kenney_interface-sounds", "Audio", name),
  impact: (name) => path.join(publicDir, "kenney_impact-sounds", "Audio", name),
  casino: (name) => path.join(publicDir, "kenney_casino-audio", "Audio", name),
};

// Target mp3 filename -> source ogg filename
const mapping = {
  // UI
  "ui_click_primary.mp3": src.interface("confirmation_002.ogg"),
  "ui_click_secondary.mp3": src.interface("click_002.ogg"),
  "ui_card_select.mp3": src.interface("select_001.ogg"),
  "ui_card_deselect.mp3": src.interface("back_001.ogg"),
  "ui_actor_select.mp3": src.interface("pluck_001.ogg"),
  "ui_actor_deselect.mp3": src.interface("back_002.ogg"),
  "ui_privacy_dismiss.mp3": src.interface("open_001.ogg"),
  "ui_undo.mp3": src.interface("back_003.ogg"),

  // Setup / placement
  "setup_place_mother.mp3": src.interface("drop_004.ogg"),
  "setup_place_baby.mp3": src.interface("drop_002.ogg"),
  "setup_place_scientist.mp3": src.interface("drop_001.ogg"),
  "setup_remove_piece.mp3": src.interface("close_001.ogg"),
  "setup_move_piece_on_tile.mp3": src.interface("scroll_002.ogg"),

  // Effect phase
  "effect_fear.mp3": src.interface("glitch_003.ogg"),
  "effect_sleeping_gas.mp3": src.interface("glass_002.ogg"),
  "effect_mothers_call.mp3": src.casino("card-slide-7.ogg"),
  "effect_disappearance.mp3": src.casino("cards-pack-open-1.ogg"),
  "effect_recovery_wake_baby.mp3": src.interface("confirmation_003.ogg"),
  "effect_recovery_remove_sleep_token.mp3": src.interface("click_004.ogg"),
  "effect_reinforcements.mp3": src.interface("open_002.ogg"),
  "effect_fire_place.mp3": src.impact("impactMining_002.ogg"),
  "effect_jeep_move.mp3": src.impact("footstep_concrete_003.ogg"),
  "effect_revert.mp3": src.interface("back_004.ogg"),
  "effect_mother_return_place.mp3": src.interface("drop_003.ogg"),

  // Action phase
  "action_move_baby.mp3": src.impact("footstep_grass_002.ogg"),
  "action_move_scientist.mp3": src.impact("footstep_concrete_002.ogg"),
  "action_move_mother.mp3": src.impact("footstep_wood_001.ogg"),
  "action_mother_kill.mp3": src.impact("impactPlank_medium_003.ogg"),
  "action_mother_wake_baby.mp3": src.interface("confirmation_004.ogg"),
  "action_mother_extinguish_fire.mp3": src.impact("impactGlass_medium_002.ogg"),
  "action_scientist_sleep_baby.mp3": src.interface("glass_001.ogg"),
  "action_scientist_capture_baby.mp3": src.impact("impactMetal_light_002.ogg"),
  "action_scientist_shoot_mother.mp3": src.impact("impactMetal_heavy_003.ogg"),
  "action_scientist_stand_up.mp3": src.interface("maximize_003.ogg"),
  "action_reset.mp3": src.interface("minimize_003.ogg"),

  // Cards / deck lifecycle
  "cards_draw.mp3": src.casino("cards-pack-take-out-1.ogg"),
  "cards_discard.mp3": src.casino("card-place-2.ogg"),
  "cards_shuffle.mp3": src.casino("card-shuffle.ogg"),

  // Phases / flow
  "phase_advance.mp3": src.interface("confirmation_001.ogg"),
  "phase_enter_card_reveal.mp3": src.casino("card-fan-1.ogg"),
  "phase_enter_effect.mp3": src.interface("bong_001.ogg"),
  "phase_enter_action.mp3": src.interface("bong_001.ogg"),
  "phase_enter_round_end.mp3": src.interface("question_001.ogg"),
  "phase_game_over.mp3": src.impact("impactBell_heavy_004.ogg"),

  // Animations
  "anim_card_reveal_in.mp3": src.casino("card-fan-2.ogg"),
  "anim_card_reveal_effect.mp3": src.casino("card-shove-2.ogg"),
  "anim_card_reveal_ap.mp3": src.casino("card-shove-4.ogg"),
  "anim_card_reveal_out.mp3": src.casino("card-place-4.ogg"),
  "anim_round_end_tick.mp3": src.interface("click_005.ogg"),
};

function extractExpectedFilenamesFromSoundsTs() {
  const soundsTs = readFileSync(path.join(repoRoot, "src", "audio", "sounds.ts"), "utf8");
  const matches = [...soundsTs.matchAll(/file:\s*"([^"]+)"/g)].map((m) => m[1]);
  return Array.from(new Set(matches));
}

function ffmpegConvert(inPath, outPath) {
  execFileSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-i", inPath, "-codec:a", "libmp3lame", "-q:a", "3", outPath],
    { stdio: "inherit" },
  );
}

const expected = extractExpectedFilenamesFromSoundsTs();

for (const filename of expected) {
  const source = mapping[filename];
  if (!source) {
    throw new Error(`No Kenney mapping provided for '${filename}'. Add it in scripts/populate_sounds_from_kenney.mjs`);
  }
  const outPath = path.join(outDir, filename);
  ffmpegConvert(source, outPath);
}

// Keep CC0 license texts alongside the curated set.
const licenses = [
  path.join(publicDir, "kenney_interface-sounds", "License.txt"),
  path.join(publicDir, "kenney_impact-sounds", "License.txt"),
  path.join(publicDir, "kenney_casino-audio", "License.txt"),
];
const licenseText = licenses.map((p) => readFileSync(p, "utf8").trim()).join("\n\n---\n\n");
writeFileSync(path.join(outDir, "KENNEY_LICENSES.txt"), `${licenseText}\n`);

// Remove the large source packs now that sounds are curated.
rmSync(path.join(publicDir, "kenney_interface-sounds"), { recursive: true, force: true });
rmSync(path.join(publicDir, "kenney_impact-sounds"), { recursive: true, force: true });
rmSync(path.join(publicDir, "kenney_casino-audio"), { recursive: true, force: true });

// Remove the placeholder if present.
rmSync(path.join(outDir, ".gitkeep"), { force: true });

console.log(`Wrote ${expected.length} mp3 files to ${path.relative(repoRoot, outDir)}`);
