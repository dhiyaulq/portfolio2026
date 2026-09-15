"use client";

import { motion } from "framer-motion";

// Idle fill from Figma 99:1014. The source is a radial gradient with
// gradientUnits="userSpaceOnUse" on a 113x32 box: centre (56.5, 0) — top
// centre — with semi-axes 109.88 x 32, which is 97.24% x 100% of the box.
// Expressed as percentages so it still resolves correctly if the label ever
// changes width.
const FILL_IDLE =
  "radial-gradient(97.24% 100% at 50% 0%, #299ff9 0%, #1389e3 100%)";

const SHADOW_IDLE =
  "0px 36px 5px rgba(22,148,246,0), 0px 23px 4.5px rgba(22,148,246,0.02), 0px 13px 4px rgba(22,148,246,0.08), 0px 6px 3px rgba(22,148,246,0.13), 0px 1px 1.5px rgba(22,148,246,0.15)";
const SHADOW_PRESSED =
  "0px 15px 2px rgba(22,148,246,0), 0px 10px 2px rgba(22,148,246,0.02), 0px 5px 1.5px rgba(22,148,246,0.08), 0px 2px 1px rgba(22,148,246,0.13), 0px 1px 0.5px rgba(22,148,246,0.15)";

// Primary CTA, matching the Figma "State" frame: idle has a big soft glow
// that tightens on hover/press. Hover and press are flat fills in the design,
// not a darkened gradient — so a single overlay sits above the gradient and
// animates both its opacity and its colour (#1389e3 -> #1080d6), which lands
// on the exact designed colour in each state while still crossfading. The
// glow shrinks via an animated box-shadow on the link itself, driven off the
// same idle/hover/active variant so the two stay in sync. The gesture listens
// on the whole link (not the overlay), so it doesn't drop out over the label
// and icon painted on top of it.
export default function SendEmailButton({ email }: { email: string }) {
  return (
    <motion.a
      href={`mailto:${email}`}
      initial="idle"
      whileHover="hover"
      whileTap="active"
      variants={{
        idle: { boxShadow: SHADOW_IDLE },
        hover: { boxShadow: SHADOW_PRESSED },
        active: { boxShadow: SHADOW_PRESSED },
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ backgroundImage: FILL_IDLE }}
      // Figma's 1px stroke is inside-aligned, so the frame is 113x32 with the
      // stroke overlapping the 12/8/8 padding. A CSS border adds to the box
      // instead, so the padding is reduced by the border width to land on the
      // same outer size with the same 12px/8px visual inset.
      className="relative flex items-center gap-1.5 overflow-hidden rounded-full border border-accent py-[7px] pl-[11px] pr-[7px]"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        variants={{
          idle: { opacity: 0, backgroundColor: "#1389e3" },
          hover: { opacity: 1, backgroundColor: "#1389e3" },
          active: { opacity: 1, backgroundColor: "#1080d6" },
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
      <span className="relative text-sm font-semibold leading-4 text-white">Send Email</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/cta-arrow-right.svg" alt="" className="relative h-3 w-3" />
    </motion.a>
  );
}
