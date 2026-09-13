import type { ComponentType } from "react";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import SendEmailButton from "@/components/SendEmailButton";

function WorkedWithLogo({
  logo,
}: {
  logo: { name: string; logo?: string; mark?: string; type?: string };
}) {
  if (logo.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo.logo} alt={logo.name} className="h-6 w-auto shrink-0" />;
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.mark} alt="" className="h-6 w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.type} alt={logo.name} className="h-5 w-auto" />
    </span>
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
            : "flex shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[rgba(0,0,0,0.07)] bg-white p-1 shadow-[0px_4px_0.5px_rgba(0,0,0,0),0px_2px_0.5px_rgba(0,0,0,0.01),0px_1px_0.5px_rgba(0,0,0,0.03),0px_1px_0.5px_rgba(0,0,0,0.04)]"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dsign-logo.svg"
            alt="dsign"
            className="h-[26px] w-[94px] shrink-0 self-start"
          />

          <p className="text-base leading-6 tracking-[-0.08px] text-foreground">
            {siteConfig.bio}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4">
          <SendEmailButton email={siteConfig.email} />
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
              {siteConfig.workedWith.map((logo) => (
                <WorkedWithLogo key={logo.name} logo={logo} />
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
