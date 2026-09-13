"use client";

import { useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { urlFor } from "@/lib/sanity";
import type { WorkListItem } from "@/lib/queries";

type Mode = "1-col" | "2-col" | "3d-1" | "3d-2";
type IconProps = { className?: string };

// Layout-switcher icons, exact paths exported from the Figma toggle control
// (fill swapped for currentColor so active/inactive tinting still works).
function OneColIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M11.7333 1.33333H4.26667C3.7512 1.33333 3.33333 1.75973 3.33333 2.28571V13.7143C3.33333 14.2403 3.7512 14.6667 4.26667 14.6667H11.7333C12.2488 14.6667 12.6667 14.2403 12.6667 13.7143V2.28571C12.6667 1.75973 12.2488 1.33333 11.7333 1.33333Z"
      />
    </svg>
  );
}

function TwoColIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M1.33333 2C1.33333 1.63181 1.63181 1.33333 2 1.33333H6.66667C7.03487 1.33333 7.33333 1.63181 7.33333 2V14C7.33333 14.3682 7.03487 14.6667 6.66667 14.6667H2C1.63181 14.6667 1.33333 14.3682 1.33333 14V2Z"
      />
      <path
        fill="currentColor"
        d="M8.66667 2C8.66667 1.63181 8.96513 1.33333 9.33333 1.33333H14C14.3682 1.33333 14.6667 1.63181 14.6667 2V14C14.6667 14.3682 14.3682 14.6667 14 14.6667H9.33333C8.96513 14.6667 8.66667 14.3682 8.66667 14V2Z"
      />
    </svg>
  );
}

function ThreeDOneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M13.9999 3.33333H12.6667L12.6667 4V12L12.6667 12.6667H13.9999C14.3681 12.6667 14.6666 12.3682 14.6666 12V4C14.6666 3.63181 14.3681 3.33333 13.9999 3.33333Z"
      />
      <path
        fill="currentColor"
        d="M2.00003 3.33333H3.33332L3.3333 4V12L3.33333 12.6667H2.00003C1.63185 12.6667 1.33337 12.3682 1.33337 12V4C1.33337 3.63181 1.63185 3.33333 2.00003 3.33333Z"
      />
      <path
        fill="currentColor"
        d="M4 2C4 1.63181 4.35817 1.33333 4.8 1.33333H11.2C11.6418 1.33333 12 1.63181 12 2V14C12 14.3682 11.6418 14.6667 11.2 14.6667H4.8C4.35817 14.6667 4 14.3682 4 14V2Z"
      />
    </svg>
  );
}

function ThreeDTwoIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        fill="currentColor"
        d="M3.33333 2.00003V3.33332L4 3.3333H12L12.6667 3.33333V2.00003C12.6667 1.63185 12.3682 1.33337 12 1.33337H4C3.63181 1.33337 3.33333 1.63185 3.33333 2.00003Z"
      />
      <path
        fill="currentColor"
        d="M3.33333 13.9999V12.6667L4 12.6667H12L12.6667 12.6667V13.9999C12.6667 14.3681 12.3682 14.6666 12 14.6666H4C3.63181 14.6666 3.33333 14.3681 3.33333 13.9999Z"
      />
      <path
        fill="currentColor"
        d="M2 12C1.63181 12 1.33333 11.6418 1.33333 11.2V4.8C1.33333 4.35817 1.63181 4 2 4H14C14.3682 4 14.6667 4.35817 14.6667 4.8V11.2C14.6667 11.6418 14.3682 12 14 12H2Z"
      />
    </svg>
  );
}

const MODES: { id: Mode; label: string; icon: ComponentType<IconProps> }[] = [
  { id: "1-col", label: "1-Col", icon: OneColIcon },
  { id: "2-col", label: "2-Col", icon: TwoColIcon },
  { id: "3d-1", label: "3D - 1", icon: ThreeDOneIcon },
  { id: "3d-2", label: "3D - 2", icon: ThreeDTwoIcon },
];

