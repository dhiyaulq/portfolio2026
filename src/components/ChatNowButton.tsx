"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SHADOW_IDLE =
  "0px 7px 1px rgba(0,0,0,0), 0px 5px 1px rgba(0,0,0,0.01), 0px 3px 1px rgba(0,0,0,0.03), 0px 1px 0.5px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.05)";
const SHADOW_PRESSED =
  "0px 3px 0.5px rgba(0,0,0,0), 0px 2px 0.5px rgba(0,0,0,0.01), 0px 1px 0.5px rgba(0,0,0,0.03), 0px 0px 0.5px rgba(0,0,0,0.04)";

// The menu's own shadow (Figma 223:5410): the same five-layer falloff as the
// button, thrown further because the panel floats above the page rather than
// sitting on it.
const MENU_SHADOW =
  "0px 32px 4.5px rgba(0,0,0,0), 0px 20px 4px rgba(0,0,0,0.01), 0px 11px 3.5px rgba(0,0,0,0.03), 0px 5px 2.5px rgba(0,0,0,0.04), 0px 1px 1.5px rgba(0,0,0,0.05)";

export type ChatOption = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

/**
 * "Chat Now", which opens a menu of the ways to do it (Figma 223:5410).
 *
 * It used to be a link straight to Telegram. Now there are two places to
 * reach Dhiya, so the button is a menu trigger: the chevron turns over as it
 * opens, and the panel hangs off the button's left edge, 6px below it, as in
 * the design.
 *
 * The menu closes on Escape, on a click anywhere outside it, and on choosing
 * something. Escape hands focus back to the button; the arrow keys move
 * between the options, so the whole thing works without a pointer.
 */
export default function ChatNowButton({
  options,
}: {
  options: readonly ChatOption[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Put the caret back where it came from rather than at the top of the
      // document.
      buttonRef.current?.focus();
    };
    // Capture, so a click that something else stops still closes the menu.
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const moveFocus = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
    itemRefs.current[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            // The list isn't mounted yet on the frame the key lands.
            requestAnimationFrame(() =>
              itemRefs.current[
                e.key === "ArrowDown" ? 0 : options.length - 1
              ]?.focus(),
            );
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        initial="idle"
        animate={open ? "active" : "idle"}
        whileHover="hover"
        whileTap="active"
        variants={{
          idle: { backgroundColor: "#ffffff", boxShadow: SHADOW_IDLE },
          hover: { backgroundColor: "#fafafa", boxShadow: SHADOW_PRESSED },
          active: { backgroundColor: "#f6f6f6", boxShadow: SHADOW_PRESSED },
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        // 8px both sides, 6 top and bottom (Figma 223:4938), which is what
        // keeps it 34px tall next to the primary button.
        className="relative flex items-center gap-1.5 rounded-full px-2 py-1.5"
      >
        <span className="text-sm font-medium leading-[22px] text-[#1e1e1e]">
          Chat Now
        </span>
        {/* solar:alt-arrow-down-linear (223:5128). Drawn inline rather than
            loaded as an image so it can turn over when the menu opens. */}
        <motion.svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className="h-3 w-3"
          initial={false}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <path
            d="M9.5 4.5L6 7.5L2.5 4.5"
            stroke="#737373"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
        {/* 1px stroke drawn inside the edge (like Figma's inside-aligned
            stroke) so it doesn't add to the 8/6 padding — the button stays
            34px tall.

            The design's own value for this stroke is 2% grey, which
            composites to #FDFDFD on the white fill — invisible, and it was.
            What actually draws the edge in Figma's render is its drop-shadow
            hugging the silhouette all the way round, which a CSS box-shadow
            can't do from those offsets: measured off the render, the edge
            falls to #DBDBDB at its darkest. 8% black draws a #EBEBEB line —
            lighter than the render, which is where this settled by eye. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label="Chat"
            // It unrolls: the panel's height runs from nothing to its full
            // 76px and the options are revealed by the edge passing over
            // them, rather than the whole thing being scaled up. Nothing
            // about it distorts — text scaled vertically for a fifth of a
            // second is exactly what makes a dropdown feel cheap — and there
            // is no overshoot, because a menu that springs is a menu whose
            // options are still moving when you go to click one.
            //
            // The box-shadow is drawn on this element, so `overflow-hidden`
            // clips the contents without clipping the shadow.
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.14, ease: "easeOut" },
            }}
            // Hung off the button's left edge, 6px under it (223:5410).
            className="absolute left-0 top-full z-20 mt-1.5 w-[118px] overflow-hidden rounded-[20px] bg-white backdrop-blur-[3px]"
            style={{
              boxShadow: `${MENU_SHADOW}, inset 0 0 0 1px rgba(0,0,0,0.04)`,
              willChange: "height, opacity",
            }}
          >
            <div className="p-1">
              {options.map(({ id, label, href }, i) => (
                <a
                  key={id}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      moveFocus(i, 1);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      moveFocus(i, -1);
                    }
                  }}
                  className="flex items-center gap-1 rounded-full py-1.5 pl-2 pr-3 outline-none transition-colors hover:bg-[#f6f6f6] focus-visible:bg-[#f6f6f6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      id === "whatsapp"
                        ? "/icons/whatsapp.svg"
                        : "/icons/telegram-mark.svg"
                    }
                    alt=""
                    className="h-5 w-5 shrink-0"
                  />
                  <span className="whitespace-nowrap text-sm font-medium leading-[22px] text-[#1e1e1e]">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
