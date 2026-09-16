/**
 * A short mechanical "tick", synthesised once with Web Audio (no asset to
 * download) and replayed each time a card crosses the centre of the showcase.
 *
 * Browsers only let audio start after a real user gesture — click, tap or key
 * press. Scrolling with a wheel or trackpad does NOT count, so the ticks stay
 * silent until the visitor has interacted with the page once. That's a browser
 * rule, not something the site can work around.
 */

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let lastPlayed = 0;

// Fast flings can cross several cards in one frame; one tick per ~45ms keeps
// it reading as a ratchet rather than a buzz.
const MIN_INTERVAL_MS = 45;
const VOLUME = 0.18;

function buildBuffer(context: AudioContext) {
  const rate = context.sampleRate;
  const length = Math.floor(rate * 0.03);
  const out = context.createBuffer(1, length, rate);
  const data = out.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    // A very short noise transient for the "click", plus a quickly damped
    // tone that gives it a little body so it doesn't sound like static.
    const click = (Math.random() * 2 - 1) * Math.exp(-t / 0.004);
    const body = Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-t / 0.008);
    data[i] = 0.6 * click + 0.4 * body;
    peak = Math.max(peak, Math.abs(data[i]));
  }
  for (let i = 0; i < length; i++) data[i] /= peak || 1;
  return out;
}

/** Create the audio context and unlock it on the first real user gesture. */
export function primeTickSound() {
  if (typeof window === "undefined" || ctx) return () => {};
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) return () => {};

  ctx = new AudioCtor();
  buffer = buildBuffer(ctx);

  const unlock = () => {
    if (ctx && ctx.state !== "running") void ctx.resume();
  };
  const events = ["pointerdown", "keydown", "touchend"] as const;
  events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));

  return () => {
    events.forEach((e) => window.removeEventListener(e, unlock));
    void ctx?.close();
    ctx = null;
    buffer = null;
  };
}

export function playTick() {
  if (!ctx || !buffer || ctx.state !== "running") return;
  const now = performance.now();
  if (now - lastPlayed < MIN_INTERVAL_MS) return;
  lastPlayed = now;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  // Slight pitch variance so a run of ticks doesn't sound machine-identical.
  source.playbackRate.value = 0.97 + Math.random() * 0.06;
  const gain = ctx.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain).connect(ctx.destination);
  source.start();

  // A tiny haptic pulse where supported (Android). iOS has no vibration API.
  if (window.matchMedia("(pointer: coarse)").matches) navigator.vibrate?.(4);
}
