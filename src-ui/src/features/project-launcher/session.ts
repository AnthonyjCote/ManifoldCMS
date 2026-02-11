import { useEffect, useState } from "react";

import type { ProjectSession } from "./types";

const SESSION_KEY = "manifold.activeProject.v1";
const SESSION_EVENT = "manifold:project-session";

function readSession(): ProjectSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ProjectSession;
  } catch {
    return null;
  }
}

export function getActiveProjectSession(): ProjectSession | null {
  return readSession();
}

export function setActiveProjectSession(session: ProjectSession | null): void {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
  } else {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useActiveProjectSession(): ProjectSession | null {
  const [session, setSession] = useState<ProjectSession | null>(() => readSession());

  useEffect(() => {
    const onSession = () => setSession(readSession());
    window.addEventListener(SESSION_EVENT, onSession);
    return () => window.removeEventListener(SESSION_EVENT, onSession);
  }, []);

  return session;
}
