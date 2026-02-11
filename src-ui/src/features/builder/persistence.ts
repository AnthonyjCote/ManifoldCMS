import { core } from "@tauri-apps/api";

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
  return core.invoke<BuilderProjectDoc>("load_builder_project", { projectPath });
}

export async function saveBuilderProject(input: {
  projectPath: string;
  document: BuilderProjectDoc;
}): Promise<void> {
  await core.invoke("save_builder_project", input);
}
