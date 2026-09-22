"use client";

import { useEffect, useState } from "react";

/**
 * The time where Dhiya is, in the sidebar footer (Figma 186:1428).
 *
 * Read in Asia/Jakarta rather than from the visitor's clock, so it says what
 * time it is *there* wherever it's read from. The design writes it as
 * "16:24 pm / UTC+7" — a 24-hour clock that still carries am/pm, with the
 * slash a shade lighter than the rest — and this follows the design.
 *
 * Nothing is rendered until the component has mounted. The page is
 * prerendered and revalidated at most once a minute, so any time baked into
 * the HTML would be stale by the time anyone read it; a blank first frame in
 * the corner of the footer is better than a wrong time, and nothing moves
 * when it fills in — the footer's other half is anchored to the left.
 */
const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function jakartaNow() {
  const now = new Date();
  const hhmm = TIME.format(now);
  // Midnight comes back as "24:00" from some engines; treat it as hour zero.
  const hour = Number(hhmm.slice(0, 2)) % 24;
  return `${String(hour).padStart(2, "0")}${hhmm.slice(2)} ${
    hour < 12 ? "am" : "pm"
  }`;
}

export default function JakartaClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(jakartaNow());
    let timer: ReturnType<typeof setTimeout>;
    // Tick on the minute rather than every few seconds: the clock only shows
    // minutes, so anything more often is work nobody can see.
    const schedule = () => {
      const ms = 60_000 - (Date.now() % 60_000);
      timer = setTimeout(() => {
        setTime(jakartaNow());
        schedule();
      }, ms + 50);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className={className} suppressHydrationWarning>
      {time ?? " "}
      {time && (
        <>
          {/* The slash is a shade lighter than what it separates, the same
              way it is between the marks in the footer. */}
          <span className="text-[#a6a6a6]">{" / "}</span>
          UTC+7
        </>
      )}
    </p>
  );
}
