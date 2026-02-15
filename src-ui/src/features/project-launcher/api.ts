import { core } from "@tauri-apps/api";

import { fetchRemoteContext, remotePost, shouldUseRemoteHttpTransport } from "../remote/client";
import type { ProjectRecord } from "./types";

type RawProjectRecord = {
  id: string;
  name: string;
  path: string;
  updatedAt: string;
  siteUrl: string;
};

function normalizeProject(raw: RawProjectRecord): ProjectRecord {
  return {
    id: raw.id,
    name: raw.name,
    path: raw.path,
    updatedAt: raw.updatedAt,
    siteUrl: raw.siteUrl,
  };
}

export async function listProjects(workspaceRoot: string): Promise<ProjectRecord[]> {
  if (shouldUseRemoteHttpTransport()) {
    let resolvedWorkspaceRoot = workspaceRoot.trim();
    if (!resolvedWorkspaceRoot) {
      const context = await fetchRemoteContext();
      resolvedWorkspaceRoot = context.workspaceRoot.trim();
    }
    const rows = await remotePost<RawProjectRecord[]>("/api/list-projects", {
      workspaceRoot: resolvedWorkspaceRoot,
    });
    return rows.map(normalizeProject);
  }
  const rows = await core.invoke<RawProjectRecord[]>("list_projects", {
    workspaceRoot,
  });
  return rows.map(normalizeProject);
}

export async function createProject(input: {
  workspaceRoot: string;
  name: string;
  slug: string;
  siteUrl: string;
}): Promise<ProjectRecord> {
  if (shouldUseRemoteHttpTransport()) {
    let resolvedWorkspaceRoot = input.workspaceRoot.trim();
    if (!resolvedWorkspaceRoot) {
      const context = await fetchRemoteContext();
      resolvedWorkspaceRoot = context.workspaceRoot.trim();
    }
    const row = await remotePost<RawProjectRecord>("/api/create-project", {
      ...input,
      workspaceRoot: resolvedWorkspaceRoot,
    });
    return normalizeProject(row);
  }
  const row = await core.invoke<RawProjectRecord>("create_project", input);
  return normalizeProject(row);
}

export async function updateProjectSiteUrl(input: {
  projectPath: string;
  siteUrl: string;
}): Promise<ProjectRecord> {
  if (shouldUseRemoteHttpTransport()) {
    const row = await remotePost<RawProjectRecord>("/api/update-project-site-url", input);
    return normalizeProject(row);
  }
  const row = await core.invoke<RawProjectRecord>("update_project_site_url", input);
  return normalizeProject(row);
}
