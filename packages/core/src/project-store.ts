import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  BlocksLockSchema,
  ContentRecordSchema,
  type ContentRecordFile,
  PageManifestSchema,
  type PageManifestFile,
  ProjectSchema,
  type ProjectFile,
  SiteSchema,
  type SiteFile,
  ThemeSchema,
  type ThemeFile,
} from "./schema";
import { createProjectFileMap, type NewProjectInput } from "./project-files";
import { stableStringify } from "./stable-json";

export type ProjectSnapshot = {
  project: ProjectFile;
  site: SiteFile;
  theme: ThemeFile;
  blocksLock: unknown;
  pages: PageManifestFile[];
  content: ContentRecordFile[];
};

const REQUIRED_DIRS = ["pages", "content", "assets", "blocks", "exports", "backups"] as const;

async function ensureProjectDirs(projectDir: string): Promise<void> {
  for (const dir of REQUIRED_DIRS) {
    await mkdir(path.join(projectDir, dir), { recursive: true });
  }
}

function readJson<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return readJson<T>(raw);
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, stableStringify(value as never), "utf8");
}

async function readDirJsonFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function createProject(projectDir: string, input: NewProjectInput): Promise<void> {
  await mkdir(projectDir, { recursive: true });
  await ensureProjectDirs(projectDir);

  const files = createProjectFileMap(input);
  for (const [relativeFilePath, value] of files.entries()) {
    await writeJsonFile(path.join(projectDir, relativeFilePath), value);
  }
}

export async function openProject(projectDir: string): Promise<ProjectSnapshot> {
  const project = ProjectSchema.parse(await readJsonFile(path.join(projectDir, "project.json")));
  const site = SiteSchema.parse(await readJsonFile(path.join(projectDir, "site.json")));
  const theme = ThemeSchema.parse(await readJsonFile(path.join(projectDir, "theme.json")));
  const blocksLock = BlocksLockSchema.parse(
    await readJsonFile(path.join(projectDir, "blocks.lock.json"))
  );

  const pagesDir = path.join(projectDir, "pages");
  const pageFiles = await readDirJsonFiles(pagesDir);
  const pages = await Promise.all(
    pageFiles.map(async (fileName) =>
      PageManifestSchema.parse(await readJsonFile(path.join(pagesDir, fileName)))
    )
  );

  const contentDir = path.join(projectDir, "content");
  const contentFiles = await readDirJsonFiles(contentDir);
  const content = await Promise.all(
    contentFiles.map(async (fileName) =>
      ContentRecordSchema.parse(await readJsonFile(path.join(contentDir, fileName)))
    )
  );

  return {
    project,
    site,
    theme,
    blocksLock,
    pages,
    content,
  };
}

export async function saveProject(projectDir: string, snapshot: ProjectSnapshot): Promise<void> {
  await ensureProjectDirs(projectDir);

  const updatedProject: ProjectFile = {
    ...snapshot.project,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(path.join(projectDir, "project.json"), ProjectSchema.parse(updatedProject));
  await writeJsonFile(path.join(projectDir, "site.json"), SiteSchema.parse(snapshot.site));
  await writeJsonFile(path.join(projectDir, "theme.json"), ThemeSchema.parse(snapshot.theme));
  await writeJsonFile(
    path.join(projectDir, "blocks.lock.json"),
    BlocksLockSchema.parse(snapshot.blocksLock)
  );

  for (const page of snapshot.pages) {
    const safePageName = page.pageId.replace(/[^a-zA-Z0-9_-]/g, "-");
    await writeJsonFile(
      path.join(projectDir, "pages", `${safePageName}.json`),
      PageManifestSchema.parse(page)
    );
  }

  for (const record of snapshot.content) {
    const safeRecordName = record.id.replace(/[^a-zA-Z0-9_-]/g, "-");
    await writeJsonFile(
      path.join(projectDir, "content", `${safeRecordName}.json`),
      ContentRecordSchema.parse(record)
    );
  }
}

export function createDebouncedSaver<T>(
  saveFn: (payload: T) => Promise<void>,
  delayMs = 500
): {
  schedule: (payload: T) => void;
  flush: () => Promise<void>;
  cancel: () => void;
} {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let latestPayload: T | null = null;

  async function runSave(): Promise<void> {
    if (latestPayload === null) {
      return;
    }
    const payload = latestPayload;
    latestPayload = null;
    await saveFn(payload);
  }

  return {
    schedule(payload: T): void {
      latestPayload = payload;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        void runSave();
      }, delayMs);
    },
    async flush(): Promise<void> {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      await runSave();
    },
    cancel(): void {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      latestPayload = null;
    },
  };
}
