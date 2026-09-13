import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Use the CDN in production for fast, cached reads. Set to false if you
  // need to see brand-new uploads instantly while testing.
  useCdn: process.env.NODE_ENV === "production",
});

const builder = imageUrlBuilder(client);

/**
 * Build an optimized image URL from a Sanity image reference.
 * Usage: <img src={urlFor(work.image).width(1600).url()} />
 */
export function urlFor(source: Image) {
  return builder.image(source);
}
