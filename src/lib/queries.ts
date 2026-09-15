import { groq } from "next-sanity";

// All published work items, ordered by the manual "order" field (lowest first),
// falling back to newest-created first. Pulls the full showcase gallery so the
// homepage carousel can cycle through each work's images/videos directly.
export const ALL_WORK_QUERY = groq`
  *[_type == "work" && defined(slug.current)] | order(order asc, _createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    category,
    year,
    coverImage {
      ...,
      "dimensions": asset->metadata.dimensions
    },
    gallery[] {
      _key,
      _type,
      ...,
      "dimensions": asset->metadata.dimensions,
      "videoUrl": asset->url
    }
  }
`;

export type MediaItem = {
  _key: string;
  _type: "image" | "video";
  dimensions?: { width: number; height: number };
  videoUrl?: string;
  [key: string]: unknown;
};

export type WorkListItem = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  coverImage: MediaItem;
  gallery?: MediaItem[];
  year?: number;
};
