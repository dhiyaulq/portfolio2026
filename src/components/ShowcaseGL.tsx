"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import Lenis from "lenis";
import { urlFor } from "@/lib/sanity";
import { playCard, playTick, primeTickSound, tickSoundState } from "@/lib/tickSound";
import type { MediaItem, WorkListItem } from "@/lib/queries";
import LayoutSwitcher, { type Mode } from "@/components/LayoutSwitcher";

// ---------------------------------------------------------------------------
// Geometry. Desktop values come straight off the Figma "corousel state"
// frames (990px column); mobile off Figma 155:510 (402px screen).
//   1-col  800px wide cards
//   2-col  900px total, two cards side by side
//   3D     one 700px card centred, neighbours at 500 / 300 / 200
// Every card is 4:3. All numbers below are CSS pixels; the orthographic camera
// is set up 1 unit = 1 px so the scene matches the spec exactly.
// ---------------------------------------------------------------------------
const SIDEBAR_W = 457;
const LG_BREAKPOINT = 1024;
const RATIO = 3 / 4; // height = width * RATIO

const ONE_COL_W = 800;
const TWO_COL_W = 900;
const CARD_3D_W = 700;

const OFFSET_D = [-3, -2, -1, 0, 1, 2, 3];
const OFFSET_Y = [-338, -260, -135, 0, 135, 260, 338];
const OFFSET_X = [-400, -305, -155, 0, 155, 305, 400];
const DIST = [0, 1, 2, 3, 4];
const SCALE = [1, 0.714, 0.429, 0.286, 0.2];
// Mip-level bias for the receding 3D cards. Sampling a blurrier mipmap is both
// smoother and far cheaper than a multi-tap blur: one texture fetch, not five.
const BLUR = [0, 0.7, 1.5, 2.1, 2.7];
const FADE = [1, 0.9, 0.6, 0.28, 0];

// "Card" — a deck seen face on (Figma 175:556, 990px column). The front card
// is 700px and dead centre; each card behind is 50px narrower and sits a
// little lower, so all you see of it is a sliver below the one in front.
// Scrolling deals the front card off the top-right corner: it slides up and
// across, turning as it goes, while the deck promotes. `d` is depth — 0 is
// the front of the deck, negative is a card that has been dealt away.
const CARD_D = [-2, -1, 0, 1, 2, 3, 4, 5, 6];
// Figma measures down and right from the centre of the column.
const CARD_X = [616, 308, 0, 0, 0, 0, 0, 0, 0];
const CARD_Y = [-659, -330, 0, 38, 72, 109, 145, 181, 217];
const CARD_SCALE = [0.857, 0.929, 1, 0.929, 0.857, 0.786, 0.714, 0.643, 0.571];
// Degrees, clockwise on screen, as the dealt card turns away.
const CARD_ROT = [30, 15, 0, 0, 0, 0, 0, 0, 0];
// A dealt card is clear of the top edge by d = -1.4; the fade only covers the
// last of its travel so it doesn't dissolve in mid-air. The deep end fades
// out too, for decks longer than the design's five.
const CARD_FADE_D = [-1.8, -1.4, 0, 5, 6];
const CARD_FADE = [0, 1, 1, 1, 0];
const DEG = Math.PI / 180;

/**
 * colW / colH — the canvas. On touch devices colH is the tallest height seen
 * for this width, so the canvas still covers the screen if the browser's
 * toolbars collapse.
 * visH — the height actually visible right now. Anything that has to line
 * up with the real screen (where the stack is centred, how far a section
 * can scroll) uses this; using colH there left the 3D stack sitting low and
 * let short layouts scroll past their end while the toolbars were showing.
 */
type Viewport = { colW: number; colH: number; visH: number; wide: boolean };

// The switcher sits this far from the bottom of the screen (Tailwind
// bottom-8 / lg:bottom-12 in LayoutSwitcher) and is 40px tall.
const SWITCHER_OFFSET = { wide: 48, narrow: 32 };
const SWITCHER_H = 40;
// Clear space between the last card and the switcher when a column ends.
const END_CLEARANCE = 32;

/** Spacing for the showcase column, desktop vs mobile. */
function layoutOf(vp: Viewport) {
  const offset = vp.wide ? SWITCHER_OFFSET.wide : SWITCHER_OFFSET.narrow;
  const bottom = offset + SWITCHER_H + END_CLEARANCE;
  return vp.wide
    ? { side: 24, top: 48, gap: 24, bottom, radius: 8 }
    : { side: 16, top: 24, gap: 12, bottom, radius: 4 };
}

/** Piecewise-linear lookup, clamped at both ends. */
function lerpTable(stops: number[], values: number[], at: number) {
  if (at <= stops[0]) return values[0];
  const last = stops.length - 1;
  if (at >= stops[last]) return values[last];
  for (let i = 0; i < last; i++) {
    if (at <= stops[i + 1]) {
      const t = (at - stops[i]) / (stops[i + 1] - stops[i]);
      return values[i] + (values[i + 1] - values[i]) * t;
    }
  }
  return values[last];
}

