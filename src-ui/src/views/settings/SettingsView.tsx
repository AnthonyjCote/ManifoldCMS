import { useEffect, useState } from "react";

import {
  clearRemoteSession,
  isTauriRuntime,
  useAppSettings,
} from "../../features/app-settings/useAppSettings";
import {
  getRemoteServerStatus,
  startRemoteServer,
  stopRemoteServer,
  type RemoteServerStatus,
} from "../../features/remote/server-api";

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

const STOPPED_STATUS: RemoteServerStatus = {
  running: false,
  host: "",
  port: 0,
  serverUrl: "",
};
const WORKSPACE_ROOT_KEY = "manifold.workspace.root.v1";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "";
  }
  return trimmed.replace(/\/$/, "");
}

export function SettingsView() {
  const { settings, updateSettings, regenerateRemoteToken } = useAppSettings();
  const desktopRuntime = isTauriRuntime();
  const [serverStatus, setServerStatus] = useState<RemoteServerStatus>(STOPPED_STATUS);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverBusy, setServerBusy] = useState(false);

  const explicitShareUrl = normalizeUrl(settings.remoteAccess.proxyShareUrl);
  const defaultShareUrl =
    serverStatus.running && serverStatus.serverUrl.trim().length > 0
      ? serverStatus.serverUrl
      : settings.remoteAccess.serverBaseUrl;
  const shareUrl = explicitShareUrl.length > 0 ? explicitShareUrl : defaultShareUrl;

  const refreshStatus = async () => {
    try {
      setServerError(null);
      const next = await getRemoteServerStatus();
      setServerStatus(next);
    } catch (error) {
      setServerStatus(STOPPED_STATUS);
      setServerError(
        error instanceof Error
          ? error.message
          : "Remote server status unavailable. Open this view inside Tauri."
      );
    }
  };

  useEffect(() => {
    if (!desktopRuntime) {
      return;
    }
    void refreshStatus();
  }, [desktopRuntime]);

  return (
    <section className="view-shell project-settings-shell settings-shell">
      <header className="project-settings-topbar settings-topbar">
        <div className="project-settings-topbar-title settings-topbar-title">
          <h1>Remote Access Settings</h1>
          <p>
            Launch the backend server, set an access password, and share your app from one place.
          </p>
        </div>
        <div className="project-settings-topbar-actions settings-topbar-actions">
          <button
            className="secondary-btn"
            disabled={serverBusy || !desktopRuntime}
            onClick={() => void refreshStatus()}
            title={!desktopRuntime ? "Server controls are available in desktop Tauri." : undefined}
          >
            Refresh Status
          </button>
        </div>
      </header>

      <div className="project-settings-layout settings-layout">
        <aside className="project-settings-sidebar settings-sidebar">
          <div className="project-settings-sidebar-header settings-sidebar-header">
            <h2>Remote Access</h2>
          </div>
          <div className="project-settings-category-list settings-category-list">
            <button
              type="button"
              className="project-settings-category-item settings-category-item selected"
            >
              <strong>Server + Sharing</strong>
              <span>Host, port, password, and share URL</span>
            </button>
          </div>
        </aside>

        <main className="project-settings-main settings-main">
          <section className="panel-card project-settings-card settings-card">
            <h3>Server Runtime</h3>
            <p>
              Use `0.0.0.0` to listen on LAN. Set a password, start the server, and share the URL.
            </p>

            <div className="settings-grid">
              <label className="inspector-field">
                <span>Host</span>
                <input
                  value={settings.remoteAccess.host}
                  onChange={(event) => {
                    const next = event.target.value.trim();
                    updateSettings((prev) => ({
                      ...prev,
                      remoteAccess: {
                        ...prev.remoteAccess,
                        host: next || "0.0.0.0",
                      },
                    }));
                  }}
                  placeholder="0.0.0.0"
                />
              </label>

              <label className="inspector-field">
                <span>Port</span>
                <input
                  value={String(settings.remoteAccess.port)}
                  onChange={(event) => {
                    const next = parsePositiveInt(event.target.value);
                    if (next == null) {
                      return;
                    }
                    updateSettings((prev) => ({
                      ...prev,
                      remoteAccess: {
                        ...prev.remoteAccess,
                        port: next,
                        serverBaseUrl: `http://${prev.remoteAccess.host || "127.0.0.1"}:${next}`,
                      },
                    }));
                  }}
                />
              </label>

              <label className="inspector-field">
                <span>Workspace Root (host machine)</span>
                <input
                  value={settings.remoteAccess.workspaceRoot}
                  onChange={(event) => {
                    const next = event.target.value;
                    updateSettings((prev) => ({
                      ...prev,
                      remoteAccess: {
                        ...prev.remoteAccess,
                        workspaceRoot: next,
                      },
                    }));
                  }}
                  placeholder="/Users/you/Documents"
                />
              </label>

              <label className="inspector-field">
                <span>Access Password</span>
                <input
                  value={settings.remoteAccess.token}
                  onChange={(event) => {
                    const next = event.target.value.trim();
                    updateSettings((prev) => ({
                      ...prev,
                      remoteAccess: {
                        ...prev.remoteAccess,
                        token: next,
                      },
                    }));
                  }}
                  placeholder="Set a password"
                />
              </label>

              <label className="inspector-field">
                <span>Access URL</span>
                <div className="settings-share-row">
                  <input
                    value={shareUrl}
                    onChange={(event) => {
                      const next = event.target.value;
                      updateSettings((prev) => ({
                        ...prev,
                        remoteAccess: {
                          ...prev.remoteAccess,
                          proxyShareUrl: next,
                        },
                      }));
                    }}
                    placeholder="Defaults to server IP + port"
                  />
                  <button
                    type="button"
                    className="secondary-btn settings-copy-chip"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareUrl);
                    }}
                    title="Copy access URL"
                  >
                    Copy
                  </button>
                </div>
              </label>
            </div>

            <div className="card-row">
              <button className="secondary-btn" onClick={regenerateRemoteToken}>
                Generate Password
              </button>
              <button
                className="primary-btn"
                disabled={
                  serverBusy || settings.remoteAccess.token.trim().length === 0 || !desktopRuntime
                }
                onClick={async () => {
                  try {
                    setServerBusy(true);
                    setServerError(null);
                    const next = await startRemoteServer({
                      host: settings.remoteAccess.host,
                      port: settings.remoteAccess.port,
                      token: settings.remoteAccess.token,
                      workspaceRoot:
                        settings.remoteAccess.workspaceRoot.trim() ||
                        window.localStorage.getItem(WORKSPACE_ROOT_KEY)?.trim() ||
                        "",
                    });
                    setServerStatus(next);
                    updateSettings((prev) => ({
                      ...prev,
                      remoteAccess: {
                        ...prev.remoteAccess,
                        serverBaseUrl: next.serverUrl,
                      },
                    }));
                  } catch (error) {
                    setServerError(
                      error instanceof Error ? error.message : "Failed to start remote server."
                    );
                  } finally {
                    setServerBusy(false);
                  }
                }}
                title={
                  !desktopRuntime ? "Start/stop server is available in desktop Tauri." : undefined
                }
              >
                Start Server
              </button>
              <button
                className="secondary-btn"
                disabled={serverBusy || !serverStatus.running || !desktopRuntime}
                onClick={async () => {
                  try {
                    setServerBusy(true);
                    setServerError(null);
                    const next = await stopRemoteServer();
                    setServerStatus(next);
                  } catch (error) {
                    setServerError(
                      error instanceof Error ? error.message : "Failed to stop remote server."
                    );
                  } finally {
                    setServerBusy(false);
                  }
                }}
                title={
                  !desktopRuntime ? "Start/stop server is available in desktop Tauri." : undefined
                }
              >
                Stop Server
              </button>
            </div>

            <div className="settings-remote-status">
              <strong>Status:</strong> {serverStatus.running ? "Running" : "Stopped"}
              {serverStatus.running ? (
                <span>
                  {" "}
                  | Server Endpoint: <code>{serverStatus.serverUrl}</code>
                </span>
              ) : null}
            </div>
            {serverError ? <div className="modal-error">{serverError}</div> : null}
            {!desktopRuntime ? (
              <small>
                You are connected from browser mode. Remote server start/stop controls are only
                available in the desktop Tauri app.
              </small>
            ) : null}
            <small>
              Leave Access URL empty to use default server IP + port. Remote users open this URL and
              enter the access password.
            </small>
            <div className="card-row">
              <button
                className="ghost-btn"
                onClick={() =>
                  updateSettings((prev) => ({
                    ...prev,
                    remoteAccess: {
                      ...prev.remoteAccess,
                      proxyShareUrl: "",
                    },
                  }))
                }
              >
                Use Default URL
              </button>
              <button className="ghost-btn" onClick={() => clearRemoteSession()}>
                Clear Browser Remote Session
              </button>
            </div>
          </section>
        </main>
      </div>
    </section>
  );
}
