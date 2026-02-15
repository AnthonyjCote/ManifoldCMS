import { useMemo, useState } from "react";
import { useActiveProjectSession } from "../../features/project-launcher/session";
import { useProjectSettings } from "../../features/project-settings/useProjectSettings";

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function ProjectSettingsView() {
  const projectSession = useActiveProjectSession();
  const { settings, updateSettings, resetSettings, hasProject } = useProjectSettings(
    projectSession?.project.path
  );

  const [activeCategory, setActiveCategory] = useState<"breakpoints" | "preview">("breakpoints");
  const categories = useMemo(
    () => [
      { id: "breakpoints" as const, label: "Breakpoints", hint: "Responsive cutoffs" },
      { id: "preview" as const, label: "Builder Preview", hint: "Viewport width caps" },
    ],
    []
  );

  if (!hasProject) {
    return (
      <section className="view-shell project-settings-shell">
        <header className="project-settings-topbar">
          <div className="project-settings-topbar-title">
            <h1>Project Settings</h1>
            <p>Project-specific setup and variables.</p>
          </div>
          <div className="project-settings-topbar-actions">
            <button className="secondary-btn" disabled>
              Import
            </button>
            <button className="secondary-btn" disabled>
              Export
            </button>
          </div>
        </header>
        <div className="panel-card project-settings-empty">
          Open a project from Home to edit project settings.
        </div>
      </section>
    );
  }

  return (
    <section className="view-shell project-settings-shell">
      <header className="project-settings-topbar">
        <div className="project-settings-topbar-title">
          <h1>Project Settings</h1>
          <p>Configure project-specific breakpoints and Builder preview behavior.</p>
        </div>
        <div className="project-settings-topbar-actions">
          <button className="secondary-btn" disabled title="Stubbed: import project settings JSON">
            Import
          </button>
          <button className="secondary-btn" disabled title="Stubbed: export project settings JSON">
            Export
          </button>
          <button className="secondary-btn" onClick={resetSettings}>
            Reset Defaults
          </button>
        </div>
      </header>

      <div className="project-settings-layout">
        <aside className="project-settings-sidebar">
          <div className="project-settings-sidebar-header">
            <h2>Categories</h2>
          </div>
          <div className="project-settings-category-list">
            {categories.map((category) => {
              const selected = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`project-settings-category-item${selected ? " selected" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <strong>{category.label}</strong>
                  <span>{category.hint}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="project-settings-main">
          {activeCategory === "breakpoints" ? (
            <section className="panel-card project-settings-card">
              <h3>Breakpoints</h3>
              <p>Used for responsive behavior and scoped style overrides.</p>
              <div className="settings-grid">
                <label className="inspector-field">
                  <span>Mobile Max Width (px)</span>
                  <input
                    value={String(settings.breakpoints.mobileMax)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        breakpoints: {
                          ...prev.breakpoints,
                          mobileMax: next,
                        },
                      }));
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Tablet Max Width (px)</span>
                  <input
                    value={String(settings.breakpoints.tabletMax)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        breakpoints: {
                          ...prev.breakpoints,
                          tabletMax: next,
                        },
                      }));
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Desktop Max Width (px)</span>
                  <input
                    value={String(settings.breakpoints.desktopMax)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        breakpoints: {
                          ...prev.breakpoints,
                          desktopMax: next,
                        },
                      }));
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Retina / Wide / UHD Min Width (px)</span>
                  <input
                    value={String(settings.breakpoints.retinaMin)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        breakpoints: {
                          ...prev.breakpoints,
                          retinaMin: next,
                        },
                      }));
                    }}
                  />
                </label>
              </div>
              <small>Retina min is automatically kept higher than Desktop max.</small>
            </section>
          ) : null}

          {activeCategory === "preview" ? (
            <section className="panel-card project-settings-card">
              <h3>Builder Preview Width Caps</h3>
              <p>Controls viewport width in Builder device preview mode.</p>
              <div className="settings-grid">
                <label className="inspector-field">
                  <span>Mobile Preview Width (px)</span>
                  <input
                    value={String(settings.preview.mobileWidth)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        preview: {
                          ...prev.preview,
                          mobileWidth: next,
                        },
                      }));
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Tablet Preview Width (px)</span>
                  <input
                    value={String(settings.preview.tabletWidth)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        preview: {
                          ...prev.preview,
                          tabletWidth: next,
                        },
                      }));
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Desktop / Laptop / HD Preview Width (px)</span>
                  <input
                    value={String(settings.preview.desktopWidth)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        preview: {
                          ...prev.preview,
                          desktopWidth: next,
                        },
                      }));
                    }}
                  />
                </label>
                <label className="inspector-field">
                  <span>Retina / Wide / UHD Preview Width (px)</span>
                  <input
                    value={String(settings.preview.wideWidth)}
                    onChange={(event) => {
                      const next = parsePositiveInt(event.target.value);
                      if (next == null) {
                        return;
                      }
                      updateSettings((prev) => ({
                        ...prev,
                        preview: {
                          ...prev.preview,
                          wideWidth: next,
                        },
                      }));
                    }}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </section>
  );
}
