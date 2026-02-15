import { useMemo, useState } from "react";

import { useActiveProjectSession } from "../../features/project-launcher/session";
import { themeToCssVars } from "../../features/theme/types";
import { useProjectTheme, type ThemeApplyMode } from "../../features/theme/useProjectTheme";
import { useViewModeStore } from "../../state/useViewModeStore";

function ThemePreviewCard({
  name,
  description,
  active,
  style,
  onApply,
  onDuplicate,
}: {
  name: string;
  description: string;
  active: boolean;
  style: React.CSSProperties;
  onApply: () => void;
  onDuplicate: () => void;
}) {
  return (
    <article className={`theme-library-card${active ? " active" : ""}`}>
      <div className="theme-library-preview" style={style}>
        <section className="theme-library-hero">
          <p className="theme-library-eyebrow">Theme Preview</p>
          <h3>Build polished pages faster</h3>
          <p className="theme-library-body">Pick a theme, drag blocks, edit content, and ship.</p>
          <div className="theme-library-cta-row">
            <a href="#" className="theme-library-cta" onClick={(event) => event.preventDefault()}>
              Primary
            </a>
            <a
              href="#"
              className="theme-library-cta alt"
              onClick={(event) => event.preventDefault()}
            >
              Secondary
            </a>
          </div>
        </section>
        <section className="theme-library-preview-meta">
          <span className="theme-library-meta-chip">Headline</span>
          <span className="theme-library-meta-chip">Body</span>
          <span className="theme-library-meta-chip">Card</span>
          <span className="theme-library-palette-row" aria-label="Theme palette preview">
            <span className="theme-library-palette-dot base" title="Base" />
            <span className="theme-library-palette-dot accent" title="Accent" />
            <span className="theme-library-palette-dot alt" title="Alt" />
            <span className="theme-library-palette-dot canvas" title="Canvas" />
            <span className="theme-library-palette-dot surface" title="Surface" />
            <span className="theme-library-palette-dot card" title="Card" />
          </span>
        </section>
      </div>
      <header>
        <h3>{name}</h3>
        <p>{description}</p>
      </header>
      <div className="card-row">
        <button className="secondary-btn" onClick={onApply}>
          {active ? "Applied" : "Apply"}
        </button>
        <button className="ghost-btn" onClick={onDuplicate}>
          Duplicate
        </button>
      </div>
    </article>
  );
}

export function ThemeView() {
  const projectSession = useActiveProjectSession();
  const { setViewMode } = useViewModeStore();
  const { hasProject, state, activeTheme, applyTheme, duplicateTheme, restoreLastSnapshot } =
    useProjectTheme(projectSession?.project.path);
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);
  const [replaceConfirm, setReplaceConfirm] = useState(false);

  const pendingTheme = useMemo(
    () => state.themes.find((theme) => theme.id === pendingThemeId) ?? null,
    [pendingThemeId, state.themes]
  );

  if (!hasProject) {
    return (
      <section className="view-shell">
        <header className="view-header">
          <h1>Theme Library</h1>
          <p>Pick and manage project themes.</p>
        </header>
        <div className="panel-card">Open a project from Home to browse and apply themes.</div>
      </section>
    );
  }

  const handleApply = (mode: ThemeApplyMode) => {
    if (!pendingThemeId) {
      return;
    }
    applyTheme(pendingThemeId, mode);
    setPendingThemeId(null);
    setReplaceConfirm(false);
    setViewMode("builder");
  };

  return (
    <section className="view-shell">
      <header className="view-header">
        <h1>Theme Library</h1>
        <p>Choose a starter theme. Applying always snapshots your current theme first.</p>
      </header>

      <div className="card-row">
        <button className="secondary-btn" onClick={restoreLastSnapshot}>
          Restore Last Backup
        </button>
      </div>

      <div className="theme-library-grid">
        {state.themes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            name={theme.name}
            description={theme.description}
            active={activeTheme?.id === theme.id}
            style={themeToCssVars(theme.tokens)}
            onApply={() => {
              if (activeTheme?.id === theme.id) {
                return;
              }
              setPendingThemeId(theme.id);
              setReplaceConfirm(false);
            }}
            onDuplicate={() => duplicateTheme(theme.id)}
          />
        ))}
      </div>

      {pendingTheme ? (
        <div className="modal-backdrop" onClick={() => setPendingThemeId(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>Apply Theme: {pendingTheme.name}</h2>
            <p>Your current theme is backed up automatically before applying a new one.</p>

            <div className="card-row">
              <button className="secondary-btn" onClick={() => handleApply("merge")}>
                Merge (Recommended)
              </button>
              <button className="danger-btn" onClick={() => setReplaceConfirm(true)}>
                Replace
              </button>
              <button className="ghost-btn" onClick={() => setPendingThemeId(null)}>
                Cancel
              </button>
            </div>

            {replaceConfirm ? (
              <div className="modal-error">
                <strong>Are you sure?</strong> Replace is destructive to local design intent and can
                overwrite visual choices. A backup is created first, but restore will be required if
                this was accidental.
                <div className="card-row" style={{ marginTop: 8 }}>
                  <button className="danger-btn" onClick={() => handleApply("replace")}>
                    Yes, Replace Theme
                  </button>
                  <button className="ghost-btn" onClick={() => setReplaceConfirm(false)}>
                    Keep Merge
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
