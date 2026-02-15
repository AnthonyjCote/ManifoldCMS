import { useMemo, useState } from "react";

import { setRemoteSession } from "../features/app-settings/useAppSettings";

type Props = {
  defaultServerUrl: string;
  onConnected: () => void;
};

export function RemoteAccessGate({ defaultServerUrl, onConnected }: Props) {
  const [serverUrl, setServerUrl] = useState(defaultServerUrl);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedServerUrl = useMemo(() => serverUrl.trim().replace(/\/$/, ""), [serverUrl]);

  return (
    <div className="remote-gate-shell">
      <div className="remote-gate-card">
        <h1>Remote Access</h1>
        <p>Connect to a shared Manifold instance using the server URL and access password.</p>

        <label className="inspector-field">
          <span>Server URL</span>
          <input
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder="http://192.168.1.25:8787"
          />
        </label>

        <label className="inspector-field">
          <span>Access Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter shared password"
          />
        </label>

        {error ? <div className="modal-error">{error}</div> : null}

        <div className="card-row">
          <button
            className="primary-btn"
            disabled={busy || trimmedServerUrl.length === 0 || password.trim().length === 0}
            onClick={async () => {
              try {
                setBusy(true);
                setError(null);
                const response = await fetch(`${trimmedServerUrl}/health`, {
                  method: "GET",
                  headers: {
                    "x-manifold-token": password.trim(),
                  },
                });
                if (!response.ok) {
                  throw new Error("Connection failed. Check URL and password.");
                }
                setRemoteSession({
                  serverBaseUrl: trimmedServerUrl,
                  token: password.trim(),
                });
                onConnected();
              } catch (nextError) {
                setError(
                  nextError instanceof Error
                    ? nextError.message
                    : "Failed to connect to remote server."
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
