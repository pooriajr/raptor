import { SOUNDS, type SoundId } from "./sounds";

const BASE_PATH = "/sounds/";

const cached = new Map<SoundId, HTMLAudioElement>();
const missing = new Set<SoundId>();
const warned = new Set<SoundId>();

export type PlaySfxOptions = {
  volume?: number;
  playbackRate?: number;
  allowOverlap?: boolean;
};

function warnOnce(id: SoundId, message: string) {
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(message);
}

export function playSfx(id: SoundId, options: PlaySfxOptions = {}): void {
  if (missing.has(id)) return;

  const spec = SOUNDS[id];
  const src = `${BASE_PATH}${spec.file}`;

  const allowOverlap = options.allowOverlap ?? true;
  const audio = allowOverlap ? new Audio(src) : (cached.get(id) ?? new Audio(src));

  audio.volume = options.volume ?? 0.9;
  audio.playbackRate = options.playbackRate ?? 1;

  // Restart
  try {
    audio.currentTime = 0;
  } catch {
    // ignore
  }

  audio.addEventListener(
    "error",
    () => {
      missing.add(id);
      warnOnce(id, `Missing sound file for '${id}': expected '${src}'`);
    },
    { once: true },
  );

  void audio.play().catch(() => {
    // Autoplay restrictions, etc.
  });

  if (!allowOverlap) cached.set(id, audio);
}

export function playSfxLater(id: SoundId, delayMs: number, options?: PlaySfxOptions): void {
  window.setTimeout(() => playSfx(id, options), delayMs);
}
