import { siteConfig } from "@/lib/siteConfig";

/**
 * The three places to find Dhiya, bottom right of the sidebar
 * (Figma 192:2321). 16px icons, 8px apart.
 *
 * Drawn inline rather than loaded as images so they can take their colour
 * from the link — these are stroked icons, and the stroke follows
 * currentColor, which is what lets them lift to the body colour on hover.
 */
type IconProps = { className?: string };

function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeLinejoin="round">
        <path d="M4.66667 6.66667V11.3333" strokeLinecap="square" />
        <path
          d="M7.33333 8.66667V11.3333M7.33333 8.66667C7.33333 7.56207 8.22873 6.66667 9.33333 6.66667C10.4379 6.66667 11.3333 7.56207 11.3333 8.66667V11.3333M7.33333 8.66667V6.66667"
          strokeLinecap="square"
        />
        <path
          d="M4.75 4.5H4.66667M4.83333 4.5C4.83333 4.59205 4.75871 4.66667 4.66667 4.66667C4.57462 4.66667 4.5 4.59205 4.5 4.5C4.5 4.40795 4.57462 4.33333 4.66667 4.33333C4.75871 4.33333 4.83333 4.40795 4.83333 4.5Z"
          strokeLinecap="round"
        />
        <path
          d="M2 8C2 5.17157 2 3.75736 2.87868 2.87868C3.75736 2 5.17157 2 8 2C10.8284 2 12.2427 2 13.1213 2.87868C14 3.75736 14 5.17157 14 8C14 10.8284 14 12.2427 13.1213 13.1213C12.2427 14 10.8284 14 8 14C5.17157 14 3.75736 14 2.87868 13.1213C2 12.2427 2 10.8284 2 8Z"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

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

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.66675 8C1.66675 5.01444 1.66675 3.52166 2.59424 2.59416C3.52174 1.66667 5.01452 1.66667 8.00007 1.66667C10.9857 1.66667 12.4784 1.66667 13.4059 2.59416C14.3334 3.52166 14.3334 5.01444 14.3334 8C14.3334 10.9855 14.3334 12.4783 13.4059 13.4059C12.4784 14.3333 10.9857 14.3333 8.00007 14.3333C5.01452 14.3333 3.52174 14.3333 2.59424 13.4059C1.66675 12.4783 1.66675 10.9855 1.66675 8Z" />
        <path d="M4.66675 11.3333L7.46247 8.53767M8.53773 7.46233L11.3334 11.3333H9.48153L7.46247 8.53767L4.66675 4.66667H6.5186L8.53773 7.46233ZM11.3334 4.66667L8.53773 7.46233" />
      </g>
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
    <div className="flex shrink-0 items-center gap-2">
      {siteConfig.socials.map(({ id, label, href }) => {
        const Icon = ICONS[id];
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-[#626262] transition-colors hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}
