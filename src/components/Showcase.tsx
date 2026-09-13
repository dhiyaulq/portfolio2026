"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Rows3, Columns2, Box, Layers } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { urlFor } from "@/lib/sanity";
import type { WorkListItem } from "@/lib/queries";

type Mode = "1-col" | "2-col" | "3d-1" | "3d-2";

const MODES: { id: Mode; label: string; icon: typeof Rows3 }[] = [
  { id: "1-col", label: "1-Col", icon: Rows3 },
  { id: "2-col", label: "2-Col", icon: Columns2 },
  { id: "3d-1", label: "3D - 1", icon: Box },
  { id: "3d-2", label: "3D - 2", icon: Layers },
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
