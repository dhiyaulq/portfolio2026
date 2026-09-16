"use client";

import { motion } from "framer-motion";

const SHADOW_IDLE =
  "0px 7px 1px rgba(0,0,0,0), 0px 5px 1px rgba(0,0,0,0.01), 0px 3px 1px rgba(0,0,0,0.03), 0px 1px 0.5px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.05)";
const SHADOW_PRESSED =
  "0px 3px 0.5px rgba(0,0,0,0), 0px 2px 0.5px rgba(0,0,0,0.01), 0px 1px 0.5px rgba(0,0,0,0.03), 0px 0px 0.5px rgba(0,0,0,0.04)";

// Secondary CTA, matching the Figma "State" frame: white idle -> #fafafa on
// hover -> #f6f6f6 on press, with the shadow tightening the same way as the
// primary button. Background/shadow are driven off one variant on the link
// itself so they never fall out of sync while the cursor is over the label.
export default function ChatNowButton({ href }: { href: string }) {
  return (
    <motion.a
      href={href}
      // Opens Telegram in a new tab so the portfolio stays open behind it.
      // noopener stops the new page from reaching back into this one.
      target="_blank"
      rel="noopener noreferrer"
      initial="idle"
      whileHover="hover"
      whileTap="active"
      variants={{
        idle: { backgroundColor: "#ffffff", boxShadow: SHADOW_IDLE },
        hover: { backgroundColor: "#fafafa", boxShadow: SHADOW_PRESSED },
        active: { backgroundColor: "#f6f6f6", boxShadow: SHADOW_PRESSED },
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="relative flex items-center gap-1.5 rounded-full py-2 pl-2 pr-3"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/telegram.png" alt="" className="h-4 w-4" />
      <span className="text-sm font-medium leading-4 text-heading">Chat Now</span>
      {/* 1px stroke drawn inside the edge (like Figma's inside-aligned
          stroke) so it doesn't add to the 8/12 padding — the button stays
          32px tall. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: "inset 0 0 0 1px rgba(153,153,153,0.15)" }}
      />
    </motion.a>
  );
}
