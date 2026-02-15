import { core } from "@tauri-apps/api";
import { isTauriRuntime } from "../app-settings/useAppSettings";

export type RemoteServerStatus = {
  running: boolean;
  host: string;
  port: number;
  serverUrl: string;
};

export async function getRemoteServerStatus(): Promise<RemoteServerStatus> {
  if (!isTauriRuntime()) {
    throw new Error("Remote server controls are available only in desktop Tauri.");
  }
  return core.invoke<RemoteServerStatus>("get_remote_server_status");
}

export async function startRemoteServer(input: {
  host: string;
  port: number;
  token: string;
  workspaceRoot: string;
}): Promise<RemoteServerStatus> {
  if (!isTauriRuntime()) {
    throw new Error("Remote server controls are available only in desktop Tauri.");
  }
  return core.invoke<RemoteServerStatus>("start_remote_server", {
    host: input.host,
    port: input.port,
    token: input.token,
    workspaceRoot: input.workspaceRoot,
    workspace_root: input.workspaceRoot,
  });
}

export async function stopRemoteServer(): Promise<RemoteServerStatus> {
  if (!isTauriRuntime()) {
    throw new Error("Remote server controls are available only in desktop Tauri.");
  }
  return core.invoke<RemoteServerStatus>("stop_remote_server");
}