/**
 * Figma's 3D frames assume a ~990px column. On anything narrower the whole rig
 * — card size *and* the neighbour offsets — scales down together, so the
 * composition stays identical instead of the focused card being cropped.
 * On a 402px phone that's a 370px card, exactly as designed.
 */
function fit3D(vp: Viewport) {
  const { side } = layoutOf(vp);
  return Math.min(
    1,
    (vp.colW - side * 2) / CARD_3D_W,
    (vp.visH - 96) / (CARD_3D_W * RATIO)
  );
}

/**
 * Texture width to request from Sanity, in *device* pixels.
 *
 * This has to match how big the card actually gets drawn. Ask for too little
 * and it's upscaled; ask for too much and it's worse, not better — the GPU
 * picks a mip level from the texel:pixel ratio, so an oversized texture just
 * blends in a half-resolution mipmap and softens everything. Matching the
 * largest on-screen size keeps sampling at mip 0, ~1:1.
 *
 * NOT quantised. It's tempting to round to 128px steps so a window resize
 * doesn't refetch, but any mismatch between texel count and device-pixel width
 * means no output pixel maps to exactly one texel — every pixel becomes a
 * blend of two and the whole card goes soft. Exact is the only crisp value.
 */
function textureSizeFor(vp: Viewport, dpr: number) {
  const { side } = layoutOf(vp);
  const oneCol = Math.min(ONE_COL_W, Math.max(vp.colW - side * 2, 240));
  const focus3D = CARD_3D_W * fit3D(vp);
  const cardCss = Math.max(oneCol, focus3D);
  // Width and height come from the same card size and any cap scales both
  // together. (An earlier floor raised only the width — 740 -> 768 on a
  // phone — so the image came back 768x556, wider than 4:3, and the shader
  // squeezed it ~3.5% to fit the card.)
  const w = Math.round(snapSize(cardCss, dpr) * dpr);
  const h = Math.round(snapSize(cardCss * RATIO, dpr) * dpr);
  const cap = Math.min(1, 2560 / w);
  // Ask for the card's exact aspect too. Otherwise cover-fit has to rescale a
  // 1.3329 image into a 1.3342 box, which resamples every row.
  return { w: Math.round(w * cap), h: Math.round(h * cap) };
}

/** Snap a world (== CSS pixel) position onto the device-pixel grid. */
function snap(v: number, dpr: number) {
  return Math.round(v * dpr) / dpr;
}

/**
 * Snap a size to an *even* number of device pixels. The quad is centred on its
 * position, so it spans ±size/2 — an odd device width would put both edges on
 * half-pixels even when the centre is perfectly snapped.
 */
function snapSize(v: number, dpr: number) {
  return (Math.round((v * dpr) / 2) * 2) / dpr;
}

function aspectOf(item: MediaItem | undefined) {
  const d = item?.dimensions;
  return d?.width && d?.height ? d.width / d.height : 4 / 3;
}

type Target = {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  blur: number;
  /** Radians, world convention (+y up), so clockwise on screen is negative. */
  rot: number;
};

/**
 * Layouts driven one card at a time rather than by a column of them: the two
 * 3D carousels and the card deck. They share their scroll mapping — one card
 * per 0.6 screens — and so their scroll height, focus and anchoring.
 */
function isStack(mode: Mode) {
  return mode === "3d-1" || mode === "3d-2" || mode === "card";
}

/** Card width/height for the flow layouts. */
function flowCardSize(mode: Mode, vp: Viewport) {
  const { side, gap } = layoutOf(vp);
  const usable = Math.max(vp.colW - side * 2, 240);
  if (mode === "2-col") {
    const w = (Math.min(TWO_COL_W, usable) - gap) / 2;
    return { w, h: w * RATIO };
  }
  const w = Math.min(ONE_COL_W, usable);
  return { w, h: w * RATIO };
}

/** Scrollable height of the showcase for a mode; real page scroll drives it. */
function contentHeight(mode: Mode, count: number, vp: Viewport) {
  if (isStack(mode)) {
    // Scroll distance per card is tied to the stable canvas height so the 3D
    // progress doesn't shift if the toolbars change; the extra screen is the
    // visible one, so the last card lands exactly at the end.
    return Math.max(count - 1, 1) * vp.colH * 0.6 + vp.visH;
  }
  const { top, gap, bottom } = layoutOf(vp);
  const { h } = flowCardSize(mode, vp);
  const rows = mode === "2-col" ? Math.ceil(count / 2) : count;
  // Never shorter than one screen. On mobile the showcase sits below the
  // hero, and if its content is shorter than the viewport (2-col on a phone)
  // the page can't scroll far enough for the section to reach the top — the
  // switcher would read that as "still in the hero", hide, and could never be
  // brought back.
  return Math.max(top + rows * (h + gap) - gap + bottom, vp.visH);
}

