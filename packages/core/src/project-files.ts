import crypto from "node:crypto";

import {
  BlocksLockSchema,
  CURRENT_PROJECT_SCHEMA_VERSION,
  type BlocksLockFile,
  type ContentRecordFile,
  type PageManifestFile,
  type ProjectFile,
  ProjectSchema,
  type SiteFile,
  SiteSchema,
  type ThemeFile,
  ThemeSchema,
} from "./schema";
import type { ProjectFileMap } from "./types";

export type NewProjectInput = {
  projectName: string;
  clientName?: string;
  siteTitle?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeDefaultProject(input: NewProjectInput): ProjectFile {
  const timestamp = nowIso();

  return ProjectSchema.parse({
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    projectId: crypto.randomUUID(),
    projectName: input.projectName,
    clientName: input.clientName ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
    seed: crypto.randomBytes(12).toString("hex"),
  });
}

function makeDefaultSite(input: NewProjectInput): SiteFile {
  return SiteSchema.parse({
    title: input.siteTitle ?? input.projectName,
    description: "",
    baseUrl: "",
    navigation: [],
    footer: { text: "" },
    seoDefaults: {
      titleTemplate: "%s",
      description: "",
    },
  });
}

function makeDefaultTheme(): ThemeFile {
  return ThemeSchema.parse({
    tokens: {
      colorPrimary: "#1d4ed8",
      colorText: "#111827",
      colorBackground: "#ffffff",
      spacingBase: 8,
      radiusBase: 8,
      fontBody: "Inter, system-ui, sans-serif",
      fontHeading: "Inter, system-ui, sans-serif",
    },
  });
}

function makeDefaultHomePage(): PageManifestFile {
  return {
    pageId: "page-home",
    route: "/",
    title: "Home",
    seo: {
      title: "Home",
      description: "",
    },
    blocks: [],
  };
}

function makeDefaultContentRecords(): ContentRecordFile[] {
  return [];
}

function makeDefaultBlocksLock(): BlocksLockFile {
  return BlocksLockSchema.parse({
    internal: [],
    workspace: [],
  });
}

export function createProjectFileMap(input: NewProjectInput): ProjectFileMap {
  const files: ProjectFileMap = new Map();

  files.set("project.json", makeDefaultProject(input));
  files.set("site.json", makeDefaultSite(input));
  files.set("theme.json", makeDefaultTheme());
  files.set("blocks.lock.json", makeDefaultBlocksLock());
  files.set("pages/home.json", makeDefaultHomePage());

  for (const record of makeDefaultContentRecords()) {
    files.set(`content/${record.id}.json`, record);
  }

  return files;
}
