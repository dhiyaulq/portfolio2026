import type { CSSProperties } from "react";

/**
 * "Liquid glass" dock styling (Figma 88:826) for the layout switcher.
 */

// 3px of backdrop blur, as the design specifies (175:428). The blur is
// recomputed every frame the canvas behind it moves and its cost grows with
// the radius, so a small one is also the cheapest thing to ask a phone GPU
// for while scrolling. The saturation isn't from Figma — it's what keeps a
// blur this gentle reading as glass rather than as a flat grey panel.
export const DOCK_CLASS =
  "relative flex items-center rounded-full p-1 backdrop-blur-[3px] backdrop-saturate-150";

export const DOCK_STYLE: CSSProperties = {
  isolation: "isolate",
  // Two layers, grey over a black scrim. In Figma the drop-shadow casts from
  // the alpha silhouette, so it shows THROUGH the 80% fill and darkens the
  // bar: it renders #EEEEEE over white, not the #F3F3F3 that 80% of #F1F1F1
  // alone would give. box-shadow can't reproduce that (it's clipped outside
  // the border box) and a filter would create a backdrop root and kill the
  // blur — so the bleed is modelled as a scrim beneath the fill, which also
  // behaves correctly over the artwork the bar floats across. 0.114 is what
  // lands the measured #EEEEEE: 0.8*241 + 0.2*255*(1-a) = 238.
  backgroundImage:
    "linear-gradient(rgba(241,241,241,0.8), rgba(241,241,241,0.8)), linear-gradient(rgba(0,0,0,0.114), rgba(0,0,0,0.114))",
  // Five stacked layers, the top one fully transparent so the falloff stays
  // soft. Kept as box-shadow rather than Figma's drop-shadow filter: an outer
  // box-shadow is clipped to outside the border box, so it can't darken the
  // glass from behind, and a filter here would kill the backdrop-blur. The
  // last layer is the bar's 1px stroke, drawn inset: Figma aligns it inside,
  // so a real border would make the bar 42px tall instead of 40.
  boxShadow:
    "0px 33px 4.5px rgba(0,0,0,0), 0px 21px 4px rgba(0,0,0,0.01), 0px 12px 3.5px rgba(0,0,0,0.03), 0px 5px 2.5px rgba(0,0,0,0.04), 0px 1px 1.5px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(153,153,153,0.1)",
};

/** The white "active" pill that sits behind the selected button. */
export const PILL_STYLE: CSSProperties = {
  // Same bleed-through modelling as the bar: the pill's own drop-shadow
  // darkens it to the measured #F6F6F6, not the #FEFEFE that 80% white over
  // the bar would otherwise produce.
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), linear-gradient(rgba(0,0,0,0.118), rgba(0,0,0,0.118))",
  // Last layer is the pill's own hairline stroke, inset for the same reason
  // as the bar's — barely there at 2% of a grey, but it's in the design.
  boxShadow:
    "0px 7px 1px rgba(0,0,0,0), 0px 5px 1px rgba(0,0,0,0.01), 0px 3px 1px rgba(0,0,0,0.03), 0px 1px 0.5px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(153,153,153,0.02)",
};

export const PILL_SPRING = { type: "spring", stiffness: 500, damping: 32, mass: 0.9 } as const;

// Icons are deliberately a lighter tone than their labels — #49A8F1 against
// #1389e3 when active, #A7A5A5 against #4c4b4b when not.
export const ICON_ACTIVE = "text-[#49A8F1]";
export const ICON_INACTIVE = "text-[#A7A5A5] group-hover:text-[#49A8F1]";

export const DOCK_BUTTON_CLASS =
  "group relative flex items-center rounded-full outline-none transition-colors focus:outline-none focus-visible:outline-none";

export const NO_TAP_HIGHLIGHT: CSSProperties = { WebkitTapHighlightColor: "transparent" };
