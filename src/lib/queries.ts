import { groq } from "next-sanity";

// All published work items, ordered by the manual "order" field (lowest first),
// falling back to newest-created first.
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
    }
  }
`;

// One work item by slug, including the full image gallery for its detail page.
export const WORK_BY_SLUG_QUERY = groq`
  *[_type == "work" && slug.current == $slug][0] {
    _id,
    title,
    category,
    year,
    description,
    coverImage,
    gallery
  }
`;

export type WorkListItem = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  coverImage: any;
  year?: number;
};

export type WorkDetail = {
  _id: string;
  title: string;
  category?: string;
  year?: number;
  description?: string;
  coverImage: any;
  gallery?: any[];
};
