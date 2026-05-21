const STORAGE_KEY = "raptor-audio-muted";

let muted = readInitialMuted();
const listeners = new Set<() => void>();
const audioElements = new Set<HTMLAudioElement>();

function readInitialMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function syncAudioElements() {
  for (const audio of audioElements) {
    audio.muted = muted;
  }
}

export function isAudioMuted(): boolean {
  return muted;
}

export function setAudioMuted(nextMuted: boolean): void {
  muted = nextMuted;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(nextMuted));
  }
  syncAudioElements();
  notifyListeners();
}

export function toggleAudioMuted(): void {
  setAudioMuted(!muted);
}

export function subscribeToAudioSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function registerAudioElement(audio: HTMLAudioElement): () => void {
  audioElements.add(audio);
  audio.muted = muted;
  return () => {
    audioElements.delete(audio);
  };
}
