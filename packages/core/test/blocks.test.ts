import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createInternalBlockRegistry,
  createWorkspaceBlockWatcher,
  getMissingBlocksForExistingInstances,
  loadWorkspaceBlocks,
  mergeBlockCatalog,
  parseDependencyAllowlist,
  validateBlockDependencies,
} from "../src/blocks";

type EventType = "added" | "updated" | "deleted" | "ready";

async function writeManifest(
  projectDir: string,
  blockId: string,
  overrides: Record<string, unknown> = {}
) {
  const blockDir = path.join(projectDir, "blocks", blockId);
  await mkdir(blockDir, { recursive: true });
  const manifest = {
    blockId,
    name: blockId,
    category: "content",
    tags: [],
    propsSchema: {},
    editorSchema: {},
    runtime: { entry: "runtime.ts" },
    export: { astroTemplate: "template.astro" },
    dependencies: {},
    version: "1.0.0",
    ...overrides,
  };
  await writeFile(path.join(blockDir, "block.manifest.json"), JSON.stringify(manifest, null, 2));
}

async function waitForEvent(
  events: { type: EventType }[],
  eventType: EventType,
  timeoutMs = 4000
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (events.some((event) => event.type === eventType)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for event type: ${eventType}`);
}

describe("blocks", () => {
  it("loads workspace blocks and merges with internal registry", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "manifold-blocks-"));
    await mkdir(path.join(tempDir, "blocks"), { recursive: true });

    await writeManifest(tempDir, "hero.split.v1");

    const internal = createInternalBlockRegistry([
      {
        blockId: "cta.banner.v1",
        name: "CTA Banner",
        category: "content",
        tags: [],
        propsSchema: {},
        editorSchema: {},
        runtime: { entry: "runtime.ts" },
        export: { astroTemplate: "template.astro" },
        dependencies: {},
        version: "1.0.0",
      },
    ]);

    const workspace = await loadWorkspaceBlocks(tempDir);
    const merged = mergeBlockCatalog(internal, workspace);

    expect(merged.manifests.map((manifest) => manifest.blockId)).toEqual([
      "cta.banner.v1",
      "hero.split.v1",
    ]);

    await rm(tempDir, { recursive: true, force: true });
  });

  it("flags missing blocks for existing instances", () => {
    const catalog = createInternalBlockRegistry([
      {
        blockId: "hero.split.v1",
        name: "Hero",
        category: "hero",
        tags: [],
        propsSchema: {},
        editorSchema: {},
        runtime: { entry: "runtime.ts" },
        export: { astroTemplate: "template.astro" },
        dependencies: {},
        version: "1.0.0",
      },
    ]);

    const missing = getMissingBlocksForExistingInstances(
      ["hero.split.v1", "cta.banner.v1", "cta.banner.v1"],
      catalog
    );

    expect(missing).toEqual(["cta.banner.v1"]);
  });

  it("validates dependency allowlist and conflict policy", () => {
    const allowlist = parseDependencyAllowlist({
      allowedBlockDependencies: ["clsx", "lucide-react"],
    });

    const result = validateBlockDependencies({
      allowlist,
      manifests: [
        {
          blockId: "hero.a.v1",
          name: "Hero A",
          category: "hero",
          tags: [],
          propsSchema: {},
          editorSchema: {},
          runtime: { entry: "runtime.ts" },
          export: { astroTemplate: "template.astro" },
          dependencies: { clsx: "2.1.0" },
          version: "1.0.0",
        },
        {
          blockId: "hero.b.v1",
          name: "Hero B",
          category: "hero",
          tags: [],
          propsSchema: {},
          editorSchema: {},
          runtime: { entry: "runtime.ts" },
          export: { astroTemplate: "template.astro" },
          dependencies: { clsx: "^2.1.0", lodash: "4.17.21" },
          version: "1.0.0",
        },
      ],
    });

    expect(result.errors).toEqual([
      "hero.b.v1: dependency clsx must use exact version pin",
      "hero.b.v1: dependency clsx conflicts (2.1.0 vs ^2.1.0)",
      "hero.b.v1: dependency lodash is not in allowlist",
    ]);
  });

  it("emits add/update/delete events for workspace block manifests", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "manifold-watcher-"));
    await mkdir(path.join(tempDir, "blocks"), { recursive: true });

    const events: { type: EventType }[] = [];
    const watcher = await createWorkspaceBlockWatcher({
      projectDir: tempDir,
      onEvent: (event) => {
        events.push({ type: event.type });
      },
    });

    await waitForEvent(events, "ready");

    await writeManifest(tempDir, "hero.split.v1");
    await waitForEvent(events, "added");

    await writeManifest(tempDir, "hero.split.v1", { name: "Hero Updated" });
    await waitForEvent(events, "updated");

    await rm(path.join(tempDir, "blocks", "hero.split.v1", "block.manifest.json"), { force: true });
    await waitForEvent(events, "deleted");

    await watcher.close();
    await rm(tempDir, { recursive: true, force: true });
  });
});
