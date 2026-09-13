import type { ComponentType } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

function Logomark() {
  // Small waveform mark next to the "dsign" wordmark.
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="0" y="6" width="3" height="8" rx="1.5" fill="#181717" />
      <rect x="5.5" y="2" width="3" height="16" rx="1.5" fill="#181717" />
      <rect x="11" y="5" width="3" height="10" rx="1.5" fill="#181717" />
      <rect x="16.5" y="8" width="3" height="4" rx="1.5" fill="#181717" />
    </svg>
  );
}

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
      <div
        className={
          tone === "dark"
            ? "flex shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-gradient-to-b from-[#797979] via-[#5a5a5c] to-[#373b3f] p-1 shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.3)]"
            : "flex shrink-0 items-center justify-center rounded-lg border-[0.5px] border-black/5 bg-white p-1 shadow-sm"
        }
      >
        <Icon
          className={tone === "dark" ? "h-3.5 w-3.5 text-white" : "h-3.5 w-3.5 text-[#141414]"}
        />
      </div>
      <p className="truncate text-sm font-medium text-skill">{label}</p>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col justify-between gap-8 bg-sidebar p-8 sm:p-10 lg:sticky lg:top-0 lg:h-screen lg:w-[457px] lg:overflow-y-auto">
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Logo + intro */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Logomark />
            <span className="text-lg font-semibold tracking-tight text-heading">
              dsign
            </span>
          </div>
          <p className="text-base leading-6 tracking-[-0.08px] text-foreground">
            {siteConfig.bio}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4">
          <a
            href={`mailto:${siteConfig.email}`}
            className="flex items-center gap-1.5 rounded-full border border-accent bg-gradient-to-b from-[#2ba2fe] to-[#1389e3] py-2 pl-3 pr-2 shadow-[0px_1px_1.5px_rgba(22,148,246,0.15)]"
          >
            <span className="text-sm font-semibold text-white">Send Email</span>
            <ArrowUpRight className="h-3 w-3 text-white" />
          </a>
          <a
            href={siteConfig.chatUrl}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.02] bg-white py-2 pl-2 pr-3 shadow-sm"
          >
            <MessageCircle className="h-4 w-4 text-[#1e1e1e]" />
            <span className="text-sm font-semibold text-[#1e1e1e]">Chat Now</span>
          </a>
        </div>

        {/* Worked with */}
        {siteConfig.workedWith.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">I&rsquo;ve worked with</p>
            <div
              className="flex gap-8 overflow-x-auto"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
              }}
            >
              {siteConfig.workedWith.map((name) => (
                <span
                  key={name}
                  className="shrink-0 whitespace-nowrap text-base font-semibold text-[#181717]/70"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Design skills */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Design</p>
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
            <p className="text-sm text-muted">Development</p>
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
