/**
 * A soft clock "tick", synthesised once with Web Audio (no asset to download)
 * and replayed each time a card crosses the centre of the showcase.
 *
 * Browsers only let audio start after a real user gesture — click, tap or key
 * press. Scrolling with a wheel or trackpad does NOT count, so the ticks stay
 * silent until the visitor has interacted with the page once. Ticks only
 * play in the 3D layouts, and choosing one from the switcher is itself a click,
 * so in practice the sound is ready by the time it's needed.
 */

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let noise: AudioBuffer | null = null;
let lastPlayed = 0;
let lastCard = 0;
let coarsePointer: boolean | undefined;

// Fast flings can cross several cards in one frame; one tick per ~45ms keeps
// it reading as a ratchet rather than a buzz.
const MIN_INTERVAL_MS = 45;
// Quiet on purpose. The tick sits where the ear is sensitive, so a low gain
// still reads clearly; raise towards 0.12 for more presence, lower towards
// 0.06 for barely-there.
const VOLUME = 0.09;

/**
 * The card deck's two sounds: one for a card dealt off the top, one for a
 * card gathered back onto it. Both are noise, not tone — a card is a sheet of
 * paper sliding over another, with no pitch to it. An earlier attempt at this
 * built the sound from tones and came out like a toy.
 *
 * Levelled by ear against the tick through an A-weighted measurement rather
 * than by peak: noise spreads its energy across the spectrum, so matching
 * peaks would have left it far louder than the tick it sits beside.
 */
const CARD_VOLUME = 0.13;
// Dealing several cards in one flick reads as a riffle rather than a stutter.
const CARD_MIN_INTERVAL_MS = 40;

export type CardSound = "deal" | "gather";

// Every event some browser treats as a user gesture for audio. Chrome accepts
// pointerdown; Safari is stricter and wants click/touchend-style events.
const GESTURES = [
  "pointerdown",
  "pointerup",
  "mousedown",
  "click",
  "keydown",
  "touchstart",
  "touchend",
] as const;

/**
 * A thin, premium tick. Two quickly-damped tones (2100 / 3300 Hz), gone
 * within ~8ms, with no low partial at all — earlier versions carried a
 * 700 Hz body that made the tick sound thick. Nothing above 5 kHz, so it
 * stays delicate rather than piercing, and a 0.25ms rounded attack keeps
 * it from snapping.
 */
function buildBuffer(context: AudioContext) {
  const rate = context.sampleRate;
  const length = Math.floor(rate * 0.025);
  const out = context.createBuffer(1, length, rate);
  const data = out.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const attack = 1 - Math.exp(-t / 0.00025);
    data[i] =
      attack *
      (Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t / 0.0022) +
        0.25 * Math.sin(2 * Math.PI * 3300 * t) * Math.exp(-t / 0.0012));
    peak = Math.max(peak, Math.abs(data[i]));
  }
  for (let i = 0; i < length; i++) data[i] /= peak || 1;
  return out;
}

/** One second of white noise, the raw material for both card sounds. */
function buildNoise(context: BaseAudioContext) {
  const length = Math.floor(context.sampleRate * 0.5);
  const out = context.createBuffer(1, length, context.sampleRate);
  const data = out.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return out;
}

/**
 * Wire up one card sound. Exported so a test can render it through an
 * OfflineAudioContext and measure what it actually produces.
 *
 * Deal is a card being *drawn*, and a draw has its accent at the end rather
 * than the start: the card slides, the friction brightening as it picks up
 * speed, and then its edge clears the deck and lets go with a short bright
 * snap. (This used to be built the other way round, loudest where the card
 * started moving, which is what a card thrown down sounds like, not one
 * pulled off the top.) After the release there's a breath of the card still
 * travelling, and nothing below the voice: paper has no bottom end.
 *
 * Gather: it lands. Shorter, darker, falling rather than rising, with a soft
 * thump underneath for the body of the deck it lands on.
 */
// When the card's edge clears the deck, as a fraction of a second after the
// sound starts. Kept short deliberately: the ear hears the snap as the moment
// the sound happened, and that moment has to land on the card leaving the
// screen, not 100ms behind it.
const DRAW_RELEASE = 0.042;