function aspect(work: WorkListItem): number {
  const dims = (work.coverImage as { dimensions?: { width: number; height: number } })
    ?.dimensions;
  if (dims?.width && dims?.height) return dims.width / dims.height;
  return 4 / 3;
}

function GalleryItem({
  work,
  widthPx,
  className = "",
}: {
  work: WorkListItem;
  widthPx: number;
  className?: string;
}) {
  const ratio = aspect(work);
  const url = urlFor(work.coverImage)
    .width(Math.round(widthPx))
    .quality(92)
    .url();

  return (
    <Link
      href={`/work/${work.slug}`}
      className={`group block overflow-hidden rounded-lg bg-sidebar ${className}`}
    >
      <div className="relative w-full" style={{ aspectRatio: ratio }}>
        <Image
          src={url}
          alt={work.title}
          fill
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    </Link>
  );
}

function OneColumn({ works }: { works: WorkListItem[] }) {
  return (
    <div className="flex w-full flex-col gap-8">
      {works.map((work) => (
        <GalleryItem key={work._id} work={work} widthPx={700} />
      ))}
    </div>
  );
}

function TwoColumn({ works }: { works: WorkListItem[] }) {
  return (
    <div className="grid w-full grid-cols-2 gap-6">
      {works.map((work) => (
        <div key={work._id} className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <Link href={`/work/${work.slug}`} className="group block h-full w-full">
            <Image
              src={urlFor(work.coverImage).width(500).height(375).fit("crop").quality(92).url()}
              alt={work.title}
              fill
              sizes="(min-width: 1024px) 340px, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>
        </div>
      ))}
    </div>
  );
}

function ThreeDOne({ works }: { works: WorkListItem[] }) {
  return (
    <div className="w-full columns-2 gap-6 [column-fill:balance]">
      {works.map((work) => (
        <div key={work._id} className="mb-6 break-inside-avoid">
          <GalleryItem work={work} widthPx={340} />
        </div>
      ))}
    </div>
  );
}

function ThreeDTwoColumn({
  works,
  offset,
}: {
  works: WorkListItem[];
  offset: number;
}) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

  return (
    <motion.div style={{ y }} className="flex flex-1 flex-col gap-6">
      {works.map((work) => (
        <GalleryItem key={work._id} work={work} widthPx={340} />
      ))}
    </motion.div>
  );
}

function ThreeDTwo({ works }: { works: WorkListItem[] }) {
  const left = works.filter((_, i) => i % 2 === 0);
  const right = works.filter((_, i) => i % 2 === 1);

  return (
    <div className="flex w-full gap-6">
      <ThreeDTwoColumn works={left} offset={-60} />
      <ThreeDTwoColumn works={right} offset={60} />
    </div>
  );
}

export default function Showcase({ works }: { works: WorkListItem[] }) {
  const [mode, setMode] = useState<Mode>("1-col");

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-8 px-6 py-10 sm:px-10 sm:py-12">
      <div className="w-full max-w-[700px]">
        {works.length === 0 ? (
          <p className="text-sm text-muted">
            No work uploaded yet. Go to{" "}
            <a href="/studio" className="underline">
              /studio
            </a>{" "}
            to add your first project.
          </p>
        ) : mode === "1-col" ? (
          <OneColumn works={works} />
        ) : mode === "2-col" ? (
          <TwoColumn works={works} />
        ) : mode === "3d-1" ? (
          <ThreeDOne works={works} />
        ) : (
          <ThreeDTwo works={works} />
        )}
      </div>

      {works.length > 0 && (
        <div className="sticky bottom-6 z-10 flex items-center gap-0.5 rounded-full bg-sidebar/50 p-1 shadow-lg backdrop-blur">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/80 text-accent shadow-sm"
                    : "text-[#4c4b4b] hover:text-heading"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
