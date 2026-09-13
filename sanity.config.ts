/**
 * This config powers the embedded Sanity Studio, available at /studio on
 * your live site. That's where you'll log in and upload/manage your work.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { projectId, dataset, apiVersion } from "./src/lib/sanity";

export default defineConfig({
  name: "default",
  title: "Portfolio CMS",

  projectId,
  dataset,
  basePath: "/studio",

  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],

  schema: {
    types: schemaTypes,
  },
});
