"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { urlFor } from "@/lib/sanity";
import type { MediaItem, WorkListItem } from "@/lib/queries";

type Mode = "1-col" | "2-col" | "3d-1" | "3d-2";
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

const MODES: { id: Mode; label: string; icon: ComponentType<IconProps> }[] = [
  { id: "1-col", label: "1-Col", icon: OneColIcon },
  { id: "2-col", label: "2-Col", icon: TwoColIcon },
  { id: "3d-1", label: "3D - 1", icon: ThreeDOneIcon },
  { id: "3d-2", label: "3D - 2", icon: ThreeDTwoIcon },
];

const AUTO_ADVANCE_MS = 4500;

// Breathing room above the anchored card when a flow layout is restored, so
// it sits just below the top edge rather than jammed against it.
const TOP_GUTTER = 48;

// Which gallery slide each work is showing, kept outside React so it survives
// the card unmounting/remounting when you switch layout modes. Without this
// the index resets to 0 and the visible image visibly changes mid-transition.
const slideIndexByWork = new Map<string, number>();

function aspect(item: MediaItem | undefined): number {
  const dims = item?.dimensions;
  if (dims?.width && dims?.height) return dims.width / dims.height;
  return 4 / 3;
}

// Shows a work's cover image, or cycles through its gallery (images/videos)
// as a simple crossfading carousel with dot pagination. No detail page, no
// hover animation — just the media itself.
function WorkCarousel({
  work,
  workIndex,
  aspectOverride,
  className = "",
  widthClassName = "w-full",
}: {
  work: WorkListItem;
  /** Position in the list, exposed on the DOM node so a mode change can find
   *  the work you were looking at and keep it anchored in view. */
  workIndex: number;
  aspectOverride?: number;
  className?: string;
  widthClassName?: string;
}) {
  const items = work.gallery && work.gallery.length > 0 ? work.gallery : [work.coverImage];
  const [index, setIndex] = useState(() => slideIndexByWork.get(work._id) ?? 0);

  useEffect(() => {
    slideIndexByWork.set(work._id, index);
  }, [work._id, index]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[index];
  const ratio = aspectOverride ?? aspect(current);
  return (
    // Switching states zooms each card into its new size in place. Scaling
    // about the card's own centre means nothing travels across the screen —
    // the anchored image stays exactly where it is and just resizes to fit.
    //
    // Deliberately scale-only, never opacity: if the animation loop is paused
    // (page rendered in a background tab) the element keeps whatever `initial`
    // set, and gating opacity there would leave every card invisible. At worst
    // this degrades to a card sitting at 94% size — still fully visible.
    <motion.div
      data-work-index={workIndex}
      initial={{ scale: 0.94 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-lg bg-sidebar ${widthClassName} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current._key ?? index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {current._type === "video" ? (
            <video
              src={current.videoUrl}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={urlFor(current).width(1400).quality(90).url()}
              alt={work.title}
              fill
              quality={90}
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {items.map((item, i) => (
            <button
              key={item._key ?? i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show media ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Widths/gaps taken straight off the Figma "corousel state" frames, measured
// against its 990px-wide showcase column: 1-col is an 800px column with 24px
// gaps; 2-col is a 900px column of two 438px cards, also 24px apart. Every
// card is 4:3.
function OneColumn({ works }: { works: WorkListItem[] }) {
  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6">
      {works.map((work, index) => (
        <WorkCarousel key={work._id} work={work} workIndex={index} aspectOverride={4 / 3} />
      ))}
    </div>
  );
}

function TwoColumn({ works }: { works: WorkListItem[] }) {
  return (
    <div className="mx-auto grid w-full max-w-[900px] grid-cols-2 gap-6">
      {works.map((work, index) => (
        <WorkCarousel key={work._id} work={work} workIndex={index} aspectOverride={4 / 3} />
      ))}
    </div>
  );
}

// True coverflow, measured off the Figma "corousel state" frames.
//
// The key thing the spec makes clear: every card is the SAME 700x525 (4:3)
// box sharing one centre point — the smaller ones are just that box scaled
// (500px = 0.714, 300px = 0.429, 200px = 0.286) and pushed along one axis.
// So the cards can't live in normal document flow; they're absolutely
// stacked on a pinned stage, and one scroll value drives every card's offset
// + scale + depth. Both 3D modes share this; they differ only in axis, so
// 3D-2 reads as a smooth horizontal glide driven by ordinary page scrolling
// (not a separate side-scroll container you have to swipe).
const CARD_W = 700;

// Signed distance from the focused card -> px offset, straight from Figma.
const OFFSET_D = [-3, -2, -1, 0, 1, 2, 3];
const OFFSET_Y = [-338, -260, -135, 0, 135, 260, 338];
const OFFSET_X = [-400, -305, -155, 0, 155, 305, 400];

// |distance| -> scale / blur / opacity. Scales are the Figma widths / 700.
const DIST = [0, 1, 2, 3, 4];
const SCALE = [1, 0.714, 0.429, 0.286, 0.2];
const BLUR = [0, 2, 5, 7, 8];
const FADE = [1, 0.9, 0.6, 0.28, 0];

function CoverflowCard({
  work,
  index,
  active,
  axis,
}: {
  work: WorkListItem;
  index: number;
  active: MotionValue<number>;
  axis: "x" | "y";
}) {
  const distance = useTransform(active, (a) => index - a);
  const absDistance = useTransform(distance, (d) => Math.abs(d));

  const offset = useTransform(distance, OFFSET_D, axis === "x" ? OFFSET_X : OFFSET_Y, {
    clamp: true,
  });
  const x = axis === "x" ? offset : 0;
  const y = axis === "y" ? offset : 0;

  const scale = useTransform(absDistance, DIST, SCALE, { clamp: true });
  const opacity = useTransform(absDistance, DIST, FADE, { clamp: true });
  const blurPx = useTransform(absDistance, DIST, BLUR, { clamp: true });
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`);
  const zIndex = useTransform(absDistance, (d) => Math.round(100 - d * 10));

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ x, y, scale, opacity, filter, zIndex }}
    >
      {/* The shared layoutId lives on the card *inside* this transform
          wrapper, not on the wrapper itself. getBoundingClientRect includes
          ancestor transforms, so framer measures the card where it actually
          appears and can fly it to/from the flow layouts — while the scroll
          -driven transform stays on a separate element it never touches. */}
      <div className="w-[700px] max-w-[86%]">
        <WorkCarousel work={work} workIndex={index} aspectOverride={4 / 3} />
      </div>
    </motion.div>
  );
}

function Coverflow({ works, axis }: { works: WorkListItem[]; axis: "x" | "y" }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Pinned-section pattern: the tall section provides the scroll distance,
  // the sticky stage stays put, and progress 0->1 walks the focused index
  // from the first card to the last.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const active = useTransform(scrollYProgress, [0, 1], [0, Math.max(works.length - 1, 0)]);

  // The horizontal variant also accepts sideways trackpad gestures: a
  // predominantly-horizontal wheel event is folded into the same page scroll
  // that drives everything else, so both input styles move one shared value.
  useEffect(() => {
    if (axis !== "x") return;
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      // "instant" rather than "auto": the page sets scroll-behavior: smooth,
      // which would ease each gesture tick and make the swipe feel laggy
      // instead of tracking the trackpad 1:1.
      window.scrollBy({ top: event.deltaX, behavior: "instant" });
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [axis]);

  return (
    <div
      ref={sectionRef}
      data-coverflow
      className="relative w-full"
      style={{ height: `${Math.max(works.length - 1, 1) * 60 + 100}vh` }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {works.map((work, index) => (
          <CoverflowCard
            key={work._id}
            work={work}
            index={index}
            active={active}
            axis={axis}
          />
        ))}
      </div>
    </div>
  );
}

// Floating "liquid glass" dock for switching layout modes.
//
// The sliding pill is driven by measured offsets rather than a shared
// layoutId. This bar is position: fixed, and framer measures layoutId
// elements against the scrolling document — so switching modes while
// scrolled down made the pill fly in from ~1500px away. offsetLeft/
// offsetWidth are relative to the bar itself, so they're immune to scroll.
function LayoutSwitcher({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const barRef = useRef<HTMLDivElement>(null);
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
      <div
        ref={barRef}
        className="relative flex items-center gap-0.5 rounded-full bg-[rgba(248,248,248,0.5)] p-1 backdrop-blur-xl backdrop-saturate-150"
        style={{
          isolation: "isolate",
          boxShadow:
            "0px 40px 5.5px rgba(0,0,0,0), 0px 26px 5px rgba(0,0,0,0.01), 0px 14px 4.5px rgba(0,0,0,0.05), 0px 6px 3px rgba(0,0,0,0.09), 0px 2px 2px rgba(0,0,0,0.1)",
        }}
      >
        <motion.span
          aria-hidden
          className="absolute bottom-1 top-1 left-0 rounded-full bg-[rgba(255,255,255,0.8)]"
          initial={false}
          animate={{ x: pill.left, width: pill.width }}
          transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.9 }}
          style={{
            boxShadow:
              "0px 7px 1px rgba(0,0,0,0), 0px 5px 1px rgba(0,0,0,0.01), 0px 3px 1px rgba(0,0,0,0.03), 0px 1px 0.5px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.05)",
          }}
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
              className={`group relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors focus:outline-none focus-visible:outline-none ${
                active ? "text-accent" : "text-[#4c4b4b] hover:text-accent"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Icon className="relative h-4 w-4" />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Showcase({ works }: { works: WorkListItem[] }) {
  const [mode, setMode] = useState<Mode>("1-col");
  const anchorRef = useRef(0);
  const lastIndex = Math.max(works.length - 1, 0);

  // Switching modes doesn't animate at all — it's an instant re-layout. The
  // only thing carried across is *which work you were looking at*, so the same
  // image stays on screen whichever state you pick.
  //
  // The anchor is the first work in reading order that's actually in view:
  // the top card in 1-col, the top-left card in 2-col, the focused card in the
  // 3D modes. Whatever that is becomes the anchor for the next switch.
  const readAnchor = () => {
    const section = document.querySelector<HTMLElement>("[data-coverflow]");
    if (section) {
      const range = section.offsetHeight - window.innerHeight;
      const progress = range > 0 ? (window.scrollY - section.offsetTop) / range : 0;
      return Math.round(Math.min(Math.max(progress, 0), 1) * lastIndex);
    }
    let best = 0;
    let bestTop = Infinity;
    document.querySelectorAll<HTMLElement>("[data-work-index]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Mostly-visible cards only, then the highest one wins; ties (a 2-col
      // row) resolve to the left card because they share a top and we keep
      // the first seen in DOM order.
      if (rect.bottom < rect.height * 0.5) return;
      if (rect.top < bestTop - 1) {
        bestTop = rect.top;
        best = Number(el.dataset.workIndex);
      }
    });
    return best;
  };

  // Put that work back where the eye already is: flush to the top of the
  // viewport for the flow layouts (so in 2-col it reads as the top-left card),
  // and exactly focused in the 3D modes. Landing on a whole index there is
  // what stops the focused card drifting when the axis flips — a fractional
  // index leaves it off-centre, and then it has somewhere to travel to.
  const restoreAnchor = (target: number) => {
    const section = document.querySelector<HTMLElement>("[data-coverflow]");
    if (section) {
      const range = Math.max(section.offsetHeight - window.innerHeight, 0);
      const progress = lastIndex > 0 ? target / lastIndex : 0;
      window.scrollTo({
        top: section.offsetTop + progress * range,
        left: 0,
        behavior: "instant",
      });
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-work-index="${target}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const desired = window.scrollY + rect.top - TOP_GUTTER;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0
    );
    window.scrollTo({
      top: Math.min(Math.max(desired, 0), maxScroll),
      left: 0,
      behavior: "instant",
    });
  };

  const handleModeChange = (next: Mode) => {
    anchorRef.current = readAnchor();
    setMode(next);
  };

  // Only restore on an actual mode change — on first mount there's nothing to
  // restore, and forcing a scroll there would fight the browser's own
  // scroll restoration when someone refreshes partway down the page.
  const isFirstRender = useRef(true);
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    restoreAnchor(anchorRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const is3D = mode === "3d-1" || mode === "3d-2";

  return (
    <div
      className={`flex w-full flex-1 flex-col items-center px-6 sm:px-10 ${
        is3D ? "" : "gap-8 py-10 pb-28 sm:py-12"
      }`}
    >
      {/* Deliberately unkeyed: every mode renders the same set of cards, each
          carrying a shared layoutId, so swapping modes lets framer fly each
          card from its old position/size to its new one instead of remounting
          the subtree. Applies to the 3D modes too, not just the columns. */}
      <div className="w-full">
        {works.length === 0 ? (
          <p className="text-sm text-muted">
            No work uploaded yet. Go to{" "}
            <a href="/studio" className="underline">
              /studio
            </a>{" "}
            to add your first project.
          </p>
        ) : mode === "1-col" ? (
          <OneColumn works={works} />
        ) : mode === "2-col" ? (
          <TwoColumn works={works} />
        ) : (
          // Both 3D modes render the same component at the same position, so
          // React reuses the instance instead of remounting — that's what lets
          // the axis spring across rather than cutting.
          <Coverflow key={mode} works={works} axis={mode === "3d-2" ? "x" : "y"} />
        )}
      </div>

      {works.length > 0 && <LayoutSwitcher mode={mode} onChange={handleModeChange} />}
    </div>
  );
}
