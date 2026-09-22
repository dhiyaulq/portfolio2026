"use client";

import { useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

// Accordion headings (Figma 186:1064) — 15px/23px, -0.075px tracking, #626262,
// on a hairline that runs the full width of the sidebar column.
const HEADING =
  "flex-1 text-left text-[15px] leading-[23px] tracking-[-0.075px] text-[#626262]";

// Both tile tones carry the same four-layer drop shadow (Figma 127:313 /
// 127:359). The tiles are opaque, so box-shadow reproduces Figma's
// drop-shadow exactly here — nothing shows through to darken the fill.
const BADGE_SHADOW =
  "0px 4px 0.5px rgba(0,0,0,0), 0px 2px 0.5px rgba(0,0,0,0.01), 0px 1px 0.5px rgba(0,0,0,0.03), 0px 1px 0.5px rgba(0,0,0,0.04)";

// Dark tile fill. The source is a radial gradient with userSpaceOnUse on a
// 22x22 box: centre (11, 0) — top centre — with semi-axes 22 x 22, i.e.
// 100% x 100% of the box. It is NOT the vertical linear gradient it can look
// like at 22px.
const BADGE_FILL_DARK =
  "radial-gradient(100% 100% at 50% 0%, #4d5257 0%, #373b3f 100%)";

/** solar:add-bold / solar:minus-bold, exact paths from Figma 186:1066. */
function PlusMinusIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="h-4 w-4 shrink-0 text-[#7d7d7d]"
    >
      <path
        fill="currentColor"
        d="M2.66667 8.5C2.39053 8.5 2.16667 8.27613 2.16667 8C2.16667 7.72387 2.39053 7.5 2.66667 7.5H13.3333C13.6095 7.5 13.8333 7.72387 13.8333 8C13.8333 8.27613 13.6095 8.5 13.3333 8.5H2.66667Z"
      />
      {/* The upright of the plus, drawn separately so it can retract into the
          minus rather than the icon swapping out from under the cursor. */}
      <motion.path
        fill="currentColor"
        d="M8.01367 2.16667C8.2898 2.1667 8.51367 2.39055 8.51367 2.66667V13.3333C8.51367 13.6095 8.2898 13.8333 8.01367 13.8333C7.73753 13.8333 7.51367 13.6095 7.51367 13.3333V2.66667C7.51367 2.39053 7.73753 2.16667 8.01367 2.16667Z"
        initial={false}
        animate={{ scaleY: open ? 0 : 1, opacity: open ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ transformOrigin: "8px 8px" }}
      />
    </svg>
  );
}

function SkillBadge({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "dark" | "light";
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* The 0.5px stroke is drawn as an inset ring rather than a CSS border.
          Figma aligns it inside, so the tile stays 22x22 (14px icon + 4px
          padding each side); a real border would add its width to the box and
          render 23x23, nudging the label across too. */}
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg p-1 ${
          tone === "dark" ? "" : "bg-white"
        }`}
        style={
          tone === "dark"
            ? {
                backgroundImage: BADGE_FILL_DARK,
                boxShadow: `${BADGE_SHADOW}, inset 0px 2px 4px 0px rgba(255,255,255,0.3), inset 0 0 0 0.5px #373b3f`,
              }
            : { boxShadow: `${BADGE_SHADOW}, inset 0 0 0 0.5px rgba(0,0,0,0.1)` }
        }
      >
        <Icon
          className={
            tone === "dark"
              ? "h-3.5 w-3.5 text-white"
              : "h-3.5 w-3.5 text-[#141414]"
          }
        />
      </div>
      {/* Not truncated: "Web & Mobile App" renders one pixel wider here than
          Figma measures it, and the column is sized to Figma's measurement —
          so it would clip to an ellipsis over a single pixel. Left to
          overflow instead, into a 12px gutter where nobody can see it. */}
      <p className="whitespace-nowrap text-[15px] leading-[23px] tracking-[-0.075px] text-skill">
        {label}
      </p>
    </div>
  );
}

const SECTIONS = [
  { id: "design", label: "Design", items: siteConfig.design, tone: "dark" },
  {
    id: "development",
    label: "Development",
    items: siteConfig.development,
    tone: "light",
  },
] as const;

/**
 * What Dhiya does, in two lists that open one at a time (Figma 186:1445).
 *
 * One at a time by request: opening the second closes the first, so the
 * sidebar keeps its height and the footer doesn't slide around underneath.
 * Clicking the open one closes it, which is the only way to see both headings
 * with nothing beneath them — the state the collapsed frame shows.
 */
export default function ServicesAccordion() {
  const [open, setOpen] = useState<string | null>("design");

  return (
    <div className="flex flex-col">
      {SECTIONS.map(({ id, label, items, tone }) => {
        const isOpen = open === id;
        const rows = Math.ceil(items.length / 2);
        return (
          <div key={id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : id)}
              aria-expanded={isOpen}
              aria-controls={`services-${id}`}
              className="flex w-full items-center gap-1.5 border-b border-[rgba(0,0,0,0.1)] py-3 outline-none focus-visible:outline-none"
            >
              <span className={HEADING}>{label}</span>
              <PlusMinusIcon open={isOpen} />
            </button>

            <motion.div
              id={`services-${id}`}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              // Closed means closed for keyboards and screen readers too.
              inert={!isOpen}
              aria-hidden={!isOpen}
            >
              <motion.div
                className="flex flex-col gap-2 py-3"
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {Array.from({ length: rows }).map((_, row) => (
                  <div key={row} className="flex gap-3">
                    {items.slice(row * 2, row * 2 + 2).map((item) => (
                      <SkillBadge
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        tone={tone}
                      />
                    ))}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
