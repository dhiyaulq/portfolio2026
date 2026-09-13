import type { ComponentType } from "react";

/**
 * Everything on the sidebar lives here — edit this file to update your
 * name, bio, contact links, skills, tools, and "worked with" logos.
 * No need to touch the component code.
 */

// Wraps an exported Figma icon/logo asset (from public/icons) as a component
// with the same shape as a lucide-react icon, so it drops into <SkillBadge>.
function IconAsset(src: string, alt = "") {
  return function Icon({ className }: { className?: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`${className ?? ""} object-contain`} />;
  };
}

export const siteConfig = {
  name: "Dhiya",
  bio: "I'm Dhiya, a Product designer located in Indonesia. Partnering with forward-thinking teams to build thoughtful interfaces, websites, and brand identities built for long-term success.",
  email: "dhiyaulhaqmahmud@gmail.com",
  chatUrl: "#", // e.g. a Calendly / WhatsApp / Telegram link
  copyright: "© 2026, Dhiya Ulhaq Mahmud.",

  // Placeholder "worked with" logos pulled from the Figma file. Replace with
  // your real client logos whenever you have them (see public/logos).
  workedWith: [
    { name: "Logoipsum", mark: "/logos/logo1-mark.svg", type: "/logos/logo1-type.svg" },
    { name: "Loco", logo: "/logos/logo2.svg" },
    { name: "Guava", mark: "/logos/logo3-b.svg", type: "/logos/logo3-a.svg" },
  ],

  design: [
    { label: "Brand Identity", icon: IconAsset("/icons/skill-brand-identity.svg") },
    { label: "Web & Mobile App", icon: IconAsset("/icons/skill-web-mobile.svg") },
    { label: "Motion", icon: IconAsset("/icons/skill-motion.svg") },
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