/**
 * Continuous "which card is at the centre" value for the current scroll: 2.0
 * means card (or row) 2 is dead centre, 2.5 means halfway to the next. The
 * tick sound fires whenever this crosses a whole number.
 */
function focusIndex(mode: Mode, count: number, local: number, vp: Viewport) {
  const last = Math.max(count - 1, 0);
  if (isStack(mode)) {
    const range = Math.max(contentHeight(mode, count, vp) - vp.visH, 1);
    return Math.min(Math.max(local / range, 0), 1) * last;
  }
  const { top, gap } = layoutOf(vp);
  const { h } = flowCardSize(mode, vp);
  const rows = mode === "2-col" ? Math.ceil(count / 2) : count;
  // Card centre sits at top + i*pitch + h/2 in section space; it's centred
  // when that equals the scroll offset + half the viewport.
  const f = (local + vp.visH / 2 - top - h / 2) / (h + gap);
  return Math.min(Math.max(f, 0), Math.max(rows - 1, 0));
}

/** How many whole numbers were crossed moving from `a` to `b`. */
function crossings(a: number, b: number) {
  return b > a ? Math.floor(b) - Math.floor(a) : Math.ceil(a) - Math.ceil(b);
}

/**
 * Where a card wants to be, in world (== pixel) space with the origin at the
 * centre of the canvas and +y up. This is the single source of truth for all
 * states; switching mode just changes what this returns, and the render loop
 * eases each plane toward it — which is what produces the transition.
 *
 * `local` is scroll measured from the top of the showcase section, not the
 * page. On desktop the sidebar is fixed, so the two are the same. On mobile
 * the sidebar sits above as a hero, so `local` is negative until you reach
 * the showcase — which is what keeps the cards below the hero.
 */
function targetFor(
  mode: Mode,
  index: number,
  count: number,
  local: number,
  vp: Viewport
): Target {
  const L = layoutOf(vp);
  if (mode === "card") {
    const range = Math.max(contentHeight(mode, count, vp) - vp.visH, 1);
    const progress = Math.min(Math.max(local / range, 0), 1);
    // Same sticky entrance as the 3D stage: the deck rides down with the page
    // until the section reaches the top, then stays put.
    const stageShift = Math.min(local, 0);
    const d = index - progress * Math.max(count - 1, 0);
    const fit = fit3D(vp);
    const w = CARD_3D_W * lerpTable(CARD_D, CARD_SCALE, d) * fit;
    return {
      x: lerpTable(CARD_D, CARD_X, d) * fit,
      // Figma offsets are measured downward; world +y is up.
      y: -lerpTable(CARD_D, CARD_Y, d) * fit + stageShift,
      w,
      h: w * RATIO,
      opacity: lerpTable(CARD_FADE_D, CARD_FADE, d),
      blur: 0,
      rot: -lerpTable(CARD_D, CARD_ROT, d) * DEG,
    };
  }

  if (mode === "3d-1" || mode === "3d-2") {
    const range = Math.max(contentHeight(mode, count, vp) - vp.visH, 1);
    const progress = Math.min(Math.max(local / range, 0), 1);
    // The 3D stage behaves like a sticky, screen-tall panel: it scrolls up
    // with the page until the section reaches the top, then stays pinned.
    const stageShift = Math.min(local, 0);
    const active = progress * Math.max(count - 1, 0);
    const d = index - active;
    const ad = Math.abs(d);
    const fit = fit3D(vp);
    const scale = lerpTable(DIST, SCALE, ad);
    const w = CARD_3D_W * scale * fit;
    return {
      x: mode === "3d-2" ? lerpTable(OFFSET_D, OFFSET_X, d) * fit : 0,
      // Figma offsets are measured downward; world +y is up.
      y: (mode === "3d-1" ? -lerpTable(OFFSET_D, OFFSET_Y, d) * fit : 0) + stageShift,
      w,
      h: w * RATIO,
      opacity: lerpTable(DIST, FADE, ad),
      blur: lerpTable(DIST, BLUR, ad),
      rot: 0,
    };
  }

  const { w, h } = flowCardSize(mode, vp);
  const pitch = h + L.gap;
  const col = mode === "2-col" ? index % 2 : 0;
  const row = mode === "2-col" ? Math.floor(index / 2) : index;
  const screenTop = L.top + row * pitch - local;
  return {
    x: mode === "2-col" ? (col - 0.5) * (w + L.gap) : 0,
    y: vp.colH / 2 - (screenTop + h / 2),
    w,
    h,
    opacity: 1,
    blur: 0,
    rot: 0,
  };
}

/**
 * Mobile 3D: centre the whole visible stack — not just the focused card — in
 * the free space between the top padding and the switcher's clearance. The
 * stack is lopsided (on the first card every neighbour sits below it), so
 * centring only the focused card left it looking low. Computed from the
 * targets, so it follows the stack smoothly as you scroll through it.
 */
