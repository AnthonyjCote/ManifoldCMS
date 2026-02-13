import { useActiveProjectSession } from "../../../features/project-launcher/session";
import { ThemeTokenEditor } from "../../../features/theme/components/ThemeTokenEditor";
import { useProjectTheme } from "../../../features/theme/useProjectTheme";

export function ThemeTab() {
  const projectSession = useActiveProjectSession();
  const { hasProject, activeTheme, updateActiveThemeTokens, restoreLastSnapshot } = useProjectTheme(
    projectSession?.project.path
  );

  if (!hasProject || !activeTheme) {
    return (
      <div className="drawer-panel builder-empty-notice">
        <span className="builder-empty-pill">
          <span className="dot" />
          Theme
        </span>
        <p>Open a project to edit theme tokens.</p>
      </div>
    );
  }

  return (
    <div className="drawer-stack">
      <section className="inspector-card-item style-target-card theme-tab-active-card">
        <h4>Active Theme</h4>
        <label className="inspector-field compact">
          <span>Name</span>
          <input value={activeTheme.name} disabled className="compact-input" />
        </label>
        <small>Source: {activeTheme.source === "bundled" ? "Bundled" : "User"}</small>
        <div className="drawer-inline-controls">
          <button className="secondary-btn" onClick={restoreLastSnapshot}>
            Restore Last Backup
          </button>
        </div>
      </section>

      <ThemeTokenEditor
        tokens={activeTheme.tokens}
        storageKeyPrefix={`builder:${projectSession?.project.path ?? "none"}`}
        onChange={(key, value) => {
          updateActiveThemeTokens((prev) => ({
            ...prev,
            [key]: value,
          }));
        }}
      />
    </div>
  );
}
