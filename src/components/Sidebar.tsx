import { siteConfig } from "@/lib/siteConfig";
import SendEmailButton from "@/components/SendEmailButton";
import ChatNowButton from "@/components/ChatNowButton";
import LogoMarquee from "@/components/LogoMarquee";
import ServicesAccordion from "@/components/ServicesAccordion";
import JakartaClock from "@/components/JakartaClock";

// Footer line (Figma 186:1428): 13px/17px, 0.065px tracking, #626262, with
// the copyright at one end and the time in Jakarta at the other.
const FOOTER =
  "text-[13px] leading-[17px] tracking-[0.065px] text-[#626262] whitespace-nowrap";

export default function Sidebar() {
  return (
    // 410px column on desktop with 40px of padding, 20px on a phone
    // (Figma 186:989 and 186:1278).
    <aside className="flex min-h-svh w-full shrink-0 flex-col justify-between bg-sidebar p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:min-h-0 lg:w-[410px] lg:overflow-y-auto lg:p-10">
      {/* 32px between the sidebar's parts on a phone, 40px on desktop. */}
      <div className="flex flex-col gap-8 lg:gap-10">
        {/* The intro reads as one block: logo, what he does, how to reach
            him — 20px from the logo to the text, 24px down to the buttons. */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            {/* Just the mark up here now (Figma 187:1609) — the wordmark
                moved to the footer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/dsign-mark.svg"
              alt="Dsign Space"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 self-start"
            />

            <p className="text-[15px] leading-[23px] tracking-[-0.075px] text-foreground">
              {siteConfig.bio}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <SendEmailButton email={siteConfig.email} />
            <ChatNowButton href={siteConfig.chatUrl} />
          </div>
        </div>

        {/* The logos speak for themselves now — the "I've worked with" line
            above them is gone from the design. */}
        {siteConfig.workedWith.length > 0 && (
          <LogoMarquee logos={siteConfig.workedWith} />
        )}

        <ServicesAccordion />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex shrink-0 items-start gap-[5px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dsign-logo-small.svg"
            alt="Dsign Space"
            width={86}
            height={16}
            className="h-4 w-[86px] shrink-0"
          />
          <p className={FOOTER}>{siteConfig.copyright}</p>
        </div>
        <JakartaClock className={FOOTER} />
      </div>
    </aside>
  );
}
