"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
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
import { playTick } from "@/lib/tickSound";

// ---------------------------------------------------------------------------
// The showcase has three ways of looking at the work — a column grid, a 3D
// carousel and a deck of cards — and the first two are then tuned by a second
// bar beside the first (Figma 214:4540). Columns get a slider from one to
// five; the carousel gets an axis to run along. The deck has nothing to tune,
// so its bar simply isn't there.
//
// A mode is still a single string, so everything downstream can switch on it,
// but it now carries that second value: "col-3" is three columns, "3d-z1" is
// the carousel on the first diagonal.
// ---------------------------------------------------------------------------
export const MIN_COLS = 1;
export const MAX_COLS = 5;

export type Family = "column" | "3d" | "card";
export type Axis = "y" | "x" | "z1" | "z2";
export type Mode =
  | "col-1"
  | "col-2"
  | "col-3"
  | "col-4"
  | "col-5"
  | "3d-y"
  | "3d-x"
  | "3d-z1"
  | "3d-z2"
  | "card";

export function familyOf(mode: Mode): Family {
  if (mode === "card") return "card";
  return mode.startsWith("col-") ? "column" : "3d";
}

/** Columns in the grid; 1 for the modes that aren't a grid. */
export function colsOf(mode: Mode): number {
  return mode.startsWith("col-") ? Number(mode.slice(4)) : 1;
}

export function axisOf(mode: Mode): Axis {
  return mode.startsWith("3d-") ? (mode.slice(3) as Axis) : "y";
}

export function clampCols(n: number) {
  return Math.min(MAX_COLS, Math.max(MIN_COLS, Math.round(n)));
}

export function colMode(cols: number): Mode {
  return `col-${clampCols(cols)}` as Mode;
}

export function axisMode(axis: Axis): Mode {
  return `3d-${axis}` as Mode;
}

type IconProps = { className?: string };

