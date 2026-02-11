import { core } from "@tauri-apps/api";

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
  const row = await core.invoke<RawProjectRecord>("create_project", input);
  return normalizeProject(row);
}

export async function updateProjectSiteUrl(input: {
  projectPath: string;
  siteUrl: string;
}): Promise<ProjectRecord> {
  const row = await core.invoke<RawProjectRecord>("update_project_site_url", input);
  return normalizeProject(row);
}