function centreStack(targets: Target[], vp: Viewport, local: number) {
  let top = -Infinity;
  let bottom = Infinity;
  for (const t of targets) {
    if (t.opacity <= 0.01) continue;
    top = Math.max(top, t.y + t.h / 2); // world space, +y is up
    bottom = Math.min(bottom, t.y - t.h / 2);
  }
  if (!Number.isFinite(top)) return;
  const L = layoutOf(vp);
  const areaCentre = (L.top + vp.visH - L.bottom) / 2; // px from screen top
  // Keep the sticky entrance: before the section reaches the top, the stage
  // still rides below the hero by the same amount targetFor applied.
  const desired = vp.colH / 2 - areaCentre + Math.min(local, 0);
  const dy = desired - (top + bottom) / 2;
  for (const t of targets) t.y += dy;
}

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Cover-fit + rounded corners + a cheap 5-tap blur for the receding cards.
const FRAG = `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uBlur;
  uniform float uTexAspect;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uHasMap;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float planeAspect = uSize.x / uSize.y;
    float s = uTexAspect / planeAspect;
    if (s > 1.0) uv.x = (uv.x - 0.5) / s + 0.5;
    else         uv.y = (uv.y - 0.5) * s + 0.5;
    return uv;
  }

  void main() {
    vec2 uv = coverUv(vUv);
    // Placeholder grey, written in linear light so the sRGB encode below
    // lands it back on #E8E8E8.
    vec4 c = vec4(0.808, 0.808, 0.808, 1.0);
    if (uHasMap > 0.5) {
      // One fetch, always. uBlur is a mip bias, so a receding card samples a
      // smaller mipmap rather than paying for extra taps.
      c = texture2D(uMap, uv, uBlur);
    }

    // rounded-rect mask in screen pixels
    vec2 p = (vUv - 0.5) * uSize;
    vec2 q = abs(p) - (uSize * 0.5 - vec2(uRadius));
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    // Feather across exactly one device pixel, whatever the DPR. A fixed
    // ±1.0 CSS-pixel ramp is two device pixels on a retina screen, which
    // reads as a soft edge; fwidth keeps corners crisp at any density.
    float aa = max(fwidth(d), 1e-4);
    float mask = 1.0 - smoothstep(-aa, aa, d);

    // No discard for fully transparent pixels: blending already hides them,
    // and discard disables the early depth/tiling optimisations mobile GPUs
    // rely on, for every fragment of every card.
    gl_FragColor = vec4(c.rgb, mask * uOpacity);

    // three.js appends this to its built-in materials but NOT to a raw
    // ShaderMaterial. Without it we'd write linear-light values into an sRGB
    // framebuffer and every image would render dark and over-contrasted.
    #include <colorspace_fragment>
  }
`;

