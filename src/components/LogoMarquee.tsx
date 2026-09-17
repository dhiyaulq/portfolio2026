"use client";

import { useEffect, useRef, useState } from "react";
import type { Logo } from "@/lib/siteConfig";

/**
 * Infinite left-scrolling logo strip.
 *
 * The list is rendered twice inside one flex row. Because both copies sit in
 * the same row, the 32px gap that separates the logos also separates the last
 * logo of copy A from the first of copy B — so translating the row by exactly
 * one copy's width (plus that one gap) lands copy B where copy A started and
 * the seam is invisible. `-50%` of the row is one copy plus half the joining
 * gap, hence the extra 16px.
 *
 * Duration is derived from the content so the speed stays constant no matter
 * how many logos are in the list; adding one doesn't make the rest speed up.
 */
const GAP = 32;
const PX_PER_SECOND = 40;

export default function LogoMarquee({ logos }: { logos: Logo[] }) {
  // One copy's width, so the animation can run at a fixed px/second.
  const copyWidth =
    logos.reduce((sum, l) => sum + l.width, 0) + GAP * logos.length;
  const duration = copyWidth / PX_PER_SECOND;

  // Pause while off screen. On a phone the strip lives in the hero, which is
  // scrolled away the whole time you're browsing work — no reason to keep
  // re-rasterising a masked, moving layer nobody can see.
  const rootRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting)
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const strip = (copy: number) =>
    logos.map((logo) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${copy}-${logo.name}`}
        src={logo.src}
        alt={copy === 0 ? logo.name : ""}
        aria-hidden={copy === 1 || undefined}
        width={logo.width}
        height={logo.height}
        style={{ width: logo.width, height: logo.height }}
        className="max-w-none shrink-0 object-contain"
      />
    ));

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden"
      style={{
        // Matches the design's fade overlay, which is opaque to 15% and from
        // 85%. A mask is used rather than a gradient overlay so the strip
        // fades to whatever is behind it instead of only to the sidebar grey.
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <div
        className="logo-marquee-track flex w-max items-center"
        style={
          {
            gap: `${GAP}px`,
            "--logo-marquee-duration": `${duration}s`,
            animationPlayState: onScreen ? "running" : "paused",
          } as React.CSSProperties
        }
      >
        {strip(0)}
        {strip(1)}
      </div>

      <style>{`
        .logo-marquee-track {
          animation: logo-marquee var(--logo-marquee-duration) linear infinite;
        }
        @keyframes logo-marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(calc(-50% - ${GAP / 2}px), 0, 0); }
        }
        /* The duration is an inline custom property, but the animation itself
           lives here so this can actually switch it off — an inline
           "animation" shorthand would outrank any utility class. */
        @media (prefers-reduced-motion: reduce) {
          .logo-marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
