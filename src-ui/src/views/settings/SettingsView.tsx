export function SettingsView() {
  return (
    <section className="view-shell">
      <header className="view-header">
        <h1>Settings</h1>
        <p>Workspace, toolchain, and app preferences.</p>
      </header>
      <div className="settings-grid">
        <section className="panel-card">
          <h2>Workspace Paths</h2>
          <p>Configure workspace root and package directories.</p>
        </section>
        <section className="panel-card">
          <h2>Toolchain Checks</h2>
          <p>Node, Rust, and Tauri status.</p>
        </section>
        <section className="panel-card">
          <h2>Credentials Status</h2>
          <p>Credential presence only. No secret values displayed.</p>
        </section>
      </div>
    </section>
  );
}
