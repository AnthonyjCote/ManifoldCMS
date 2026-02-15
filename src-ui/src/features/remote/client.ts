import { resolveRemoteTransportSettings } from "../app-settings/useAppSettings";

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }
  const text = await response.text();
  throw new Error(text || `Remote request failed (${response.status})`);
}

export function shouldUseRemoteHttpTransport(): boolean {
  return resolveRemoteTransportSettings().mode === "remote_http";
}

export async function fetchRemoteContext(): Promise<{ workspaceRoot: string }> {
  return remotePost<{ workspaceRoot: string }>("/api/remote-context", {});
}

export async function remotePost<T>(path: string, body: unknown): Promise<T> {
  const remote = resolveRemoteTransportSettings();
  const base = remote.serverBaseUrl.replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-manifold-token": remote.token,
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}
