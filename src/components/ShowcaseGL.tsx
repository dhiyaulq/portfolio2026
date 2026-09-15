"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { urlFor } from "@/lib/sanity";
import type { MediaItem, WorkListItem } from "@/lib/queries";
import LayoutSwitcher, { type Mode } from "@/components/LayoutSwitcher";

// ---------------------------------------------------------------------------
// Geometry, straight off the Figma "corousel state" frames (990px column).
//   1-col  800px wide cards, 24px gaps
//   2-col  900px total, two 438px cards, 24px gaps
//   3D     one 700px card centred, neighbours at 500 / 300 / 200
// Every card is 4:3. All numbers below are CSS pixels; the orthographic camera
// is set up 1 unit = 1 px so the scene matches the spec exactly.
// ---------------------------------------------------------------------------
const SIDEBAR_W = 457;
const LG_BREAKPOINT = 1024;
const GAP = 24;
const TOP_PAD = 48;
const BOTTOM_PAD = 112;
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
 */
function fit3D(colW: number, colH: number) {
  return Math.min(1, (colW - 48) / CARD_3D_W, (colH - 96) / (CARD_3D_W * RATIO));
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
function textureSizeFor(colW: number, colH: number, dpr: number) {
  const oneCol = Math.min(ONE_COL_W, Math.max(colW - 48, 240));
  const focus3D = CARD_3D_W * fit3D(colW, colH);
  const cardCss = Math.max(oneCol, focus3D);
  const w = Math.min(Math.max(Math.round(snapSize(cardCss, dpr) * dpr), 768), 2560);
  // Ask for the card's exact aspect too. Otherwise cover-fit has to rescale a
  // 1.3329 image into a 1.3342 box, which resamples every row.
  return { w, h: Math.round(snapSize(cardCss * RATIO, dpr) * dpr) };
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
};

type Viewport = { colW: number; colH: number; is3D: boolean };

/** Card width/height for the flow layouts at a given column width. */
function flowCardSize(mode: Mode, colW: number) {
  const usable = Math.max(colW - 48, 240);
  if (mode === "2-col") {
    const w = (Math.min(TWO_COL_W, usable) - GAP) / 2;
    return { w, h: w * RATIO };
  }
  const w = Math.min(ONE_COL_W, usable);
  return { w, h: w * RATIO };
}

/** Scrollable document height for a mode, so real page scroll still drives it. */
function contentHeight(mode: Mode, count: number, colW: number, viewportH: number) {
  if (mode === "3d-1" || mode === "3d-2") {
    return Math.max(count - 1, 1) * viewportH * 0.6 + viewportH;
  }
  const { h } = flowCardSize(mode, colW);
  const rows = mode === "2-col" ? Math.ceil(count / 2) : count;
  return TOP_PAD + rows * (h + GAP) - GAP + BOTTOM_PAD;
}

/**
 * Where a card wants to be, in world (== pixel) space with the origin at the
 * centre of the canvas and +y up. This is the single source of truth for all
 * four states; switching mode just changes what this returns, and the render
 * loop eases each plane toward it — which is what produces the transition.
 */
function targetFor(
  mode: Mode,
  index: number,
  count: number,
  scrollY: number,
  vp: Viewport
): Target {
  if (mode === "3d-1" || mode === "3d-2") {
    const range = Math.max(contentHeight(mode, count, vp.colW, vp.colH) - vp.colH, 1);
    const progress = Math.min(Math.max(scrollY / range, 0), 1);
    const active = progress * Math.max(count - 1, 0);
    const d = index - active;
    const ad = Math.abs(d);
    const fit = fit3D(vp.colW, vp.colH);
    const scale = lerpTable(DIST, SCALE, ad);
    const w = CARD_3D_W * scale * fit;
    return {
      x: mode === "3d-2" ? lerpTable(OFFSET_D, OFFSET_X, d) * fit : 0,
      // Figma offsets are measured downward; world +y is up.
      y: mode === "3d-1" ? -lerpTable(OFFSET_D, OFFSET_Y, d) * fit : 0,
      w,
      h: w * RATIO,
      opacity: lerpTable(DIST, FADE, ad),
      blur: lerpTable(DIST, BLUR, ad),
    };
  }

  const { w, h } = flowCardSize(mode, vp.colW);
  const pitch = h + GAP;
  const col = mode === "2-col" ? index % 2 : 0;
  const row = mode === "2-col" ? Math.floor(index / 2) : index;
  const screenTop = TOP_PAD + row * pitch - scrollY;
  return {
    x: mode === "2-col" ? (col - 0.5) * (w + GAP) : 0,
    y: vp.colH / 2 - (screenTop + h / 2),
    w,
    h,
    opacity: 1,
    blur: 0,
  };
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

    gl_FragColor = vec4(c.rgb, mask * uOpacity);
    if (gl_FragColor.a < 0.001) discard;

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
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const wide = window.innerWidth >= LG_BREAKPOINT;
    const viewport: Viewport = {
      colW: wide ? window.innerWidth - SIDEBAR_W : window.innerWidth,
      colH: window.innerHeight,
      is3D: false,
    };
    // Fixed for the life of the scene: swapping texture sizes mid-session
    // would refetch every image and flash.
    const tex = textureSizeFor(viewport.colW, viewport.colH, dpr);
    let needsRender = true;
    let renderCount = 0;
    let tickCount = 0;

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
          loader.load(url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            material.uniforms.uMap.value = texture;
            material.uniforms.uTexAspect.value = aspectOf(first);
            material.uniforms.uHasMap.value = 1;
            needsRender = true;
          });
        };
      }

      return { mesh, material, current: null as Target | null, src, load };
    });

    const resize = () => {
      const wide = window.innerWidth >= LG_BREAKPOINT;
      viewport.colW = wide ? window.innerWidth - SIDEBAR_W : window.innerWidth;
      viewport.colH = window.innerHeight;
      // updateStyle must stay on: without a CSS size the canvas lays itself
      // out at its drawing-buffer size, which is colW * devicePixelRatio.
      renderer.setSize(viewport.colW, viewport.colH);
      camera.left = -viewport.colW / 2;
      camera.right = viewport.colW / 2;
      camera.top = viewport.colH / 2;
      camera.bottom = -viewport.colH / 2;
      camera.updateProjectionMatrix();
      setDocHeight(
        contentHeight(modeRef.current, count, viewport.colW, viewport.colH)
      );
      needsRender = true;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let first = true;
    let prev = performance.now();
    // Exponential damping, expressed per second rather than per frame so the
    // motion feels identical on 60Hz and 120Hz displays.
    const LAMBDA = 9;

    const tick = (now: number) => {
      // Clamp dt so returning to a backgrounded tab doesn't teleport cards.
      const dt = Math.min((now - prev) / 1000, 1 / 20);
      prev = now;
      const scrollY = window.scrollY;
      const m = modeRef.current;
      let motion = 0;

      planes.forEach((p, i) => {
        const t = targetFor(m, i, count, scrollY, viewport);

        // Pull the texture in just before it's needed, judged on the *target*
        // rather than the eased position so it arrives ahead of the card.
        const screenTop = viewport.colH / 2 - t.y - t.h / 2;
        if (
          t.opacity > 0.01 &&
          screenTop < viewport.colH * 1.5 &&
          screenTop + t.h > -viewport.colH * 0.5
        ) {
          p.load();
        }

        // On the first frame snap; after that ease, so a mode change glides
        // each plane from wherever it was to wherever it now belongs.
        const k = first ? 1 : 1 - Math.exp(-LAMBDA * dt);
        const c = p.current ?? { ...t };
        motion = Math.max(
          motion,
          Math.abs(t.x - c.x),
          Math.abs(t.y - c.y),
          Math.abs(t.w - c.w),
          Math.abs(t.opacity - c.opacity) * 100
        );
        c.x += (t.x - c.x) * k;
        c.y += (t.y - c.y) * k;
        c.w += (t.w - c.w) * k;
        c.h += (t.h - c.h) * k;
        c.opacity += (t.opacity - c.opacity) * k;
        c.blur += (t.blur - c.blur) * k;
        p.current = c;

        // Land the quad on whole device pixels. Without this a card rests at
        // a fractional offset (e.g. y=282.75, h=778.5), the texel grid never
        // lines up with the screen grid, and bilinear sampling softens every
        // edge and glyph in the image — the difference between "HD" and not.
        const sw = snapSize(c.w, dpr);
        const sh = snapSize(c.h, dpr);
        p.mesh.position.set(snap(c.x, dpr), snap(c.y, dpr), -Math.abs(i) * 0.001);
        p.mesh.scale.set(sw, sh, 1);
        // Nearer-to-focus cards draw on top.
        p.mesh.renderOrder = Math.round(c.w);
        p.material.uniforms.uOpacity.value = c.opacity;
        p.material.uniforms.uBlur.value = c.blur;
        p.material.uniforms.uSize.value.set(sw, sh);
      });

      first = false;
      if (process.env.NODE_ENV === "development") {
        (window as unknown as Record<string, unknown>).__gl = {
          mode: m,
          scrollY,
          viewport: { ...viewport },
          renderCount,
          tickCount,
          textures: renderer.info.memory.textures,
          planes: planes.map((p) => ({ ...p.current, src: p.src })),
        };
      }
      // Draw only when something actually changed. Once the cards settle, this
      // scene costs nothing until the next scroll, resize or mode switch —
      // which is what keeps a full-screen GPU canvas off the battery while
      // someone is just reading the page.
      if (needsRender || motion > 0.01) {
        renderer.render(scene, camera);
        needsRender = false;
        renderCount++;
      }
      tickCount++;
      raf = requestAnimationFrame(tick);
    };
    tick(prev);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
  const columnWidth = () =>
    window.innerWidth >= LG_BREAKPOINT ? window.innerWidth - SIDEBAR_W : window.innerWidth;

  const readAnchor = (m: Mode) => {
    const colW = columnWidth();
    const vh = window.innerHeight;
    if (m === "3d-1" || m === "3d-2") {
      const range = Math.max(contentHeight(m, count, colW, vh) - vh, 1);
      return Math.round(Math.min(Math.max(window.scrollY / range, 0), 1) * lastIndex);
    }
    const { h } = flowCardSize(m, colW);
    const row = Math.round(Math.max(window.scrollY - TOP_PAD + 1, 0) / (h + GAP));
    return Math.min(m === "2-col" ? row * 2 : row, lastIndex);
  };

  const scrollForAnchor = (m: Mode, anchor: number) => {
    const colW = columnWidth();
    const vh = window.innerHeight;
    const total = contentHeight(m, count, colW, vh);
    const max = Math.max(total - vh, 0);
    if (m === "3d-1" || m === "3d-2") {
      const progress = lastIndex > 0 ? anchor / lastIndex : 0;
      return Math.min(progress * max, max);
    }
    const { h } = flowCardSize(m, colW);
    const row = m === "2-col" ? Math.floor(anchor / 2) : anchor;
    return Math.min(Math.max(TOP_PAD + row * (h + GAP) - TOP_PAD, 0), max);
  };

  const handleModeChange = (next: Mode) => {
    const anchor = readAnchor(modeRef.current);
    const colW = columnWidth();
    const nextHeight = contentHeight(next, count, colW, window.innerHeight);
    const nextScroll = scrollForAnchor(next, anchor);

    // Spacer height, scroll offset and mode must all change in one synchronous
    // block. Flipping the mode first (and deferring the scroll to rAF) let the
    // render loop spend a frame easing toward targets derived from the OLD
    // scroll offset, then reverse once the scroll landed — that reversal was
    // the wobble. The spacer is resized imperatively rather than through state
    // because React wouldn't commit the new height until after the browser had
    // already clamped scrollTo against the old one.
    anchorRef.current = anchor;
    if (spacerRef.current) spacerRef.current.style.height = `${nextHeight}px`;
    window.scrollTo({ top: nextScroll, behavior: "instant" });
    modeRef.current = next;
    setMode(next);
    setDocHeight(nextHeight);
  };

  useEffect(() => {
    setDocHeight(contentHeight(mode, count, columnWidth(), window.innerHeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, count]);

  // 3D-2 lays the cards out horizontally, so a sideways trackpad swipe should
  // move it. Feed deltaX into the same page scroll that drives everything else.
  useEffect(() => {
    if (mode !== "3d-2") return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      window.scrollBy({ top: e.deltaX, behavior: "instant" });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [mode]);

  return (
    <div className="w-full flex-1">
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
        <LayoutSwitcher mode={mode} onChange={handleModeChange} />
      )}
    </div>
  );
}
