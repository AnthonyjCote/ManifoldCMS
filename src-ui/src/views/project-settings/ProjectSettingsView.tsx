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

  if (!hasProject) {
    return (
      <section className="view-shell">
        <header className="view-header">
          <h1>Project Settings</h1>
          <p>Project-specific setup and variables.</p>
        </header>
        <div className="panel-card">Open a project from Home to edit project settings.</div>
      </section>
    );
  }

  return (
    <section className="view-shell">
      <header className="view-header">
        <h1>Project Settings</h1>
        <p>Configure project-specific breakpoint values and preview viewport widths.</p>
      </header>

      <div className="settings-grid">
        <section className="panel-card">
          <h2>Breakpoints</h2>
          <p>Used for responsive behavior (mobile/tablet cutoffs).</p>
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
        </section>

        <section className="panel-card">
          <h2>Builder Preview Width Caps</h2>
          <p>Controls viewport width in Builder device preview mode.</p>
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
            <span>Desktop Preview Width (px)</span>
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
            <span>Wide / Retina Preview Width (px)</span>
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
          <div className="card-row">
            <button className="secondary-btn" onClick={resetSettings}>
              Reset Defaults
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
