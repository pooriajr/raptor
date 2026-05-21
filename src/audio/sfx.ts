import { SOUNDS, type SoundId } from "./sounds";

const BASE_PATH = `${import.meta.env.BASE_URL}sounds/`;

let audioContext: AudioContext | null = null;
const bufferCache = new Map<SoundId, AudioBuffer>();
const loading = new Map<SoundId, Promise<AudioBuffer>>();
const missing = new Set<SoundId>();
const warned = new Set<SoundId>();
const activeSources = new Map<SoundId, AudioBufferSourceNode>();

export type PlaySfxOptions = {
  volume?: number;
  playbackRate?: number;
  allowOverlap?: boolean;
};

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function warnOnce(id: SoundId, message: string) {
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(message);
}

async function loadBuffer(id: SoundId): Promise<AudioBuffer> {
  const cached = bufferCache.get(id);
  if (cached) return cached;

  const inflight = loading.get(id);
  if (inflight) return inflight;

  const ctx = getAudioContext();
  const spec = SOUNDS[id];
  const src = `${BASE_PATH}${spec.file}`;

  const promise = fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Missing sound file for '${id}': expected '${src}'`);
      }
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      bufferCache.set(id, buffer);
      loading.delete(id);
      return buffer;
    })
    .catch((error) => {
      loading.delete(id);
      throw error;
    });

  loading.set(id, promise);
  return promise;
}

export function playSfx(id: SoundId, options: PlaySfxOptions = {}): void {
  if (missing.has(id)) return;

  const ctx = getAudioContext();
  void ctx.resume();

  const allowOverlap = options.allowOverlap ?? true;

  loadBuffer(id)
    .then((buffer) => {
      if (!allowOverlap) {
        const active = activeSources.get(id);
        if (active) {
          active.stop();
          active.disconnect();
          activeSources.delete(id);
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = options.playbackRate ?? 1;

      const gain = ctx.createGain();
      gain.gain.value = options.volume ?? 0.9;

      source.connect(gain);
      gain.connect(ctx.destination);

      source.onended = () => {
        if (!allowOverlap && activeSources.get(id) === source) {
          activeSources.delete(id);
        }
      };

      source.start();

      if (!allowOverlap) activeSources.set(id, source);
    })
    .catch(() => {
      missing.add(id);
      const spec = SOUNDS[id];
      warnOnce(id, `Missing sound file for '${id}': expected '${BASE_PATH}${spec.file}'`);
    });
}

export function playSfxLater(id: SoundId, delayMs: number, options?: PlaySfxOptions): void {
  window.setTimeout(() => playSfx(id, options), delayMs);
}
