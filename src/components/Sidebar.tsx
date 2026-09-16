import type { ComponentType } from "react";
import { siteConfig } from "@/lib/siteConfig";
import SendEmailButton from "@/components/SendEmailButton";
import ChatNowButton from "@/components/ChatNowButton";
import LogoMarquee from "@/components/LogoMarquee";

// Section headings ("I've worked with" / "Design" / "Development"), Figma
// 127:260 — 15px/23px, -0.075px tracking, #7d7d7d.
const SECTION_LABEL =
  "text-[15px] leading-[23px] tracking-[-0.075px] text-[#7d7d7d]";

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

function SkillBadge({
  icon: Icon,
  label,
  tone = "dark",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className="flex flex-1 items-center gap-2 min-w-0">
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
          className={tone === "dark" ? "h-3.5 w-3.5 text-white" : "h-3.5 w-3.5 text-[#141414]"}
        />
      </div>
      <p className="truncate text-[15px] leading-[23px] tracking-[-0.075px] text-skill">
        {label}
      </p>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex min-h-svh w-full shrink-0 flex-col justify-between gap-8 bg-sidebar p-5 lg:fixed lg:p-10 lg:min-h-0 lg:inset-y-0 lg:left-0 lg:h-screen lg:w-[457px] lg:overflow-y-auto">
      {/* Section spacing: 40px on mobile (Figma 155:37), 32px on desktop. */}
      <div className="flex flex-col gap-10 lg:gap-8">
        {/* Figma 127:237 — the logo/intro block and the CTA row are one group
            with 24px between them (16px logo→intro). On mobile (155:38) the
            logo, intro and CTAs are simply 32px apart. */}
        <div className="flex flex-col gap-8 lg:gap-6">
          <div className="flex flex-col gap-8 lg:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/dsign-logo.svg"
              alt="dsign"
              className="h-6 w-[78px] shrink-0 self-start"
            />

            <p className="text-[15px] leading-[23px] tracking-[-0.075px] text-foreground">
              {siteConfig.bio}
            </p>
          </div>

          {/* CTA buttons (127:251, 16px) */}
          <div className="flex flex-wrap gap-4">
            <SendEmailButton email={siteConfig.email} />
            <ChatNowButton href={siteConfig.chatUrl} />
          </div>
        </div>

        {/* Worked with */}
        {siteConfig.workedWith.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className={SECTION_LABEL}>I&rsquo;ve worked with</p>
            <LogoMarquee logos={siteConfig.workedWith} />
          </div>
        )}

        {/* Design skills */}
        <div className="flex flex-col gap-3">
          <p className={SECTION_LABEL}>Design</p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: Math.ceil(siteConfig.design.length / 2) }).map(
              (_, row) => (
                <div key={row} className="flex gap-4">
                  {siteConfig.design.slice(row * 2, row * 2 + 2).map((item) => (
                    <SkillBadge key={item.label} icon={item.icon} label={item.label} tone="dark" />
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Development tools */}
        {siteConfig.development.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className={SECTION_LABEL}>Development</p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: Math.ceil(siteConfig.development.length / 2) }).map(
                (_, row) => (
                  <div key={row} className="flex gap-4">
                    {siteConfig.development.slice(row * 2, row * 2 + 2).map((item) => (
                      <SkillBadge key={item.label} icon={item.icon} label={item.label} tone="light" />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs tracking-[0.06px] text-muted">{siteConfig.copyright}</p>
    </aside>
  );
}
