export type ProjectRecord = {
  id: string;
  name: string;
  path: string;
  updatedAt: string;
  siteUrl: string;
};

export type ProjectSession = {
  workspaceRoot: string;
  project: ProjectRecord;
};