export default function ShowcaseGL({ works }: { works: WorkListItem[] }) {
  const [mode, setMode] = useState<Mode>("1-col");
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>(mode);
  const anchorRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  // True from a mode switch until the cards arrive. Only then do the planes
  // ease on their own; the rest of the time Lenis has already smoothed the
  // scroll, and easing on top of it again would make the cards trail.
  const settlingRef = useRef(false);
  // The showcase section, and the viewport the scene is laid out against.
  // Handlers outside the render loop read these so they agree with it exactly.
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  // The switcher only shows once the showcase has scrolled to the top — on
  // desktop that's always; on mobile it waits until you're past the hero.
  const [switcherVisible, setSwitcherVisible] = useState(false);
  // Desktop (sidebar column) vs mobile (hero above). 3D-2 is desktop-only:
  // on a phone a sideways swipe can't drive it.
  const [wideLayout, setWideLayout] = useState(true);
  const count = works.length;
  const lastIndex = Math.max(count - 1, 0);

  const [docHeight, setDocHeight] = useState(0);

  // --- the scene -----------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || count === 0) return;

    // antialias:false on purpose — every edge in this scene comes from the
    // shader's rounded-rect mask, which anti-aliases itself. MSAA would cost
    // 4x the framebuffer bandwidth to smooth edges that no longer exist.
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    const geometry = new THREE.PlaneGeometry(1, 1);
    // Phones: cap anisotropic filtering at 4x. The device maximum (often 16x)
    // buys nothing visible on cards this size and costs every minified fetch.
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const anisotropy = Math.min(
      renderer.capabilities.getMaxAnisotropy(),
      coarsePointer ? 4 : 16
    );
    let disposed = false;

    const wide = window.innerWidth >= LG_BREAKPOINT;
    const viewport: Viewport = {
      colW: wide ? window.innerWidth - SIDEBAR_W : window.innerWidth,
      colH: window.innerHeight,
      visH: window.innerHeight,
      wide,
    };
    viewportRef.current = viewport;
    // Fixed for the life of the scene: swapping texture sizes mid-session
    // would refetch every image and flash.
    const tex = textureSizeFor(viewport, dpr);
    let needsRender = true;
    let renderCount = 0;
    let tickCount = 0;
    // Dev-only counters: how many times each sound has been asked for.
    const sounds = { tick: 0, deal: 0, gather: 0 };

    const planes = works.map((work) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uOpacity: { value: 1 },
          uBlur: { value: 0 },
          uTexAspect: { value: 4 / 3 },
          uSize: { value: new THREE.Vector2(1, 1) },
          uRadius: { value: 8 },
          uHasMap: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Textures come straight from the Sanity CDN — same data pipeline as
      // before, so publishing in Studio still just works.
      const first = work.gallery?.length ? work.gallery[0] : work.coverImage;
      let src = "";
      let load = () => {};
      if (first && first._type !== "video") {
        // auto("format") serves WebP/AVIF where supported — noticeably cleaner
        // than JPEG on the fine text in UI screenshots at the same byte size.
        const url = urlFor(first)
          .width(tex.w)
          .height(tex.h)
          .fit("crop")
          .quality(95)
          .auto("format")
          .url();
        src = url;
        let requested = false;
        // Deferred: called from the render loop once this card is near enough
        // to matter. Keeps first paint cheap and bounds texture memory as the
        // number of works grows.
        load = () => {
          if (requested) return;
          requested = true;
          // Decode off the main thread (img.decode) and upload to the GPU as
          // soon as it's ready, while the card is still off-screen. Letting
          // three do both lazily on first draw put a decode + upload stall on
          // exactly the frame the card scrolled into view.
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.decoding = "async";
          img.src = url;
          img
            .decode()
            .then(() => {
              if (disposed) return;
              const texture = new THREE.Texture(img);
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.generateMipmaps = true;
              texture.minFilter = THREE.LinearMipmapLinearFilter;
              texture.anisotropy = anisotropy;
              texture.needsUpdate = true;
              renderer.initTexture(texture);
              material.uniforms.uMap.value = texture;
              // The aspect of the image actually delivered, not of the
              // original upload: the CDN crops to the requested box, and
              // cover-fit has to work from what's really in the texture.
              material.uniforms.uTexAspect.value =
                img.naturalWidth && img.naturalHeight
                  ? img.naturalWidth / img.naturalHeight
                  : aspectOf(first);
              material.uniforms.uHasMap.value = 1;
              needsRender = true;
            })
            .catch(() => {
              // Failed to load; the card keeps its placeholder grey.
            });
        };
      }

      return { mesh, material, current: null as Target | null, src, load };
    });

    // Phones resize the viewport whenever the address bar slides in or out,
    // which would re-flow every card and jump the 3D progress mid-scroll. On
    // touch devices a height-only change is ignored (we keep the tallest
    // height seen for this width); a width change — rotation — resets it.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let lastWidth = window.innerWidth;
    const resize = () => {
      const width = window.innerWidth;
      const wide = width >= LG_BREAKPOINT;
      viewport.colW = wide ? width - SIDEBAR_W : width;
      viewport.wide = wide;
      viewport.colH =
        coarse && width === lastWidth
          ? Math.max(viewport.colH, window.innerHeight)
          : window.innerHeight;
      viewport.visH = window.innerHeight;
      lastWidth = width;
      // updateStyle must stay on: without a CSS size the canvas lays itself
      // out at its drawing-buffer size, which is colW * devicePixelRatio.
      renderer.setSize(viewport.colW, viewport.colH);
      camera.left = -viewport.colW / 2;
      camera.right = viewport.colW / 2;
      camera.top = viewport.colH / 2;
      camera.bottom = -viewport.colH / 2;
      camera.updateProjectionMatrix();
      // Corners are 8px on desktop, 4px in the mobile design.
      const { radius } = layoutOf(viewport);
      planes.forEach((p) => (p.material.uniforms.uRadius.value = radius));
      setWideLayout(wide);
      // The nested-scroll check walks every element under the pointer with
      // getComputedStyle. Only the desktop sidebar can scroll on its own, so
      // don't pay for it on phones.
      if (lenisRef.current) lenisRef.current.options.allowNestedScroll = wide;
      setDocHeight(contentHeight(modeRef.current, count, viewport));
      needsRender = true;
    };
    // Smooth scrolling for the whole page. Driven from the render loop below
    // (autoRaf off) so the scroll value the cards read each frame is the one
    // Lenis just wrote — two independent rAF loops could leave the cards one
    // frame behind. allowNestedScroll lets the sidebar still scroll natively
    // on short screens. Lenis honours prefers-reduced-motion on its own.
    //
    // syncTouch matters on phones: native touch scrolling moves the page on
    // the compositor thread while the WebGL cards are drawn on the main
    // thread a frame later, so hero and cards visibly slip against each other
    // as the showcase comes in. Letting Lenis drive touch too keeps both in
    // the same frame.
    const lenis = new Lenis({
      autoRaf: false,
      allowNestedScroll: true,
      syncTouch: true,
    });
    lenis.options.gestureOrientation =
      modeRef.current === "3d-2" ? "both" : "vertical";
    lenisRef.current = lenis;

    const stopSound = primeTickSound();
    let lastFocus: number | null = null;
    let lastFocusMode = modeRef.current;

    const resizeAll = () => {
      resize();
      // A resize moves every card, which would read as a burst of crossings.
      lastFocus = null;
    };
    resize();
    window.addEventListener("resize", resizeAll);

    let raf = 0;
    let first = true;
    let lastFrameScroll = -1;
    let lastFrameMode = modeRef.current;
    let lastMotion = Infinity;
    let shown: boolean | null = null;

    // Magnetic hero/showcase boundary (mobile). If scrolling comes to rest
    // with the showcase's top edge in the upper part of the screen, glide the
    // rest of the way so the section sits flush and the switcher is ready;
    // if the visitor was heading back up, glide to show the hero's end
    // instead. Outside that zone scrolling is left completely alone.
    const SNAP_ZONE = 0.4; // fraction of the screen height
    const SNAP_IDLE_MS = 140;
    let lastScrollY = window.scrollY;
    let lastDir = 0;
    let stillSince = performance.now();
    let snapUntil = 0;
    let touching = false;
    const onTouchStart = () => {
      touching = true;
      snapUntil = 0; // a new touch cancels any glide in progress
      // With syncTouch, Lenis applies each finger movement to its own record
      // of the scroll position. If the page moved without Lenis noticing
      // (scroll restoration on reload, a browser jump), that record is stale
      // and the first drag would leap there. Re-read it before the drag
      // starts — unless Lenis is mid-inertia, which this would cut short.
      if (!lenis.isScrolling) lenis.resize();
    };
    const onTouchEnd = () => {
      touching = false;
      stillSince = performance.now();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    let prev = performance.now();
    // Exponential damping for mode transitions, expressed per second rather
    // than per frame so it feels identical on 60Hz and 120Hz displays.
    const LAMBDA = 9;

    const frame = (now: number) => {
      // Clamp dt so returning to a backgrounded tab doesn't teleport cards.
      const dt = Math.min((now - prev) / 1000, 1 / 20);
      prev = now;
      lenis.raf(now);
      const scrollY = window.scrollY;
      // Scroll measured from the top of the showcase section (0 on desktop,
      // the hero's height on mobile). offsetTop is cheap when layout is clean.
      const origin = rootRef.current?.offsetTop ?? 0;
      const local = scrollY - origin;
      const m = modeRef.current;
      let motion = 0;

      if (Math.abs(scrollY - lastScrollY) > 0.5) {
        lastDir = Math.sign(scrollY - lastScrollY);
        stillSince = now;
      }
      lastScrollY = scrollY;
      if (
        !viewport.wide &&
        !touching &&
        // Wait for any touch inertia Lenis is still running to finish.
        !lenis.isScrolling &&
        now > snapUntil &&
        !settlingRef.current &&
        now - stillSince > SNAP_IDLE_MS &&
        local < -1 &&
        local > -viewport.visH * SNAP_ZONE
      ) {
        const target = lastDir < 0 ? origin - viewport.visH : origin;
        // Time-boxed rather than waiting on onComplete: a touch or wheel can
        // stop Lenis mid-glide, and the callback would then never fire.
        snapUntil = now + 700;
        // Re-measure first: Lenis clamps scrollTo against a cached page height
        // and its own record of where the page is, and either can be stale
        // here — a stale limit clamps the glide to nowhere.
        lenis.resize();
        lenis.scrollTo(Math.max(target, 0), {
          duration: 0.55,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
      }

      // Show the switcher once the showcase reaches the top of the screen and
      // hide it again back in the hero. The 24px band stops it flickering if
      // someone rests right on the boundary.
      const show = local >= 0 ? true : local < -24 ? false : (shown ?? false);
      if (show !== shown) {
        shown = show;
        setSwitcherVisible(show);
      }

      // Tick each time a card passes through the centre — 3D layouts only,
      // where cards click through one at a time like a dial; in the column
      // layouts it felt disconnected from the motion. A mode switch jumps the
      // index outright, so it re-baselines instead of counting.
      const focus = focusIndex(m, count, local, viewport);
      if (
        lastFocus !== null &&
        m === lastFocusMode &&
        crossings(lastFocus, focus) > 0
      ) {
        // The 3D carousels click like a dial; the deck deals and gathers,
        // which is a different sound in each direction.
        if (m === "3d-1" || m === "3d-2") {
          playTick();
          sounds.tick++;
        } else if (m === "card") {
          const kind = focus > lastFocus ? "deal" : "gather";
          playCard(kind);
          sounds[kind]++;
        }
      }
      lastFocus = focus;
      lastFocusMode = m;

      // Snap on the first frame. During a mode switch, ease so each card
      // glides to its new slot; otherwise follow Lenis's already-smoothed
      // scroll exactly.
      const k = first ? 1 : settlingRef.current ? 1 - Math.exp(-LAMBDA * dt) : 1;

      // Nothing can have moved: same scroll, same mode, no mode transition
      // easing, no resize or new texture, and the cards were already at rest
      // last frame. Skip recomputing every card's position.
      if (
        !first &&
        scrollY === lastFrameScroll &&
        m === lastFrameMode &&
        !settlingRef.current &&
        !needsRender &&
        lastMotion <= 0.01
      ) {
        tickCount++;
        return;
      }
      lastFrameScroll = scrollY;
      lastFrameMode = m;

      const targets = planes.map((_, i) => targetFor(m, i, count, local, viewport));
      if (!viewport.wide && (m === "3d-1" || m === "3d-2")) {
        centreStack(targets, viewport, local);
      }

      planes.forEach((p, i) => {
        const t = targets[i];

        // Pull the texture in just before it's needed, judged on the *target*
        // rather than the eased position so it arrives ahead of the card.
        const screenTop = viewport.colH / 2 - t.y - t.h / 2;
        if (
          t.opacity > 0.01 &&
          // Three screens of lead time, so the decode + GPU upload has long
          // finished before a card actually scrolls into view.
          screenTop < viewport.colH * 3 &&
          screenTop + t.h > -viewport.colH * 0.5
        ) {
          p.load();
        }

        const c = p.current ?? { ...t };
        motion = Math.max(
          motion,
          Math.abs(t.x - c.x),
          Math.abs(t.y - c.y),
          Math.abs(t.w - c.w),
          Math.abs(t.opacity - c.opacity) * 100,
          // Radians are small numbers; a degree of turn is worth about as
          // much to the eye as a few pixels of travel.
          Math.abs(t.rot - c.rot) * 200
        );
        c.x += (t.x - c.x) * k;
        c.y += (t.y - c.y) * k;
        c.w += (t.w - c.w) * k;
        c.h += (t.h - c.h) * k;
        c.opacity += (t.opacity - c.opacity) * k;
        c.blur += (t.blur - c.blur) * k;
        c.rot += (t.rot - c.rot) * k;
        p.current = c;

        // Land the quad on whole device pixels. Without this a card rests at
        // a fractional offset (e.g. y=282.75, h=778.5), the texel grid never
        // lines up with the screen grid, and bilinear sampling softens every
        // edge and glyph in the image — the difference between "HD" and not.
        const sw = snapSize(c.w, dpr);
        const sh = snapSize(c.h, dpr);
        p.mesh.position.set(snap(c.x, dpr), snap(c.y, dpr), -Math.abs(i) * 0.001);
        p.mesh.scale.set(sw, sh, 1);
        p.mesh.rotation.z = c.rot;
        // Nearer-to-focus cards draw on top. The deck is different: a card
        // dealt off the top passes over the ones still on the pile, and it
        // shrinks as it goes — by width alone it would slide under the card
        // that just took its place. Deal order is the draw order there.
        p.mesh.renderOrder = m === "card" ? count - i : Math.round(c.w);
        p.material.uniforms.uOpacity.value = c.opacity;
        p.material.uniforms.uBlur.value = c.blur;
        p.material.uniforms.uSize.value.set(sw, sh);
      });

      first = false;
      if (settlingRef.current && motion < 0.5) settlingRef.current = false;
      if (process.env.NODE_ENV === "development") {
        (window as unknown as Record<string, unknown>).__gl = {
          mode: m,
          scrollY,
          viewport: { ...viewport },
          renderCount,
          tickCount,
          textures: renderer.info.memory.textures,
          sound: tickSoundState(),
          sounds: { ...sounds },
          planes: planes.map((p) => ({ ...p.current, src: p.src })),
        };
      }
      // Draw only when something actually changed. Once the cards settle, this
      // scene costs nothing until the next scroll, resize or mode switch —
      // which is what keeps a full-screen GPU canvas off the battery while
      // someone is just reading the page.
      lastMotion = motion;
      if (needsRender || motion > 0.01) {
        renderer.render(scene, camera);
        needsRender = false;
        renderCount++;
      }
      tickCount++;
    };
    const tick = (now: number) => {
      frame(now);
      raf = requestAnimationFrame(tick);
    };
    tick(prev);
    if (process.env.NODE_ENV === "development") {
      // Lets a test advance exactly one frame while the tab is hidden (when
      // requestAnimationFrame is paused) without queueing extra loops.
      (window as unknown as Record<string, unknown>).__glStep = () =>
        frame(performance.now());
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resizeAll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      lenis.destroy();
      lenisRef.current = null;
      stopSound();
      planes.forEach((p) => {
        p.material.uniforms.uMap.value?.dispose();
        p.material.dispose();
      });
      geometry.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [works, count]);

  // --- mode changes keep the work you were looking at ----------------------
  // Everything here is in section-local scroll and uses the same viewport the
  // render loop lays out against (which ignores address-bar height changes on
  // phones), so the two can't disagree about where a card is.
  const currentViewport = (): Viewport => {
    const vp = viewportRef.current;
    if (vp) return vp;
    const w = window.innerWidth;
    const wide = w >= LG_BREAKPOINT;
    return { colW: wide ? w - SIDEBAR_W : w, colH: window.innerHeight, visH: window.innerHeight, wide };
  };
  const sectionTop = () => rootRef.current?.offsetTop ?? 0;

  const readAnchor = (m: Mode) => {
    const vp = currentViewport();
    const local = Math.max(window.scrollY - sectionTop(), 0);
    if (isStack(m)) {
      const range = Math.max(contentHeight(m, count, vp) - vp.visH, 1);
      return Math.round(Math.min(local / range, 1) * lastIndex);
    }
    const { top, gap } = layoutOf(vp);
    const { h } = flowCardSize(m, vp);
    const row = Math.round(Math.max(local - top + 1, 0) / (h + gap));
    return Math.min(m === "2-col" ? row * 2 : row, lastIndex);
  };

  /** Section-local scroll offset that puts `anchor` in view in mode `m`. */
  const scrollForAnchor = (m: Mode, anchor: number) => {
    const vp = currentViewport();
    const max = Math.max(contentHeight(m, count, vp) - vp.visH, 0);
    if (isStack(m)) {
      const progress = lastIndex > 0 ? anchor / lastIndex : 0;
      return Math.min(progress * max, max);
    }
    const { gap } = layoutOf(vp);
    const { h } = flowCardSize(m, vp);
    const row = m === "2-col" ? Math.floor(anchor / 2) : anchor;
    return Math.min(Math.max(row * (h + gap), 0), max);
  };

  const handleModeChange = (next: Mode) => {
    const anchor = readAnchor(modeRef.current);
    const nextHeight = contentHeight(next, count, currentViewport());
    const nextScroll = sectionTop() + scrollForAnchor(next, anchor);

    // Spacer height, scroll offset and mode must all change in one synchronous
    // block. Flipping the mode first (and deferring the scroll to rAF) let the
    // render loop spend a frame easing toward targets derived from the OLD
    // scroll offset, then reverse once the scroll landed — that reversal was
    // the wobble. The spacer is resized imperatively rather than through state
    // because React wouldn't commit the new height until after the browser had
    // already clamped scrollTo against the old one.
    anchorRef.current = anchor;
    if (spacerRef.current) spacerRef.current.style.height = `${nextHeight}px`;
    const lenis = lenisRef.current;
    if (lenis) {
      // Lenis clamps scrollTo against a cached page height, so it has to
      // re-measure after the spacer changes or the jump lands short.
      lenis.resize();
      lenis.scrollTo(nextScroll, { immediate: true, force: true });
      // 3D-2 lays the cards out sideways, so a horizontal trackpad swipe
      // should drive it too.
      lenis.options.gestureOrientation = next === "3d-2" ? "both" : "vertical";
    } else {
      window.scrollTo({ top: nextScroll, behavior: "instant" });
    }
    settlingRef.current = true;
    modeRef.current = next;
    setMode(next);
    setDocHeight(nextHeight);
  };

  useEffect(() => {
    setDocHeight(contentHeight(mode, count, currentViewport()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, count]);

  // Lenis caches the page height and only refreshes it from a debounced
  // ResizeObserver, so right after load (spacer still 0px) or a height change
  // it can believe there's nothing to scroll and swallow wheel/touch input.
  // Re-measure as soon as the new spacer height is in the DOM. Dimensions
  // only — a full resize() would also cancel any scroll in progress.
  useLayoutEffect(() => {
    lenisRef.current?.dimensions.resize();
  }, [docHeight]);

  // 3D-2 doesn't exist on mobile; if the window narrows while it's active,
  // fall back to its vertical sibling rather than leave a hidden mode on.
  useEffect(() => {
    if (!wideLayout && mode === "3d-2") handleModeChange("3d-1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wideLayout, mode]);

  return (
    <div ref={rootRef} className="w-full flex-1">
      {/* Fixed canvas over the showcase column; the spacer below gives the
          page something to scroll so wheel/trackpad still drive everything. */}
      <div
        ref={mountRef}
        aria-hidden
        className="pointer-events-none fixed inset-y-0 right-0 left-0 z-0 lg:left-[457px]"
      />
      <div ref={spacerRef} style={{ height: docHeight }} aria-hidden />

      {count === 0 ? (
        <p className="p-10 text-sm text-muted">
          No work uploaded yet. Go to{" "}
          <a href="/studio" className="underline">
            /studio
          </a>{" "}
          to add your first project.
        </p>
      ) : (
        <LayoutSwitcher
          mode={mode}
          onChange={handleModeChange}
          visible={switcherVisible}
          modes={wideLayout ? undefined : ["1-col", "2-col", "3d-1", "card"]}
        />
      )}
    </div>
  );
}
