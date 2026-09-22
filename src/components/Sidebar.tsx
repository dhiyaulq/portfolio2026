import { siteConfig } from "@/lib/siteConfig";
import SendEmailButton from "@/components/SendEmailButton";
import ChatNowButton from "@/components/ChatNowButton";
import LogoMarquee from "@/components/LogoMarquee";
import ServicesAccordion from "@/components/ServicesAccordion";
import JakartaClock from "@/components/JakartaClock";
import SocialLinks from "@/components/SocialLinks";

// The two small lines the sidebar is hung between — the clock at the top and
// the copyright at the bottom (Figma 187:1609 and 186:1428). 13px/16px,
// 0.065px tracking, #626262.
const SMALL =
  "text-[13px] leading-4 tracking-[0.065px] text-[#626262] whitespace-nowrap";

export default function Sidebar() {
  return (
    // 410px column on desktop with 40px of padding, 20px on a phone
    // (Figma 186:989 and 186:1278).
    <aside className="flex min-h-svh w-full shrink-0 flex-col justify-between bg-sidebar p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:min-h-0 lg:w-[410px] lg:overflow-y-auto lg:p-10">
      {/* 32px between the sidebar's parts on a phone, 40px on desktop. */}
      <div className="flex flex-col gap-8 lg:gap-10">
        {/* The intro reads as one block: who and where, what he does, how to
            reach him — 24px from the top line to the text, 24px down to the
            buttons. */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            {/* Mark at one end, the time where he is at the other. */}
            <div className="flex h-6 items-center justify-between gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/dsign-mark.svg"
                alt="Dsign Space"
                width={24}
                height={24}
                className="h-6 w-6 shrink-0"
              />
              <JakartaClock className={SMALL} />
            </div>

            <p className="text-[15px] leading-[23px] tracking-[-0.075px] text-foreground">
              {siteConfig.bio}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <SendEmailButton email={siteConfig.email} />
            <ChatNowButton href={siteConfig.chatUrl} />
          </div>
        </div>

        {siteConfig.workedWith.length > 0 && (
          <LogoMarquee logos={siteConfig.workedWith} />
        )}

        <ServicesAccordion />
      </div>

      {/* Wordmark and copyright at one end, the three links at the other. */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-[5px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dsign-logo-small.svg"
            alt="Dsign Space"
            width={86}
            height={16}
            className="h-4 w-[86px] shrink-0"
          />
          <p className={SMALL}>{siteConfig.copyright}</p>
        </div>
        <SocialLinks />
      </div>
    </aside>
  );
}
