// Audio context for playing sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Play a card flip sound effect using Web Audio API
 * Creates a short "whoosh" + "snap" sound that resembles a card being flipped
 */
export function playCardFlipSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create noise for the "whoosh" part
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filter the noise to make it sound more like paper
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 2000;
    noiseFilter.Q.value = 0.5;

    // Envelope for noise
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Create a short "snap" click
    const clickOsc = ctx.createOscillator();
    clickOsc.type = "sine";
    clickOsc.frequency.setValueAtTime(800, now + 0.02);
    clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    // Start and stop
    noiseSource.start(now);
    noiseSource.stop(now + 0.1);
    clickOsc.start(now);
    clickOsc.stop(now + 0.1);
  } catch (e) {
    // Silently fail if audio isn't available
    console.warn("Could not play sound:", e);
  }
}