// Switcher icons, exact paths exported from the Figma toggle controls (fill
// swapped for currentColor so active/inactive tinting still works).
function ColumnIcon({ className }: IconProps) {
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

/** The carousel running up the screen — also the mark for 3D as a whole. */
function AxisYIcon({ className }: IconProps) {
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

function AxisXIcon({ className }: IconProps) {
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

/**
 * The diagonals (Figma 213:4357). Same three cards as the X mark, but the one
 * behind is pushed off one corner and the one in front off the other — which
 * is exactly what the layout does. Z-2 is the same drawing mirrored, as it is
 * in the design.
 */
function AxisZIcon({ className, flip }: IconProps & { flip?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <g transform={flip ? "translate(16,0) scale(-1,1)" : undefined}>
        <path
          fill="currentColor"
          d="M5.33333 2V3.33329L6 3.33327H14L14.6667 3.3333V2C14.6667 1.63181 14.3682 1.33333 14 1.33333H6C5.63181 1.33333 5.33333 1.63181 5.33333 2Z"
        />
        <path
          fill="currentColor"
          d="M1.33333 13.9999V12.6667L2 12.6667H10L10.6667 12.6667V13.9999C10.6667 14.3681 10.3682 14.6666 10 14.6666H2C1.63181 14.6666 1.33333 14.3681 1.33333 13.9999Z"
        />
        <path
          fill="currentColor"
          d="M2 12C1.63181 12 1.33333 11.6418 1.33333 11.2V4.8C1.33333 4.35817 1.63181 4 2 4H14C14.3682 4 14.6667 4.35817 14.6667 4.8V11.2C14.6667 11.6418 14.3682 12 14 12H2Z"
        />
      </g>
    </svg>
  );
}

function AxisZ1Icon(props: IconProps) {
  return <AxisZIcon {...props} />;
}

function AxisZ2Icon(props: IconProps) {
  return <AxisZIcon {...props} flip />;
}

function CardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M12.1549 11.7175C12.936 11.9267 13.5713 11.331 13.7389 10.7057L14.0163 9.6706V13.8223C14.0162 14.2203 13.7471 14.543 13.4153 14.543H2.60091C2.26914 14.543 2.00007 14.2203 2 13.8223V8.99607L12.1549 11.7175Z"
      />
      <path
        fill="currentColor"
        d="M1.88164 8.27487C1.56113 8.189 1.38485 7.80753 1.4879 7.42293L2.98071 1.85168C3.08377 1.46707 3.42715 1.22489 3.74766 1.31077L14.1938 4.10981C14.5143 4.19569 14.6906 4.5771 14.5875 4.96171L13.0947 10.533C12.9917 10.9176 12.6483 11.1598 12.3277 11.0739L1.88164 8.27487Z"
      />
    </svg>
  );
}

/** solar:alt-arrow-left / right, the pair inside the slider's handle. */
function ChevronsIcon() {
  return (
    <svg viewBox="0 0 32 16" fill="none" className="h-4 w-8" aria-hidden>
      <path
        d="M10 3.33333L6 8L10 12.6667M22 3.33333L26 8L22 12.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Item<T extends string> = {
  id: T;
  label: string;
  icon: ComponentType<IconProps>;
};

const MAIN: Item<Family>[] = [
  { id: "column", label: "Column", icon: ColumnIcon },
  { id: "3d", label: "3D", icon: AxisYIcon },
  { id: "card", label: "Card", icon: CardIcon },
];

const AXES: Item<Axis>[] = [
  { id: "y", label: "Y", icon: AxisYIcon },
  { id: "x", label: "X", icon: AxisXIcon },
  { id: "z1", label: "Z - 1", icon: AxisZ1Icon },
  { id: "z2", label: "Z - 2", icon: AxisZ2Icon },
];

// Pop-in for a bar: it inflates from its bottom edge like a balloon — a
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

// Pre-promote the layer so the pop-in doesn't have to re-rasterise the
// blurred glass on its first frames — noticeable on phones.
const DOCK_MOTION_STYLE: CSSProperties = {
  ...DOCK_STYLE,
  transformOrigin: "50% 100%",
  willChange: "transform, opacity",
};

/**
 * A bar of buttons with the white pill behind the selected one.
 *
 * The pill is driven by measured offsets rather than a shared layoutId. This
 * bar is position: fixed, and framer measures layoutId elements against the
 * scrolling document — so switching modes while scrolled down made the pill
 * fly in from ~1500px away. offsetLeft/offsetWidth are relative to the bar
 * itself, so they're immune to scroll.
 */
function SegmentedBar<T extends string>({
  items,
  active,
  onSelect,
  label,
}: {
  items: Item<T>[];
  active: T;
  onSelect: (id: T) => void;
  label: string;
}) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const itemsKey = items.map((i) => i.id).join(",");

  useLayoutEffect(() => {
    const measure = () => {
      const el = buttonRefs.current[items.findIndex((m) => m.id === active)];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // itemsKey stands in for `items`, which is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, itemsKey]);

  return (
    <motion.div
      className={DOCK_CLASS}
      style={DOCK_MOTION_STYLE}
      initial="hidden"
      animate="shown"
      exit="hidden"
      variants={DOCK_VARIANTS}
      role="group"
      aria-label={label}
    >
      <motion.span
        aria-hidden
        className="absolute bottom-1 left-0 top-1 rounded-full"
        initial={false}
        animate={{ x: pill.left, width: pill.width }}
        transition={PILL_SPRING}
        style={PILL_STYLE}
      />
      {items.map(({ id, label: text, icon: Icon }, i) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            onClick={() => onSelect(id)}
            aria-pressed={isActive}
            // pl 8 / pr 12 is asymmetric in the design — the icon sits
            // tighter to the left edge than the label does to the right.
            className={`${DOCK_BUTTON_CLASS} gap-1 py-2 pl-2 pr-3 text-sm font-medium leading-4 ${
              isActive ? "text-accent" : "text-[#4c4b4b] hover:text-accent"
            }`}
            style={NO_TAP_HIGHLIGHT}
          >
            {/* The icon is deliberately a lighter tone than its label —
                #49A8F1 against #1389e3 when active, #A7A5A5 against #4c4b4b
                when not. Inheriting currentColor from the text would make
                both icons too dark. */}
            <Icon
              className={`relative h-4 w-4 transition-colors ${
                isActive ? ICON_ACTIVE : ICON_INACTIVE
              }`}
            />
            <span className="relative whitespace-nowrap">{text}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

// Slider geometry (Figma 214:4369): a 200x40 bar whose 6px track is inset 8px
// from the left of the padding box and 12 from the right, with a 48x32 handle
// that travels flush between the padding box's two ends. The filled part of
// the track runs up to the middle of the handle, so the two read as one.
const SLIDER_W = 200;
const TRACK_L = 12;
const THUMB_W = 48;
const THUMB_MIN = 4 + THUMB_W / 2;
const THUMB_MAX = SLIDER_W - 4 - THUMB_W / 2;

// The handle is a solid white pill, not the translucent one the buttons use:
// it travels over the track and has to hide it. Figma's radial gradient sits
// at the top centre and covers the whole handle.
const THUMB_STYLE: CSSProperties = {
  backgroundImage: "radial-gradient(100% 100% at 50% 0%, #ffffff 0%, #fafafa 100%)",
  boxShadow: PILL_STYLE.boxShadow,
};

function centreFor(cols: number) {
  const t = (clampCols(cols) - MIN_COLS) / (MAX_COLS - MIN_COLS);
  return THUMB_MIN + t * (THUMB_MAX - THUMB_MIN);
}

/**
 * How many columns the grid has, as something to drag (Figma 215:4914).
 *
 * The handle follows the pointer while it's held and the grid re-flows as it
 * passes each of the five stops — you feel the column count change under your
 * hand rather than after letting go. Let go and it springs onto the stop it
 * settled on. Arrow keys work too; it's a real slider to anything reading the
 * page.
 */
function ColumnSlider({
  cols,
  onChange,
}: {
  cols: number;
  onChange: (cols: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  // Where the handle is while it's being dragged; null when it rests on a stop.
  const [held, setHeld] = useState<number | null>(null);
  const centre = held ?? centreFor(cols);

  const set = (next: number) => {
    const n = clampCols(next);
    if (n === cols) return;
    // Same click the carousel makes as a card passes the centre: the stops
    // are detents, and they should sound like it.
    playTick();
    onChange(n);
  };

  /** Pointer x in bar coordinates, clamped to the handle's travel. */
  const centreAt = (clientX: number) => {
    const r = rootRef.current?.getBoundingClientRect();
    if (!r) return centre;
    const scale = r.width / SLIDER_W || 1;
    const x = (clientX - r.left) / scale;
    return Math.min(Math.max(x, THUMB_MIN), THUMB_MAX);
  };

  const valueAt = (at: number) =>
    MIN_COLS +
    Math.round(
      ((at - THUMB_MIN) / (THUMB_MAX - THUMB_MIN)) * (MAX_COLS - MIN_COLS)
    );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Capture on the bar itself: the handle is only 48px wide and a drag
    // quickly leaves it, and on touch the page would otherwise take over.
    // A pointer that's already gone throws rather than returning false, and
    // the drag should still work without the capture.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no capture; the bar still follows the pointer while it's held */
    }
    draggingRef.current = true;
    const at = centreAt(e.clientX);
    setHeld(at);
    set(valueAt(at));
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const at = centreAt(e.clientX);
    setHeld(at);
    set(valueAt(at));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setHeld(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* nothing was captured */
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      set(cols + step);
    } else if (e.key === "Home") {
      e.preventDefault();
      set(MIN_COLS);
    } else if (e.key === "End") {
      e.preventDefault();
      set(MAX_COLS);
    }
  };

  // While the handle is held it must sit exactly under the finger, so no
  // spring; once let go it springs onto its stop like the pill next door.
  const follow = held !== null ? { duration: 0 } : PILL_SPRING;

  return (
    <motion.div
      ref={rootRef}
      className={`${DOCK_CLASS} h-10 w-[200px] cursor-grab touch-none select-none outline-none active:cursor-grabbing`}
      style={{ ...DOCK_MOTION_STYLE, ...NO_TAP_HIGHLIGHT }}
      initial="hidden"
      animate="shown"
      exit="hidden"
      variants={DOCK_VARIANTS}
      role="slider"
      tabIndex={0}
      aria-label="Columns"
      aria-valuemin={MIN_COLS}
      aria-valuemax={MAX_COLS}
      aria-valuenow={cols}
      aria-valuetext={`${cols} column${cols === 1 ? "" : "s"}`}
      aria-orientation="horizontal"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className="flex h-8 w-full items-center pl-2 pr-3">
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#e3e3e3]"
          style={{ boxShadow: "inset 0 0 3px 0 rgba(0,0,0,0.1)" }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-[#49a8f1]"
            initial={false}
            animate={{ width: centre - TRACK_L }}
            transition={follow}
          />
        </div>
      </div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-1 flex h-8 w-12 items-center justify-center rounded-full text-accent"
        style={THUMB_STYLE}
        initial={false}
        animate={{ x: centre - THUMB_W / 2 }}
        transition={follow}
      >
        <ChevronsIcon />
      </motion.div>
    </motion.div>
  );
}

/**
 * The floating "liquid glass" controls: what to look at the work in, and the
 * second bar that tunes it (Figma 214:4540).
 *
 * On a wide screen the main bar sits in the middle of the showcase column and
 * the second bar is pinned to its right edge; on anything narrower they stack,
 * with the second bar riding above the first so both stay centred and
 * reachable with a thumb.
 */
export default function LayoutSwitcher({
  mode,
  onChange,
  visible = true,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  /** Whether the showcase is on screen; the bars pop in and out with it. */
  visible?: boolean;
}) {
  const family = familyOf(mode);
  // What each family was left on, so coming back to it returns you to the
  // arrangement you chose rather than resetting to one column.
  const lastCols = useRef(colsOf(mode));
  const lastAxis = useRef(axisOf(mode));
  if (family === "column") lastCols.current = colsOf(mode);
  if (family === "3d") lastAxis.current = axisOf(mode);

  const pick = (next: Family) => {
    if (next === family) return;
    onChange(
      next === "column"
        ? colMode(lastCols.current)
        : next === "3d"
          ? axisMode(lastAxis.current)
          : "card"
    );
  };

  return (
    // 32px from the bottom on mobile (Figma 155:510), 40px on desktop.
    <div
      className={`fixed inset-x-0 bottom-8 z-30 lg:bottom-10 lg:pl-[410px] ${
        visible ? "" : "pointer-events-none"
      }`}
      inert={!visible}
      aria-hidden={!visible}
    >
      {/* Stacked on a phone (second bar on top), side by side once there's
          room, and only on a wide screen does the main bar go to the middle
          of the column with the second bar out at the edge — below that the
          two would overlap. */}
      <div className="relative flex flex-col-reverse items-center justify-center gap-2 lg:flex-row lg:gap-3 xl:block">
        <div className="flex xl:justify-center">
          <AnimatePresence initial={false}>
            {visible && (
              <SegmentedBar
                key="main"
                items={MAIN}
                active={family}
                onSelect={pick}
                label="Layout"
              />
            )}
          </AnimatePresence>
        </div>
        <div className="xl:absolute xl:inset-y-0 xl:right-10 xl:flex xl:items-center">
          <AnimatePresence initial={false}>
            {visible && family === "column" && (
              <ColumnSlider
                key="columns"
                cols={colsOf(mode)}
                onChange={(cols) => onChange(colMode(cols))}
              />
            )}
            {visible && family === "3d" && (
              <SegmentedBar
                key="axis"
                items={AXES}
                active={axisOf(mode)}
                onSelect={(axis) => onChange(axisMode(axis))}
                label="Axis"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
