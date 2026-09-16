"use client";

import { useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  DOCK_BUTTON_CLASS,
  DOCK_CLASS,
  DOCK_STYLE,
  ICON_ACTIVE,
  ICON_INACTIVE,
  NO_TAP_HIGHLIGHT,
  PILL_SPRING,
  PILL_STYLE,
} from "@/components/glassDock";

export type Mode = "1-col" | "2-col" | "3d-1" | "3d-2";
type IconProps = { className?: string };

// Layout-switcher icons, exact paths exported from the Figma toggle control
// (fill swapped for currentColor so active/inactive tinting still works).
function OneColIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M11.7333 1.33333H4.26667C3.7512 1.33333 3.33333 1.75973 3.33333 2.28571V13.7143C3.33333 14.2403 3.7512 14.6667 4.26667 14.6667H11.7333C12.2488 14.6667 12.6667 14.2403 12.6667 13.7143V2.28571C12.6667 1.75973 12.2488 1.33333 11.7333 1.33333Z"
      />
    </svg>
  );
}

function TwoColIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M1.33333 2C1.33333 1.63181 1.63181 1.33333 2 1.33333H6.66667C7.03487 1.33333 7.33333 1.63181 7.33333 2V14C7.33333 14.3682 7.03487 14.6667 6.66667 14.6667H2C1.63181 14.6667 1.33333 14.3682 1.33333 14V2Z"
      />
      <path
        fill="currentColor"
        d="M8.66667 2C8.66667 1.63181 8.96513 1.33333 9.33333 1.33333H14C14.3682 1.33333 14.6667 1.63181 14.6667 2V14C14.6667 14.3682 14.3682 14.6667 14 14.6667H9.33333C8.96513 14.6667 8.66667 14.3682 8.66667 14V2Z"
      />
    </svg>
  );
}

function ThreeDOneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M13.9999 3.33333H12.6667L12.6667 4V12L12.6667 12.6667H13.9999C14.3681 12.6667 14.6666 12.3682 14.6666 12V4C14.6666 3.63181 14.3681 3.33333 13.9999 3.33333Z"
      />
      <path
        fill="currentColor"
        d="M2.00003 3.33333H3.33332L3.3333 4V12L3.33333 12.6667H2.00003C1.63185 12.6667 1.33337 12.3682 1.33337 12V4C1.33337 3.63181 1.63185 3.33333 2.00003 3.33333Z"
      />
      <path
        fill="currentColor"
        d="M4 2C4 1.63181 4.35817 1.33333 4.8 1.33333H11.2C11.6418 1.33333 12 1.63181 12 2V14C12 14.3682 11.6418 14.6667 11.2 14.6667H4.8C4.35817 14.6667 4 14.3682 4 14V2Z"
      />
    </svg>
  );
}

function ThreeDTwoIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M3.33333 2.00003V3.33332L4 3.3333H12L12.6667 3.33333V2.00003C12.6667 1.63185 12.3682 1.33337 12 1.33337H4C3.63181 1.33337 3.33333 1.63185 3.33333 2.00003Z"
      />
      <path
        fill="currentColor"
        d="M3.33333 13.9999V12.6667L4 12.6667H12L12.6667 12.6667V13.9999C12.6667 14.3681 12.3682 14.6666 12 14.6666H4C3.63181 14.6666 3.33333 14.3681 3.33333 13.9999Z"
      />
      <path
        fill="currentColor"
        d="M2 12C1.63181 12 1.33333 11.6418 1.33333 11.2V4.8C1.33333 4.35817 1.63181 4 2 4H14C14.3682 4 14.6667 4.35817 14.6667 4.8V11.2C14.6667 11.6418 14.3682 12 14 12H2Z"
      />
    </svg>
  );
}

export const MODES: { id: Mode; label: string; icon: ComponentType<IconProps> }[] = [
  { id: "1-col", label: "1-Col", icon: OneColIcon },
  { id: "2-col", label: "2-Col", icon: TwoColIcon },
  { id: "3d-1", label: "3D - 1", icon: ThreeDOneIcon },
  { id: "3d-2", label: "3D - 2", icon: ThreeDTwoIcon },
];

// Pop-in for the dock: it inflates from its bottom edge like a balloon — a
// springy scale-up with a little overshoot while it rises into place — and
// hiding plays the same motion backwards, deflating and sinking without the
// bounce. Opacity runs on its own short tween so the fade doesn't wobble
// with the spring.
const DOCK_VARIANTS: Variants = {
  shown: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 19,
      mass: 0.8,
      opacity: { duration: 0.18, ease: "easeOut" },
    },
  },
  hidden: {
    opacity: 0,
    scale: 0.4,
    y: 28,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 34,
      mass: 0.8,
      opacity: { duration: 0.16, delay: 0.06, ease: "easeIn" },
    },
  },
};

// Floating "liquid glass" dock for switching layout modes.
//
// The sliding pill is driven by measured offsets rather than a shared
// layoutId. This bar is position: fixed, and framer measures layoutId
// elements against the scrolling document — so switching modes while
// scrolled down made the pill fly in from ~1500px away. offsetLeft/
// offsetWidth are relative to the bar itself, so they're immune to scroll.
export default function LayoutSwitcher({
  mode,
  onChange,
  visible = true,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  /** Whether the showcase is on screen; the dock pops in and out with it. */
  visible?: boolean;
}) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const el = buttonRefs.current[MODES.findIndex((m) => m.id === mode)];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mode]);

  return (
    <div className="fixed inset-x-0 bottom-12 z-30 flex justify-center lg:pl-[457px]">
      <motion.div
        className={`${DOCK_CLASS} ${visible ? "" : "pointer-events-none"}`}
        style={{ ...DOCK_STYLE, transformOrigin: "50% 100%" }}
        initial="hidden"
        animate={visible ? "shown" : "hidden"}
        variants={DOCK_VARIANTS}
        // Hidden means hidden for keyboards and screen readers too.
        inert={!visible}
        aria-hidden={!visible}
      >
        <motion.span
          aria-hidden
          className="absolute bottom-1 left-0 top-1 rounded-full"
          initial={false}
          animate={{ x: pill.left, width: pill.width }}
          transition={PILL_SPRING}
          style={PILL_STYLE}
        />
        {MODES.map(({ id, label, icon: Icon }, i) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              onClick={() => onChange(id)}
              // pl 8 / pr 12 is asymmetric in the design — the icon sits
              // tighter to the left edge than the label does to the right.
              className={`${DOCK_BUTTON_CLASS} gap-1.5 py-2 pl-2 pr-3 text-sm font-medium leading-4 ${
                active ? "text-accent" : "text-[#4c4b4b] hover:text-accent"
              }`}
              style={NO_TAP_HIGHLIGHT}
            >
              {/* The icon is deliberately a lighter tone than its label —
                  #49A8F1 against #1389e3 when active, #A7A5A5 against #4c4b4b
                  when not. Inheriting currentColor from the text would make
                  both icons too dark. */}
              <Icon
                className={`relative h-4 w-4 transition-colors ${
                  active ? ICON_ACTIVE : ICON_INACTIVE
                }`}
              />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
