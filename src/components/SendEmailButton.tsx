"use client";

import { motion } from "framer-motion";

// Primary CTA. The gradient + glow stay fixed; hover/press just fade in a
// darkening overlay, so exactly one property (opacity) animates — no flicker.
export default function SendEmailButton({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="relative flex items-center gap-1.5 overflow-hidden rounded-full border border-accent bg-gradient-to-b from-[#2ba2fe] to-[#1389e3] py-2 pl-3 pr-2 shadow-[0px_36px_5px_rgba(22,148,246,0),0px_23px_4.5px_rgba(22,148,246,0.02),0px_13px_4px_rgba(22,148,246,0.08),0px_6px_3px_rgba(22,148,246,0.13),0px_1px_1.5px_rgba(22,148,246,0.15)]"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.12 }}
        whileTap={{ opacity: 0.24 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
      <span className="relative text-sm font-semibold text-white">Send Email</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/cta-arrow-right.svg" alt="" className="relative h-3 w-3" />
    </a>
  );
}
