import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { watch } from "chokidar";
import { z } from "zod";

const DependencyMapSchema = z.record(z.string(), z.string());

export const BlockManifestSchema = z.object({
  blockId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  propsSchema: z.record(z.string(), z.unknown()),
  editorSchema: z.record(z.string(), z.unknown()),
  runtime: z.object({
    entry: z.string().min(1),
  }),
  export: z.object({
    astroTemplate: z.string().min(1),
  }),
  dependencies: DependencyMapSchema.default({}),
  version: z.string().min(1),
});

export type BlockManifest = z.infer<typeof BlockManifestSchema>;

export type BlockLoadError = {
  blockPath: string;
  message: string;
};

export type BlockCatalogState = {
  manifests: BlockManifest[];
  errors: BlockLoadError[];
};

export type WorkspaceBlockEventType = "added" | "updated" | "deleted" | "ready";

export type WorkspaceBlockEvent = {
  type: WorkspaceBlockEventType;
  state: BlockCatalogState;
};

export async function parseBlockManifest(manifestPath: string): Promise<BlockManifest> {
  const raw = JSON.parse(await readFile(manifestPath, "utf8"));
  return BlockManifestSchema.parse(raw);
}

export function createInternalBlockRegistry(manifests: BlockManifest[]): BlockCatalogState {
  return {
    manifests: [...manifests].sort((a, b) => a.blockId.localeCompare(b.blockId)),
    errors: [],
  };
}

export async function loadWorkspaceBlocks(projectDir: string): Promise<BlockCatalogState> {
  const blocksRoot = path.join(projectDir, "blocks");

  let entries: string[] = [];
  try {
    entries = await readdir(blocksRoot);
  } catch {
    return { manifests: [], errors: [] };
  }

  const manifests: BlockManifest[] = [];
  const errors: BlockLoadError[] = [];

  for (const blockFolderName of entries.sort((a, b) => a.localeCompare(b))) {
    const manifestPath = path.join(blocksRoot, blockFolderName, "block.manifest.json");
    try {
      manifests.push(await parseBlockManifest(manifestPath));
    } catch (error) {
      errors.push({
        blockPath: manifestPath,
        message: error instanceof Error ? error.message : "Unknown block manifest parse error",
      });
    }
  }

  return {
    manifests,
    errors,
  };
}

export function mergeBlockCatalog(
  internalRegistry: BlockCatalogState,
  workspaceRegistry: BlockCatalogState
): BlockCatalogState {
  const merged = new Map<string, BlockManifest>();

  for (const block of internalRegistry.manifests) {
    merged.set(block.blockId, block);
  }

  for (const block of workspaceRegistry.manifests) {
    merged.set(block.blockId, block);
  }

  return {
    manifests: [...merged.values()].sort((a, b) => a.blockId.localeCompare(b.blockId)),
    errors: [...internalRegistry.errors, ...workspaceRegistry.errors],
  };
}

export function getMissingBlocksForExistingInstances(
  blockIdsInUse: string[],
  availableCatalog: BlockCatalogState
): string[] {
  const available = new Set(availableCatalog.manifests.map((manifest) => manifest.blockId));
  return [...new Set(blockIdsInUse.filter((blockId) => !available.has(blockId)))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function parseDependencyAllowlist(projectFile: unknown): Set<string> {
  if (!projectFile || typeof projectFile !== "object") {
    return new Set();
  }

  const allowed = (projectFile as Record<string, unknown>).allowedBlockDependencies;
  if (!Array.isArray(allowed)) {
    return new Set();
  }

  const normalized = allowed
    .filter((item) => typeof item === "string" && item.length > 0)
    .map((item) => item.trim());

  return new Set(normalized);
}

export function validateBlockDependencies(input: {
  manifests: BlockManifest[];
  allowlist: Set<string>;
}): { errors: string[] } {
  const errors: string[] = [];
  const dependencyVersions = new Map<string, string>();

  for (const manifest of input.manifests) {
    for (const [depName, depVersion] of Object.entries(manifest.dependencies)) {
      const versionLooksExact = !depVersion.includes("^") && !depVersion.includes("~");
      if (!versionLooksExact) {
        errors.push(`${manifest.blockId}: dependency ${depName} must use exact version pin`);
      }

      if (input.allowlist.size > 0 && !input.allowlist.has(depName)) {
        errors.push(`${manifest.blockId}: dependency ${depName} is not in allowlist`);
      }

      const existingVersion = dependencyVersions.get(depName);
      if (existingVersion && existingVersion !== depVersion) {
        errors.push(
          `${manifest.blockId}: dependency ${depName} conflicts (${existingVersion} vs ${depVersion})`
        );
      } else {
        dependencyVersions.set(depName, depVersion);
      }
    }
  }

  return { errors };
}

export async function createWorkspaceBlockWatcher(input: {
  projectDir: string;
  onEvent: (event: WorkspaceBlockEvent) => void;
}): Promise<{
  close: () => Promise<void>;
}> {
  const target = path.join(input.projectDir, "blocks");
  const watcher = watch(target, {
    ignoreInitial: false,
  });

  let isReady = false;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  async function emitState(type: WorkspaceBlockEventType): Promise<void> {
    const state = await loadWorkspaceBlocks(input.projectDir);
    input.onEvent({ type, state });
  }

  function scheduleEmit(type: WorkspaceBlockEventType): void {
    if (!isReady) {
      return;
    }

    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
    }

    // Coalesce bursty filesystem events from atomic writes.
    pendingTimeout = setTimeout(() => {
      pendingTimeout = null;
      void emitState(type);
    }, 75);
  }

  watcher.on("add", (filePath) => {
    if (path.basename(filePath) === "block.manifest.json") {
      scheduleEmit("added");
    }
  });
  watcher.on("change", (filePath) => {
    if (path.basename(filePath) === "block.manifest.json") {
      scheduleEmit("updated");
    }
  });
  watcher.on("unlink", (filePath) => {
    if (path.basename(filePath) === "block.manifest.json") {
      scheduleEmit("deleted");
    }
  });

  await new Promise<void>((resolve) => {
    watcher.on("ready", async () => {
      isReady = true;
      await emitState("ready");
      resolve();
    });
  });

  return {
    close: async (): Promise<void> => {
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
      }
      await watcher.close();
    },
  };
}
