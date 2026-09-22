import { Fragment } from "react";
import { siteConfig } from "@/lib/siteConfig";

/**
 * The three places to find Dhiya, bottom right of the sidebar
 * (Figma 192:2321). 16px marks 4px apart, separated by slashes.
 *
 * Drawn inline rather than loaded as images so they take their colour from
 * the link — which is what lets them lift to the body colour on hover. The
 * LinkedIn mark is a filled shape and the other two are strokes, so one
 * follows `fill` and the others `stroke`; both resolve to currentColor.
 */
type IconProps = { className?: string };

/** akar-icons:linkedin-fill (194:2326). */
function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M6.286 5.97933H8.762V7.21267C9.11867 6.50333 10.0333 5.866 11.4073 5.866C14.0413 5.866 14.6667 7.278 14.6667 9.86867V14.6667H12V10.4587C12 8.98333 11.6433 8.15133 10.7353 8.15133C9.476 8.15133 8.95267 9.048 8.95267 10.458V14.6667H6.286V5.97933ZM1.71333 14.5533H4.38V5.866H1.71333V14.5533ZM4.762 3.03333C4.7621 3.25685 4.71777 3.47816 4.63159 3.68439C4.54541 3.89063 4.4191 4.07768 4.26 4.23467C4.10043 4.39341 3.91114 4.51916 3.70295 4.60472C3.49476 4.69028 3.27175 4.73399 3.04667 4.73333C2.59307 4.73231 2.15794 4.55352 1.83467 4.23533C1.6762 4.07776 1.55035 3.8905 1.46433 3.68425C1.37831 3.47799 1.33379 3.25681 1.33333 3.03333C1.33333 2.582 1.51333 2.15 1.83533 1.83133C2.1578 1.51192 2.59345 1.33292 3.04733 1.33333C3.502 1.33333 3.938 1.51267 4.26 1.83133C4.582 2.15 4.762 2.582 4.762 3.03333Z"
      />
    </svg>
  );
}

/** instagram (192:2313). */
function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8C2 5.17157 2 3.75736 2.87868 2.87868C3.75736 2 5.17157 2 8 2C10.8284 2 12.2427 2 13.1213 2.87868C14 3.75736 14 5.17157 14 8C14 10.8284 14 12.2427 13.1213 13.1213C12.2427 14 10.8284 14 8 14C5.17157 14 3.75736 14 2.87868 13.1213C2 12.2427 2 10.8284 2 8Z" />
        <path d="M10.6667 8C10.6667 9.47273 9.47273 10.6667 8 10.6667C6.52724 10.6667 5.33333 9.47273 5.33333 8C5.33333 6.52724 6.52724 5.33333 8 5.33333C9.47273 5.33333 10.6667 6.52724 10.6667 8Z" />
        <path
          d="M11.5832 4.50016H11.4999M11.6665 4.50016C11.6665 4.59221 11.5919 4.66683 11.4999 4.66683C11.4078 4.66683 11.3332 4.59221 11.3332 4.50016C11.3332 4.40811 11.4078 4.33349 11.4999 4.33349C11.5919 4.33349 11.6665 4.40811 11.6665 4.50016Z"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

/** hugeicons:new-twitter (194:2329) — the mark on its own, no surround. */
function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M2 14L7.032 8.968M7.032 8.968L2 2H5.33333L8.968 7.032M7.032 8.968L10.6667 14H14L8.968 7.032M14 2L8.968 7.032"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  x: XIcon,
} as const;

export default function SocialLinks() {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {siteConfig.socials.map(({ id, label, href }, i) => {
        const Icon = ICONS[id];
        return (
          <Fragment key={id}>
            {i > 0 && (
              <span
                aria-hidden
                className="text-[13px] leading-4 tracking-[0.065px] text-[#a6a6a6]"
              >
                /
              </span>
            )}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-[#737373] transition-colors hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          </Fragment>
        );
      })}
    </div>
  );
}
