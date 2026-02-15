import { core } from "@tauri-apps/api";

import { remotePost, shouldUseRemoteHttpTransport } from "../remote/client";
import type { BuilderPage } from "./types";

export type BuilderProjectDoc = {
  site: {
    siteName: string;
    baseUrl: string;
  };
  sitemap: {
    pageOrder: string[];
    rootPageId: string;
  };
  pages: BuilderPage[];
  selectedPageId: string;
};

export async function loadBuilderProject(projectPath: string): Promise<BuilderProjectDoc> {
  if (shouldUseRemoteHttpTransport()) {
    return remotePost<BuilderProjectDoc>("/api/load-builder-project", { projectPath });
  }
  return core.invoke<BuilderProjectDoc>("load_builder_project", { projectPath });
}

export async function saveBuilderProject(input: {
  projectPath: string;
  document: BuilderProjectDoc;
}): Promise<void> {
  if (shouldUseRemoteHttpTransport()) {
    await remotePost<void>("/api/save-builder-project", input);
    return;
  }
  await core.invoke("save_builder_project", input);
}
