import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createProjectFileMap } from "../src/project-files";
import { migrateProjectIfNeeded } from "../src/migrations";
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  ProjectSchema,
  SiteSchema,
  ThemeSchema,
} from "../src/schema";

describe("schema and migration", () => {
  it("creates default files that satisfy core schemas", () => {
    const files = createProjectFileMap({
      projectName: "Manifold",
      clientName: "ACME",
    });

    expect(ProjectSchema.parse(files.get("project.json"))).toBeTruthy();
    expect(SiteSchema.parse(files.get("site.json"))).toBeTruthy();
    expect(ThemeSchema.parse(files.get("theme.json"))).toBeTruthy();
  });

  it("migrates old schema projects with backup and migration log", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "manifold-migrate-"));
    const fixtureDir = path.resolve("test/fixtures/project-v0");
    await cp(fixtureDir, tempDir, { recursive: true });

    const result = await migrateProjectIfNeeded(tempDir);

    expect(result.migrated).toBe(true);
    expect(result.fromVersion).toBe("0.9.0");
    expect(result.toVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);

    const migratedProject = JSON.parse(await readFile(path.join(tempDir, "project.json"), "utf8"));
    expect(migratedProject.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);

    const backupsDirEntries = await stat(path.join(tempDir, "backups"));
    expect(backupsDirEntries.isDirectory()).toBe(true);

    const migrationLog = await readFile(path.join(tempDir, "exports", "migrations.log"), "utf8");
    expect(migrationLog).toContain('"fromVersion": "0.9.0"');
    expect(migrationLog).toContain(`"toVersion": "${CURRENT_PROJECT_SCHEMA_VERSION}"`);

    await rm(tempDir, { recursive: true, force: true });
  });
});
