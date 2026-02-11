import { useMemo, useState } from "react";
import { core } from "@tauri-apps/api";

import { setActiveProjectSession } from "../../features/project-launcher/session";
import { useProjectLauncher } from "../../features/project-launcher/useProjectLauncher";
import { useViewModeStore } from "../../state/useViewModeStore";
import type { ProjectRecord } from "../../features/project-launcher/types";

function formatDate(input: string): string {
  return new Date(input).toLocaleString();
}

export function HomeView() {
  const launcher = useProjectLauncher();
  const { setViewMode } = useViewModeStore();
  const [workspaceDraft, setWorkspaceDraft] = useState(launcher.workspaceRoot);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("https://example.com");
  const [createError, setCreateError] = useState<string | null>(null);
  const [siteUrlDraftByPath, setSiteUrlDraftByPath] = useState<Record<string, string>>({});

  const projectRows = useMemo(() => {
    return launcher.projects.map((project) => ({
      ...project,
      siteUrlDraft: siteUrlDraftByPath[project.path] ?? project.siteUrl,
    }));
  }, [launcher.projects, siteUrlDraftByPath]);

  const onOpenProject = (project: ProjectRecord) => {
    setActiveProjectSession({
      workspaceRoot: launcher.workspaceRoot,
      project,
    });
    setViewMode("builder");
  };

  const pickWorkspaceDirectory = async () => {
    const selected = await core.invoke<string | null>("pick_workspace_directory");
    if (typeof selected !== "string") {
      return;
    }
    setWorkspaceDraft(selected);
    await launcher.setWorkspaceRoot(selected);
    await launcher.rescan();
  };

  return (
    <section className="view-shell">
      <header className="view-header">
        <h1>Projects</h1>
        <p>Manage workspace projects and set the site URL used in Builder preview.</p>
      </header>

      {!launcher.workspaceConfigured ? (
        <div className="panel-card">
          <p>Choose a workspace folder to scaffold and discover your Manifold projects.</p>
          <div className="card-row">
            <button className="primary-btn" onClick={() => void pickWorkspaceDirectory()}>
              Select Workspace Folder
            </button>
          </div>
        </div>
      ) : null}

      <div className="panel-card">
        <label className="inspector-field">
          <span>Workspace Root</span>
          <input
            value={workspaceDraft}
            onChange={(event) => setWorkspaceDraft(event.target.value)}
            placeholder="/Users/you/Workspace"
          />
        </label>
        <div className="card-row">
          <button
            className="primary-btn"
            onClick={async () => {
              await launcher.setWorkspaceRoot(workspaceDraft);
              await launcher.rescan();
            }}
          >
            Save Workspace
          </button>
          <button className="secondary-btn" onClick={() => void launcher.rescan()}>
            Rescan Workspace
          </button>
        </div>
        {launcher.errorMessage ? <p className="modal-error">{launcher.errorMessage}</p> : null}
      </div>

      <div className="panel-card">
        <div className="card-row">
          <button
            className="primary-btn"
            onClick={() => {
              setCreateError(null);
              setCreating((prev) => !prev);
            }}
          >
            {creating ? "Close New Project" : "New Project"}
          </button>
        </div>
        {creating ? (
          <div className="settings-grid">
            <label className="inspector-field">
              <span>Project Name</span>
              <input
                value={newName}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setNewName(nextName);
                  if (!newSlug.trim()) {
                    setNewSlug(nextName.toLowerCase().replace(/\s+/g, "-"));
                  }
                }}
              />
            </label>
            <label className="inspector-field">
              <span>Project Slug</span>
              <input value={newSlug} onChange={(event) => setNewSlug(event.target.value)} />
            </label>
            <label className="inspector-field">
              <span>Site URL</span>
              <input
                value={newSiteUrl}
                onChange={(event) => setNewSiteUrl(event.target.value)}
                placeholder="https://xyz.com"
              />
            </label>
            {createError ? <p className="modal-error">{createError}</p> : null}
            <div className="card-row">
              <button
                className="primary-btn"
                onClick={async () => {
                  try {
                    const project = await launcher.createProject({
                      name: newName,
                      slug: newSlug,
                      siteUrl: newSiteUrl,
                    });
                    setCreating(false);
                    setNewName("");
                    setNewSlug("");
                    setCreateError(null);
                    onOpenProject(project);
                  } catch (error) {
                    setCreateError(
                      error instanceof Error ? error.message : "Failed to create project."
                    );
                  }
                }}
              >
                Create and Open
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {launcher.isLoading ? <div className="panel-card">Scanning projects...</div> : null}

      {launcher.workspaceConfigured && projectRows.length === 0 && !launcher.isLoading ? (
        <div className="panel-card">No `.manifold` projects found in this workspace.</div>
      ) : null}

      <div className="project-grid">
        {projectRows.map((project) => (
          <article key={project.id} className="project-card">
            <h2>{project.name}</h2>
            <p>{project.path}</p>
            <p>Updated {formatDate(project.updatedAt)}</p>
            <label className="inspector-field">
              <span>Site URL</span>
              <input
                value={project.siteUrlDraft}
                onChange={(event) =>
                  setSiteUrlDraftByPath((prev) => ({
                    ...prev,
                    [project.path]: event.target.value,
                  }))
                }
              />
            </label>
            <div className="project-actions">
              <button
                className="primary-btn"
                onClick={() =>
                  onOpenProject({
                    id: project.id,
                    name: project.name,
                    path: project.path,
                    updatedAt: project.updatedAt,
                    siteUrl: project.siteUrlDraft,
                  })
                }
              >
                Open
              </button>
              <button
                className="secondary-btn"
                onClick={async () => {
                  await launcher.saveProjectSiteUrl(project.path, project.siteUrlDraft);
                  setSiteUrlDraftByPath((prev) => {
                    const next = { ...prev };
                    delete next[project.path];
                    return next;
                  });
                }}
              >
                Save URL
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
