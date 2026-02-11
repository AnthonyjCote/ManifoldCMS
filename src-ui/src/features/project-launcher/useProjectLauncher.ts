import { useCallback, useEffect, useMemo, useState } from "react";

import { createProject, listProjects, updateProjectSiteUrl } from "./api";
import type { ProjectRecord } from "./types";

const WORKSPACE_ROOT_KEY = "manifold.workspace.root.v1";

function readWorkspaceRoot(): string {
  return window.localStorage.getItem(WORKSPACE_ROOT_KEY)?.trim() ?? "";
}

export function useProjectLauncher(): {
  workspaceRoot: string;
  workspaceConfigured: boolean;
  projects: ProjectRecord[];
  hasScanError: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  setWorkspaceRoot: (next: string) => Promise<void>;
  rescan: () => Promise<void>;
  createProject: (input: { name: string; slug: string; siteUrl: string }) => Promise<ProjectRecord>;
  saveProjectSiteUrl: (projectPath: string, siteUrl: string) => Promise<void>;
} {
  const [workspaceRoot, setWorkspaceRootState] = useState<string>(() => readWorkspaceRoot());
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [hasScanError, setHasScanError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const workspaceConfigured = useMemo(() => workspaceRoot.trim().length > 0, [workspaceRoot]);

  const scan = useCallback(async () => {
    if (!workspaceConfigured) {
      setProjects([]);
      return;
    }
    setIsLoading(true);
    setHasScanError(false);
    setErrorMessage(null);
    try {
      const rows = await listProjects(workspaceRoot);
      setProjects(rows);
    } catch (error) {
      setHasScanError(true);
      setProjects([]);
      setErrorMessage(error instanceof Error ? error.message : "Project scan failed.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceConfigured, workspaceRoot]);

  useEffect(() => {
    void scan();
  }, [scan]);

  return {
    workspaceRoot,
    workspaceConfigured,
    projects,
    hasScanError,
    isLoading,
    errorMessage,
    setWorkspaceRoot: async (next) => {
      const trimmed = next.trim();
      window.localStorage.setItem(WORKSPACE_ROOT_KEY, trimmed);
      setWorkspaceRootState(trimmed);
    },
    rescan: async () => {
      await scan();
    },
    createProject: async (input) => {
      if (!workspaceConfigured) {
        throw new Error("Workspace root is not configured.");
      }
      const created = await createProject({
        workspaceRoot,
        name: input.name,
        slug: input.slug,
        siteUrl: input.siteUrl,
      });
      setProjects((prev) => [created, ...prev]);
      return created;
    },
    saveProjectSiteUrl: async (projectPath, siteUrl) => {
      const updated = await updateProjectSiteUrl({ projectPath, siteUrl });
      setProjects((prev) => prev.map((item) => (item.path === projectPath ? updated : item)));
    },
  };
}