export function buildCardSound(
  context: BaseAudioContext,
  noiseBuffer: AudioBuffer,
  kind: CardSound,
  at: number,
  destination: AudioNode,
  volume = CARD_VOLUME
) {
  const deal = kind === "deal";
  // Each card sounds slightly different, as each one would.
  const vary = 0.92 + Math.random() * 0.16;

  // Paper doesn't hiss: roll off the top so the noise reads as a card rather
  // than as static. Everything in this sound goes through it.
  const air = context.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.value = deal ? 8000 : 9000;
  air.connect(destination);

  const src = context.createBufferSource();
  src.buffer = noiseBuffer;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = deal ? 0.8 : 0.9;
  const gain = context.createGain();

  if (deal) {
    // The slide: the band opens upward as the card speeds up, and the level
    // rises with it, so the whole thing leans into the release.
    const from = 1100 * vary;
    band.frequency.setValueAtTime(from, at);
    band.frequency.exponentialRampToValueAtTime(from * 2.6, at + DRAW_RELEASE);
    band.frequency.exponentialRampToValueAtTime(from * 1.5, at + 0.13);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume * 0.62, at + DRAW_RELEASE);
    // The tail is the card still moving, well under the snap.
    gain.gain.exponentialRampToValueAtTime(volume * 0.14, at + DRAW_RELEASE + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    src.connect(band).connect(gain).connect(air);
    src.start(at, Math.random() * 0.3, 0.16);

    // The edge letting go. Short, bright and the loudest thing here — this
    // is the part the ear reads as "a card".
    const snap = context.createBufferSource();
    snap.buffer = noiseBuffer;
    const high = context.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 3800;
    const snapGain = context.createGain();
    snapGain.gain.setValueAtTime(0.0001, at + DRAW_RELEASE - 0.004);
    // Half the nominal level: high noise is spiky, and at full gain the
    // release peaked three times as high as the tick for the same loudness.
    snapGain.gain.exponentialRampToValueAtTime(volume * 0.5, at + DRAW_RELEASE);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, at + DRAW_RELEASE + 0.035);
    snap.connect(high).connect(snapGain).connect(air);
    snap.start(at + DRAW_RELEASE - 0.004, Math.random() * 0.3, 0.05);
    return;
  }

  const top = 2600 * vary;
  const length = 0.05;
  band.frequency.setValueAtTime(top, at);
  band.frequency.exponentialRampToValueAtTime(top * 0.5, at + length);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(band).connect(gain).connect(air);
  // Start somewhere random in the noise so repeats aren't the same sample.
  src.start(at, Math.random() * 0.4, length + 0.02);

  // The deck itself, struck: a short low thump under the landing.
  const body = context.createOscillator();
  body.frequency.value = 170 * vary;
  const bodyGain = context.createGain();
  bodyGain.gain.setValueAtTime(0, at);
  bodyGain.gain.linearRampToValueAtTime(volume * 0.09, at + 0.003);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.025);
  body.connect(bodyGain).connect(destination);
  body.start(at);
  body.stop(at + 0.05);
}

/**
 * The column slider: pages riffling past a thumb — a fast paper shuffle.
 *
 * Not one sound but a burst of four to six, 14-26ms apart, each a sliver of
 * filtered noise with a hard decay: that spacing is the whole effect, because
 * the ear stops counting individual edges somewhere around 30ms apart and
 * hears a flutter instead. The band climbs slightly through the burst and the
 * taps get quieter, so the run reads as a flick that's running out rather
 * than a loop. Drag through several stops and the bursts land on each other
 * and it simply keeps riffling.
 *
 * (The first version of this was one smooth 150ms rub, which was the right
 * material but the wrong gesture — a single slow slide, where this is the
 * fast shuffle it should have been.)
 */
const FLIP_VOLUME = 0.22;
const FLIP_TAP = 0.013;
// A burst is ~90ms, so this lets two overlap but not five.
const FLIP_MIN_INTERVAL_MS = 55;
let lastFlip = 0;

export function buildFlipSound(
  context: BaseAudioContext,
  noiseBuffer: AudioBuffer,
  at: number,
  destination: AudioNode,
  volume = FLIP_VOLUME
) {
  // Every riffle is a different one: a few more or fewer pages, a slightly
  // different thickness to them.
  const taps = 4 + Math.floor(Math.random() * 3);
  const vary = 0.9 + Math.random() * 0.2;

  // One roll-off for the whole burst: paper, not static.
  const air = context.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.value = 7500;
  air.connect(destination);

  let t = at;
  for (let i = 0; i < taps; i++) {
    const src = context.createBufferSource();
    src.buffer = noiseBuffer;
    const band = context.createBiquadFilter();
    band.type = "bandpass";
    // Tight enough to be an edge rather than a hiss, broad enough not to ring.
    band.Q.value = 1.3;
    band.frequency.value = (1900 + i * 260) * vary;

    const gain = context.createGain();
    // Each tap fades up over 2ms rather than starting flat: that's the
    // difference between paper and a row of clicks.
    const level = volume * (1 - (i / taps) * 0.5);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + FLIP_TAP);

    src.connect(band).connect(gain).connect(air);
    src.start(t, Math.random() * 0.3, FLIP_TAP + 0.01);
    src.stop(t + FLIP_TAP + 0.01);
    t += 0.014 + Math.random() * 0.012;
  }
}

