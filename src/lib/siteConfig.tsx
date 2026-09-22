import type { ComponentType } from "react";

/**
 * Everything on the sidebar lives here — edit this file to update your
 * name, bio, contact links, skills, tools, and "worked with" logos.
 * No need to touch the component code.
 */

// Wraps an exported Figma icon/logo asset (from public/icons) as a component
// with the same shape as a lucide-react icon, so it drops into <SkillBadge>.
//
// `glyph` is the artwork's own size inside the 14px frame. Figma insets some
// of these glyphs within their frame (8.33% on most, 8.33/6.25 vertically on
// the monitor one) and lets others fill it, and the exports carry only the
// artwork — so the inset ones come out at 11.67px, not 14px. Stretching every
// asset to the full frame scaled those up by ~20% and made them look oversized
// next to the rest. Sizing the glyph and centring it in a 14px box keeps the
// designed proportions.
function IconAsset(src: string, alt = "", glyph?: { w: number; h: number }) {
  return function Icon({ className }: { className?: string }) {
    return (
      <span className={`${className ?? ""} flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="object-contain"
          style={
            glyph
              ? { width: `${glyph.w}px`, height: `${glyph.h}px` }
              : { width: "100%", height: "100%" }
          }
        />
      </span>
    );
  };
}

export type Logo = { name: string; src: string; width: number; height: number };

// Glyph sizes inside the 14px frame, from Figma 129:383.
const INSET_SQUARE = { w: 11.6667, h: 11.6667 };
const INSET_MONITOR = { w: 11.6667, h: 11.9583 };

export const siteConfig = {
  name: "Dhiya",
  bio: "I’m Dhiya, a designer based in Indonesia, partnering with forward-thinking teams to create thoughtful interfaces, websites, and brand identities designed for lasting growth.",
  email: "dhiyaulhaqmahmud@gmail.com",
  chatUrl: "https://t.me/dsignspace",
  copyright: "© 2026, Dhiya",

  // "Worked with" logos, exported from Figma 135:445. Each carries its own
  // designed box — they are deliberately different sizes and are NOT
  // normalised to a common height, which is what keeps the optical weight
  // even across very different logo shapes. All are tinted #7d7d7d.
  workedWith: [
    { name: "Guava", src: "/logos/guava.png", width: 91, height: 20 },
    { name: "Gentle Goodness", src: "/logos/gentle.png", width: 74, height: 24 },
    { name: "vitaminspa", src: "/logos/vitaminspa.svg", width: 115, height: 20 },
    { name: "Sustainable Impact Value Pioneer", src: "/logos/sustainable.svg", width: 82, height: 24 },
    { name: "Claro Essentia", src: "/logos/claro-essentia.png", width: 90, height: 24 },
    { name: "Claro", src: "/logos/claro.svg", width: 114, height: 14 },
    { name: "Ekhaya", src: "/logos/circle-mark.png", width: 24, height: 24 },
    { name: "Räume", src: "/logos/raume.png", width: 92.7, height: 20 },
    { name: "Paper", src: "/logos/paper.png", width: 68.7, height: 24 },
    { name: "lqll", src: "/logos/lqll.png", width: 35.3, height: 24 },
    { name: "Nirmala", src: "/logos/nirmala.svg", width: 59, height: 24 },
  ] as Logo[],

  design: [
    {
      label: "Brand Identity",
      icon: IconAsset("/icons/skill-brand-identity.svg", "", INSET_SQUARE),
    },
    {
      label: "Web & Mobile App",
      icon: IconAsset("/icons/skill-web-mobile.svg", "", INSET_MONITOR),
    },
    { label: "Motion", icon: IconAsset("/icons/skill-motion.svg", "", INSET_SQUARE) },
    { label: "Website", icon: IconAsset("/icons/skill-website.svg") },
    { label: "Slide Deck", icon: IconAsset("/icons/skill-slide-deck.svg") },
    { label: "Packaging", icon: IconAsset("/icons/skill-packaging.svg") },
  ] as { label: string; icon: ComponentType<{ className?: string }> }[],

  development: [
    { label: "Claude Code", icon: IconAsset("/icons/dev-claude-code.png", "Claude Code") },
    { label: "Webflow", icon: IconAsset("/icons/dev-webflow.png", "Webflow") },
    { label: "Framer", icon: IconAsset("/icons/dev-framer.png", "Framer") },
    { label: "Wix Studio", icon: IconAsset("/icons/dev-wix-studio.png", "Wix Studio") },
    { label: "Shopify", icon: IconAsset("/icons/dev-shopify.png", "Shopify") },
  ] as { label: string; icon: ComponentType<{ className?: string }> }[],
};
