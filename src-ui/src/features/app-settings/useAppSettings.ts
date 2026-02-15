import { useEffect, useState } from "react";

export type RemoteAccessMode = "tauri_local" | "remote_http";

export type AppSettings = {
  remoteAccess: {
    mode: RemoteAccessMode;
    serverBaseUrl: string;
    proxyShareUrl: string;
    workspaceRoot: string;
    token: string;
    host: string;
    port: number;
  };
};

const APP_SETTINGS_KEY = "manifold.app-settings.v1";
const REMOTE_SESSION_KEY = "manifold.remote.session.v1";

const DEFAULT_APP_SETTINGS: AppSettings = {
  remoteAccess: {
    mode: "tauri_local",
    serverBaseUrl: "http://127.0.0.1:8787",
    proxyShareUrl: "",
    workspaceRoot: "",
    token: "",
    host: "0.0.0.0",
    port: 8787,
  },
};

function randomToken(length = 24): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    out += alphabet[index] ?? "X";
  }
  return out;
}

function parsePositivePort(raw: unknown): number {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    return DEFAULT_APP_SETTINGS.remoteAccess.port;
  }
  return parsed;
}

function coerceSettings(raw: unknown): AppSettings {
  const input = (raw as Partial<AppSettings>) ?? {};
  const remoteAccess = (input.remoteAccess as Partial<AppSettings["remoteAccess"]>) ?? {};
  const mode = remoteAccess.mode === "remote_http" ? "remote_http" : "tauri_local";
  const host =
    typeof remoteAccess.host === "string" && remoteAccess.host.trim().length > 0
      ? remoteAccess.host.trim()
      : DEFAULT_APP_SETTINGS.remoteAccess.host;
  const port = parsePositivePort(remoteAccess.port);
  const token =
    typeof remoteAccess.token === "string" && remoteAccess.token.trim().length > 0
      ? remoteAccess.token.trim()
      : randomToken();
  const serverBaseUrl =
    typeof remoteAccess.serverBaseUrl === "string" && remoteAccess.serverBaseUrl.trim().length > 0
      ? remoteAccess.serverBaseUrl.trim()
      : `http://127.0.0.1:${port}`;
  const proxyShareUrl =
    typeof remoteAccess.proxyShareUrl === "string" ? remoteAccess.proxyShareUrl.trim() : "";
  const workspaceRoot =
    typeof remoteAccess.workspaceRoot === "string" ? remoteAccess.workspaceRoot.trim() : "";

  return {
    remoteAccess: {
      mode,
      serverBaseUrl,
      proxyShareUrl,
      workspaceRoot,
      token,
      host,
      port,
    },
  };
}

function readSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) {
      return coerceSettings(undefined);
    }
    return coerceSettings(JSON.parse(raw));
  } catch {
    return coerceSettings(undefined);
  }
}

function writeSettings(settings: AppSettings): void {
  window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}

function readRemoteSession(): { serverBaseUrl: string; token: string } | null {
  try {
    const raw = window.localStorage.getItem(REMOTE_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { serverBaseUrl?: string; token?: string };
    if (typeof parsed.serverBaseUrl !== "string" || typeof parsed.token !== "string") {
      return null;
    }
    if (parsed.serverBaseUrl.trim().length === 0 || parsed.token.trim().length === 0) {
      return null;
    }
    return {
      serverBaseUrl: parsed.serverBaseUrl.trim(),
      token: parsed.token.trim(),
    };
  } catch {
    return null;
  }
}

export function isTauriRuntime(): boolean {
  const win = window as typeof window & {
    __TAURI_INTERNALS__?: {
      invoke?: unknown;
    };
    __TAURI__?: {
      core?: {
        invoke?: unknown;
      };
    };
    __TAURI_INVOKE__?: unknown;
  };
  if (window.location.protocol === "tauri:") {
    return true;
  }
  if (typeof win.__TAURI_INTERNALS__?.invoke === "function") {
    return true;
  }
  if (typeof win.__TAURI__?.core?.invoke === "function") {
    return true;
  }
  return typeof win.__TAURI_INVOKE__ === "function";
}

export function setRemoteSession(input: { serverBaseUrl: string; token: string }): void {
  const payload = {
    serverBaseUrl: input.serverBaseUrl.trim(),
    token: input.token.trim(),
  };
  window.localStorage.setItem(REMOTE_SESSION_KEY, JSON.stringify(payload));
}

export function clearRemoteSession(): void {
  window.localStorage.removeItem(REMOTE_SESSION_KEY);
}

export function resolveRemoteTransportSettings(): {
  mode: RemoteAccessMode;
  serverBaseUrl: string;
  token: string;
} {
  const settings = readSettings();
  if (isTauriRuntime()) {
    return {
      mode: "tauri_local",
      serverBaseUrl: settings.remoteAccess.serverBaseUrl,
      token: settings.remoteAccess.token,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const remote = params.get("remote");
  const token = params.get("token");
  if (remote && token) {
    return {
      mode: "remote_http",
      serverBaseUrl: remote,
      token,
    };
  }

  const remoteSession = readRemoteSession();
  if (remoteSession) {
    return {
      mode: "remote_http",
      serverBaseUrl: remoteSession.serverBaseUrl,
      token: remoteSession.token,
    };
  }

  return {
    mode: settings.remoteAccess.mode,
    serverBaseUrl: settings.remoteAccess.serverBaseUrl,
    token: settings.remoteAccess.token,
  };
}

export function useAppSettings(): {
  settings: AppSettings;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  resetSettings: () => void;
  regenerateRemoteToken: () => void;
} {
  const [settings, setSettings] = useState<AppSettings>(() => readSettings());

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  return {
    settings,
    updateSettings: (updater) => {
      setSettings((prev) => coerceSettings(updater(prev)));
    },
    resetSettings: () => {
      setSettings(coerceSettings(undefined));
    },
    regenerateRemoteToken: () => {
      setSettings((prev) =>
        coerceSettings({
          ...prev,
          remoteAccess: {
            ...prev.remoteAccess,
            token: randomToken(),
          },
        })
      );
    },
  };
}
