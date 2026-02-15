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
  const [selectedProjectPathRaw, setSelectedProjectPathRaw] = useState<string | null>(null);

  const projectRows = useMemo(() => {
    return launcher.projects.map((project) => ({
      ...project,
      siteUrlDraft: siteUrlDraftByPath[project.path] ?? project.siteUrl,
    }));
  }, [launcher.projects, siteUrlDraftByPath]);

  const selectedProjectPath = useMemo(() => {
    if (creating || projectRows.length === 0) {
      return null;
    }
    if (
      selectedProjectPathRaw &&
      projectRows.some((project) => project.path === selectedProjectPathRaw)
    ) {
      return selectedProjectPathRaw;
    }
    return projectRows[0]?.path ?? null;
  }, [creating, projectRows, selectedProjectPathRaw]);

  const selectedProject = useMemo(
    () => projectRows.find((project) => project.path === selectedProjectPath) ?? null,
    [projectRows, selectedProjectPath]
  );

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
    <section className="view-shell home-shell">
      <header className="home-topbar">
        <div className="home-topbar-title">
          <h1>Projects</h1>
          <p>Manage projects, workspace settings, and site URLs for Builder preview.</p>
        </div>
        <div className="home-topbar-actions">
          <button className="secondary-btn" onClick={() => void pickWorkspaceDirectory()}>
            Select Folder
          </button>
          <button className="secondary-btn" onClick={() => void launcher.rescan()}>
            Rescan
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              setCreateError(null);
              setCreating((prev) => {
                const next = !prev;
                if (next) {
                  setSelectedProjectPathRaw(null);
                }
                return next;
              });
            }}
          >
            {creating ? "Close New Project" : "New Project"}
          </button>
        </div>
      </header>

      <div className="home-workspace-strip">
        <label className="inspector-field">
          <span>Workspace Root</span>
          <input
            value={workspaceDraft}
            onChange={(event) => setWorkspaceDraft(event.target.value)}
            placeholder="/Users/you/Workspace"
          />
        </label>
        <button
          className="primary-btn"
          onClick={async () => {
            await launcher.setWorkspaceRoot(workspaceDraft);
            await launcher.rescan();
          }}
        >
          Save Workspace
        </button>
      </div>

      <div className="home-layout">
        <aside className="home-projects-sidebar">
          <div className="home-projects-sidebar-header">
            <h2>Workspace Projects</h2>
            <span>{projectRows.length}</span>
          </div>
          <div className="home-projects-list">
            {!launcher.workspaceConfigured ? (
              <div className="home-sidebar-empty">
                <p>Pick a workspace folder to load projects.</p>
                <button className="primary-btn" onClick={() => void pickWorkspaceDirectory()}>
                  Select Workspace Folder
                </button>
              </div>
            ) : null}
            {launcher.isLoading ? (
              <div className="home-sidebar-empty">Scanning projects...</div>
            ) : null}
            {launcher.workspaceConfigured && projectRows.length === 0 && !launcher.isLoading ? (
              <div className="home-sidebar-empty">No `.manifold` projects found.</div>
            ) : null}
            {projectRows.map((project) => {
              const selected = project.path === selectedProjectPath;
              return (
                <button
                  type="button"
                  key={project.id}
                  className={`home-project-item${selected ? " selected" : ""}`}
                  onClick={() => setSelectedProjectPathRaw(project.path)}
                >
                  <strong>{project.name}</strong>
                  <span>{project.path}</span>
                  <small>Updated {formatDate(project.updatedAt)}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="home-main-workspace">
          {launcher.errorMessage ? <p className="modal-error">{launcher.errorMessage}</p> : null}

          {creating ? (
            <section className="panel-card home-main-card">
              <h3>Create Project</h3>
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
            </section>
          ) : null}

          {!creating && selectedProject ? (
            <section className="panel-card home-main-card">
              <div className="home-main-card-header">
                <div>
                  <h3>{selectedProject.name}</h3>
                  <p>{selectedProject.path}</p>
                </div>
                <small>Updated {formatDate(selectedProject.updatedAt)}</small>
              </div>
              <label className="inspector-field">
                <span>Site URL</span>
                <input
                  value={selectedProject.siteUrlDraft}
                  onChange={(event) =>
                    setSiteUrlDraftByPath((prev) => ({
                      ...prev,
                      [selectedProject.path]: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="project-actions">
                <button
                  className="primary-btn"
                  onClick={() =>
                    onOpenProject({
                      id: selectedProject.id,
                      name: selectedProject.name,
                      path: selectedProject.path,
                      updatedAt: selectedProject.updatedAt,
                      siteUrl: selectedProject.siteUrlDraft,
                    })
                  }
                >
                  Open in Builder
                </button>
                <button
                  className="secondary-btn"
                  onClick={async () => {
                    await launcher.saveProjectSiteUrl(
                      selectedProject.path,
                      selectedProject.siteUrlDraft
                    );
                    setSiteUrlDraftByPath((prev) => {
                      const next = { ...prev };
                      delete next[selectedProject.path];
                      return next;
                    });
                  }}
                >
                  Save URL
                </button>
              </div>
            </section>
          ) : !creating ? (
            <section className="panel-card home-main-card">
              <h3>No Project Selected</h3>
              <p>Select a project from the left sidebar or create a new one to get started.</p>
            </section>
          ) : null}
        </main>
      </div>
    </section>
  );
}
