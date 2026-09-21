import type { CSSProperties } from "react";

/**
 * "Liquid glass" dock styling (Figma 88:826) for the layout switcher.
 */

// 12px backdrop blur on phones, 24px from lg up. The blur is recomputed every
// frame the canvas behind it moves, and its cost grows with the radius — the
// single most expensive thing on screen for a phone GPU while scrolling.
export const DOCK_CLASS =
  "relative flex items-center rounded-full p-1 backdrop-blur-md backdrop-saturate-150 lg:backdrop-blur-xl";

export const DOCK_STYLE: CSSProperties = {
  isolation: "isolate",
  // Two layers, grey over a black scrim. In Figma the drop-shadow casts from
  // the alpha silhouette, so it shows THROUGH the 50% fill and darkens the bar
  // — with the deeper shadow of the five-mode bar (175:451) it renders
  // #DFDFDF over white, not the #FCFCFC a naive 50% of #F8F8F8 would give.
  // box-shadow can't reproduce that (it's clipped outside the border box) and
  // a filter would create a backdrop root and kill the blur — so the bleed is
  // modelled as a scrim beneath the fill, which also behaves correctly over
  // the artwork the bar floats across. 0.2235 is what lands the measured
  // #DFDFDF: 0.5*248 + 0.5*255*(1-a) = 223.
  backgroundImage:
    "linear-gradient(rgba(248,248,248,0.5), rgba(248,248,248,0.5)), linear-gradient(rgba(0,0,0,0.2235), rgba(0,0,0,0.2235))",
  // Five stacked layers, the top one fully transparent so the falloff stays
  // soft. Kept as box-shadow rather than Figma's drop-shadow filter: an outer
  // box-shadow is clipped to outside the border box, so it can't darken the
  // glass from behind, and a filter here would kill the backdrop-blur.
  boxShadow:
    "0px 40px 5.5px rgba(0,0,0,0), 0px 26px 5px rgba(0,0,0,0.01), 0px 14px 4.5px rgba(0,0,0,0.05), 0px 6px 3px rgba(0,0,0,0.09), 0px 2px 2px rgba(0,0,0,0.1)",
};

/** The white "active" pill that sits behind the selected button. */
export const PILL_STYLE: CSSProperties = {
  // Same bleed-through modelling as the bar: the pill's own drop-shadow
  // darkens it to the measured #F3F3F3, not the #FEFEFE that 80% white over
  // the bar would otherwise produce.
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), linear-gradient(rgba(0,0,0,0.126), rgba(0,0,0,0.126))",
  boxShadow:
    "0px 7px 1px rgba(0,0,0,0), 0px 5px 1px rgba(0,0,0,0.01), 0px 3px 1px rgba(0,0,0,0.03), 0px 1px 0.5px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.05)",
};

export const PILL_SPRING = { type: "spring", stiffness: 500, damping: 32, mass: 0.9 } as const;

// Icons are deliberately a lighter tone than their labels — #49A8F1 against
// #1389e3 when active, #A7A5A5 against #4c4b4b when not.
export const ICON_ACTIVE = "text-[#49A8F1]";
export const ICON_INACTIVE = "text-[#A7A5A5] group-hover:text-[#49A8F1]";

export const DOCK_BUTTON_CLASS =
  "group relative flex items-center rounded-full outline-none transition-colors focus:outline-none focus-visible:outline-none";

export const NO_TAP_HIGHLIGHT: CSSProperties = { WebkitTapHighlightColor: "transparent" };