/** Create the audio context and unlock it on the first real user gesture. */
export function primeTickSound() {
  if (typeof window === "undefined" || ctx) return () => {};
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) return () => {};

  const context = new AudioCtor();
  ctx = context;
  buffer = buildBuffer(context);
  noise = buildNoise(context);

  const detach = () =>
    GESTURES.forEach((e) => window.removeEventListener(e, unlock, true));

  function unlock() {
    if (context.state === "running") {
      detach();
      return;
    }
    void context.resume();
    // Safari only fully unlocks once something has actually been played
    // inside the gesture, so play a single silent sample.
    const silent = context.createBufferSource();
    silent.buffer = context.createBuffer(1, 1, context.sampleRate);
    silent.connect(context.destination);
    silent.start();
  }

  // Capture phase, so a click a component stops from propagating still counts.
  GESTURES.forEach((e) =>
    window.addEventListener(e, unlock, { capture: true, passive: true })
  );

  return () => {
    detach();
    void context.close();
    if (ctx === context) {
      ctx = null;
      buffer = null;
      noise = null;
    }
  };
}

export function playTick() {
  if (!ctx || !buffer) return;
  if (ctx.state !== "running") {
    // Chrome lets a context resume any time after the page has had a gesture,
    // even outside the handler — covers a click that landed before we were
    // listening. Silent this time; the next crossing will sound.
    if (navigator.userActivation?.hasBeenActive) void ctx.resume();
    return;
  }
  const now = performance.now();
  if (now - lastPlayed < MIN_INTERVAL_MS) return;
  lastPlayed = now;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  // Slight pitch variance so a run of ticks doesn't sound machine-identical.
  source.playbackRate.value = 0.98 + Math.random() * 0.04;
  const gain = ctx.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain).connect(ctx.destination);
  source.start();

  // A tiny haptic pulse where supported (Android). iOS has no vibration API.
  if (coarsePointer ??= window.matchMedia("(pointer: coarse)").matches) {
    navigator.vibrate?.(4);
  }
}

/** One column more or less: a quick riffle of pages. */
export function playFlip() {
  if (!ctx || !noise) return;
  if (ctx.state !== "running") {
    if (navigator.userActivation?.hasBeenActive) void ctx.resume();
    return;
  }
  const now = performance.now();
  if (now - lastFlip < FLIP_MIN_INTERVAL_MS) return;
  lastFlip = now;
  buildFlipSound(ctx, noise, ctx.currentTime, ctx.destination);

  if ((coarsePointer ??= window.matchMedia("(pointer: coarse)").matches)) {
    navigator.vibrate?.(5);
  }
}

/** A card dealt off the deck, or gathered back onto it. */
export function playCard(kind: CardSound) {
  if (!ctx || !noise) return;
  if (ctx.state !== "running") {
    if (navigator.userActivation?.hasBeenActive) void ctx.resume();
    return;
  }
  const now = performance.now();
  if (now - lastCard < CARD_MIN_INTERVAL_MS) return;
  lastCard = now;
  buildCardSound(ctx, noise, kind, ctx.currentTime, ctx.destination);

  if ((coarsePointer ??= window.matchMedia("(pointer: coarse)").matches)) {
    navigator.vibrate?.(6);
  }
}

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Lets a test render these through an OfflineAudioContext and measure what
  // they actually produce — levels, spectrum, decay — without playing them.
  (window as unknown as Record<string, unknown>).__soundLab = {
    buildCardSound,
    buildFlipSound,
    buildTick: buildBuffer,
    buildNoise,
    VOLUME,
    CARD_VOLUME,
    FLIP_VOLUME,
  };
}

/** For debugging: "suspended" means the page hasn't had a click yet. */
export function tickSoundState() {
  return ctx?.state ?? "not-created";
}
