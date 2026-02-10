import { z } from "zod";

export const CURRENT_PROJECT_SCHEMA_VERSION = "1.0.0";

const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, "Expected semver format x.y.z");

export const ProjectSchema = z.object({
  schemaVersion: SemverSchema,
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  clientName: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  seed: z.string().min(8),
});

export const SiteSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  baseUrl: z.string().default(""),
  navigation: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  footer: z.object({ text: z.string().default("") }).default({ text: "" }),
  seoDefaults: z.object({
    titleTemplate: z.string().default("%s"),
    description: z.string().default(""),
  }),
});

export const ThemeSchema = z.object({
  tokens: z.object({
    colorPrimary: z.string().default("#1d4ed8"),
    colorText: z.string().default("#111827"),
    colorBackground: z.string().default("#ffffff"),
    spacingBase: z.number().int().positive().default(8),
    radiusBase: z.number().int().nonnegative().default(8),
    fontBody: z.string().default("Inter, system-ui, sans-serif"),
    fontHeading: z.string().default("Inter, system-ui, sans-serif"),
  }),
});

export const PageManifestSchema = z.object({
  pageId: z.string().min(1),
  route: z.string().min(1),
  title: z.string().min(1),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  blocks: z.array(
    z.object({
      instanceId: z.string().min(1),
      blockId: z.string().min(1),
      props: z.record(z.string(), z.unknown()).default({}),
      contentRefs: z.record(z.string(), z.string()).default({}),
      styleOverrides: z.record(z.string(), z.unknown()).default({}),
      visibility: z.enum(["visible", "hidden"]).default("visible"),
    })
  ),
});

export const ContentRecordSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export const BlocksLockSchema = z.object({
  internal: z
    .array(z.object({ blockId: z.string(), version: z.string(), hash: z.string() }))
    .default([]),
  workspace: z
    .array(z.object({ blockId: z.string(), version: z.string(), hash: z.string() }))
    .default([]),
});

export type ProjectFile = z.infer<typeof ProjectSchema>;
export type SiteFile = z.infer<typeof SiteSchema>;
export type ThemeFile = z.infer<typeof ThemeSchema>;
export type PageManifestFile = z.infer<typeof PageManifestSchema>;
export type ContentRecordFile = z.infer<typeof ContentRecordSchema>;
export type BlocksLockFile = z.infer<typeof BlocksLockSchema>;
