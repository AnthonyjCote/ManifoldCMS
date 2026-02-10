import { appendFile, cp, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { CURRENT_PROJECT_SCHEMA_VERSION, ProjectSchema } from "./schema";
import { openProject, saveProject } from "./project-store";
import { stableStringify } from "./stable-json";

type VersionParts = { major: number; minor: number; patch: number };

function parseSemver(version: string): VersionParts {
  const [major, minor, patch] = version.split(".").map((value) => Number.parseInt(value, 10));
  if ([major, minor, patch].some((value) => Number.isNaN(value))) {
    throw new Error(`Invalid semver value: ${version}`);
  }
  return { major, minor, patch };
}

function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

function backupFolderName(): string {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-pre-migration`;
}

export async function migrateProjectIfNeeded(projectDir: string): Promise<{
  migrated: boolean;
  fromVersion: string;
  toVersion: string;
}> {
  const projectFilePath = path.join(projectDir, "project.json");
  const rawProject = JSON.parse(await readFile(projectFilePath, "utf8"));
  const parsedProject = ProjectSchema.parse(rawProject);
  const currentVersion = parsedProject.schemaVersion;

  if (compareSemver(currentVersion, CURRENT_PROJECT_SCHEMA_VERSION) > 0) {
    throw new Error(
      `Project schema ${currentVersion} is newer than supported ${CURRENT_PROJECT_SCHEMA_VERSION}`
    );
  }

  if (currentVersion === CURRENT_PROJECT_SCHEMA_VERSION) {
    return {
      migrated: false,
      fromVersion: currentVersion,
      toVersion: currentVersion,
    };
  }

  const backupsRoot = path.join(projectDir, "backups");
  const backupPath = path.join(backupsRoot, backupFolderName());
  await mkdir(backupsRoot, { recursive: true });
  await mkdir(backupPath, { recursive: true });

  const topLevelEntries = await readdir(projectDir, { withFileTypes: true });
  for (const entry of topLevelEntries) {
    if (entry.name === "backups") {
      continue;
    }
    await cp(path.join(projectDir, entry.name), path.join(backupPath, entry.name), {
      recursive: true,
    });
  }

  const snapshot = await openProject(projectDir);
  snapshot.project.schemaVersion = CURRENT_PROJECT_SCHEMA_VERSION;
  await saveProject(projectDir, snapshot);

  const migrationLogPath = path.join(projectDir, "exports", "migrations.log");
  await mkdir(path.dirname(migrationLogPath), { recursive: true });
  await appendFile(
    migrationLogPath,
    stableStringify({
      migratedAt: new Date().toISOString(),
      fromVersion: currentVersion,
      toVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      backupPath,
    }),
    "utf8"
  );

  return {
    migrated: true,
    fromVersion: currentVersion,
    toVersion: CURRENT_PROJECT_SCHEMA_VERSION,
  };
}
