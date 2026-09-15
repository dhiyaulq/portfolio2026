import { defineField, defineType } from "sanity";

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "e.g. Branding, Photography, UI Design",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      description:
        "The main thumbnail shown on the homepage grid. Upload the highest quality JPG you have — Sanity automatically serves optimized/responsive versions on the site, it keeps the original quality in the CMS.",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Showcase media",
      type: "array",
      description:
        "The images/videos shown for this project on the homepage carousel. Leave empty to just show the cover image.",
      of: [
        {
          type: "image",
          title: "Image",
          options: { hotspot: true },
        },
        {
          type: "file",
          name: "video",
          title: "Video",
          options: { accept: "video/*" },
        },
      ],
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers show first on the homepage. Optional.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "coverImage",
    },
  },
});
