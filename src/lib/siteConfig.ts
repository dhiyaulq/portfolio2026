import type { ComponentType } from "react";
import {
  PenTool,
  Smartphone,
  Clapperboard,
  MousePointerClick,
  Presentation,
  Package,
} from "lucide-react";
import {
  SiWebflow,
  SiFramer,
  SiWix,
  SiShopify,
} from "react-icons/si";

/**
 * Everything on the sidebar lives here — edit this file to update your
 * name, bio, contact links, skills, tools, and "worked with" logos.
 * No need to touch the component code.
 */
export const siteConfig = {
  name: "Dhiya",
  bio: "I'm Dhiya, a Product designer located in Indonesia. Partnering with forward-thinking teams to build thoughtful interfaces, websites, and brand identities built for long-term success.",
  email: "dhiyaulhaqmahmud@gmail.com",
  chatUrl: "#", // e.g. a Calendly / WhatsApp / Telegram link
  copyright: "© 2026, Dhiya Ulhaq Mahmud.",

  // Replace with real client names once you have them — plain text is
  // fine, or swap this section for <img> logos later.
  workedWith: ["Logoipsum", "Loco", "Guava"],

  design: [
    { label: "Brand Identity", icon: PenTool },
    { label: "Web & Mobile App", icon: Smartphone },
    { label: "Motion", icon: Clapperboard },
    { label: "Website", icon: MousePointerClick },
    { label: "Slide Deck", icon: Presentation },
    { label: "Packaging", icon: Package },
  ] as { label: string; icon: ComponentType<{ className?: string }> }[],

  development: [
    { label: "Webflow", icon: SiWebflow },
    { label: "Framer", icon: SiFramer },
    { label: "Wix Studio", icon: SiWix },
    { label: "Shopify", icon: SiShopify },
  ] as { label: string; icon: ComponentType<{ className?: string }> }[],
};
