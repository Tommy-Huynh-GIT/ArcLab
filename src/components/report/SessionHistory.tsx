"use client";

import { useEffect, useState } from "react";
import type { SavedSessionReport } from "./ReportSummary";

type Props = {
  profileId: string;
  refreshKey?: number;
  onSelectSession?: (session: SavedSessionReport) => void;
};

type LoadState = "loading" | "ready" | "error";

type HistoryState = {
  requestKey: string | null;
  loadState: LoadState;
  sessions: SavedSessionReport[];
  error: string;
};

function readApiError(data: unknown, fallback: string) {
  return data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
    ? data.error
    : fallback;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is SavedSessionReport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    (!("report" in session) ||
      session.report === null ||
      typeof session.report === "object")
  );
}

function readSessions(data: unknown) {
  if (!data || typeof data !== "object" || !("sessions" in data)) {
    return null;
  }

  const sessions = (data as { sessions: unknown }).sessions;

  return Array.isArray(sessions) && sessions.every(isSession) ? sessions : null;
}

function formatCreatedAt(createdAt: SavedSessionReport["createdAt"]) {
  if (!createdAt) {
    return null;
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRank(session: SavedSessionReport) {
  return session.report?.rank ? `Rank ${session.report.rank}` : "Rank pending";
}

function getScore(session: SavedSessionReport) {
  return typeof session.report?.overallScore === "number"
    ? `Score ${session.report.overallScore}`
    : "Score pending";
}

export function SessionHistory({
  profileId,
  refreshKey = 0,
  onSelectSession,
}: Props) {
  const requestKey = `${profileId}:${refreshKey}`;
  const [history, setHistory] = useState<HistoryState>({
    requestKey: null,
    loadState: "loading",
    sessions: [],
    error: "",
  });
  const loadState =
    history.requestKey === requestKey ? history.loadState : "loading";
  const sessions = history.requestKey === requestKey ? history.sessions : [];
  const error = history.requestKey === requestKey ? history.error : "";

  useEffect(() => {
    let isCurrent = true;

    async function loadSessions() {
      try {
        const response = await fetch(`/api/profiles/${profileId}/sessions`);
        const data = await readJson(response);

        if (!isCurrent) {
          return;
        }

        if (!response.ok) {
          throw new Error(readApiError(data, "Unable to load saved sessions."));
        }

        const nextSessions = readSessions(data);

        if (!nextSessions) {
          throw new Error("Unable to load saved sessions.");
        }

        setHistory({
          requestKey,
          loadState: "ready",
          sessions: nextSessions,
          error: "",
        });
      } catch (loadError) {
        if (!isCurrent) {
          return;
        }

        setHistory({
          requestKey,
          loadState: "error",
          sessions: [],
          error:
            loadError instanceof Error
              ? loadError.message
              : "Unable to load saved sessions.",
        });
      }
    }

    loadSessions();

    return () => {
      isCurrent = false;
    };
  }, [profileId, requestKey]);

  return (
    <section className="panel session-history" aria-labelledby="history-heading">
      <div className="panel-heading">
        <p className="eyebrow">Session history</p>
        <h2 id="history-heading">Saved sessions</h2>
      </div>

      {loadState === "loading" ? (
        <p className="history-state" aria-live="polite">
          Loading saved sessions...
        </p>
      ) : null}

      {loadState === "error" ? (
        <p className="history-state history-error" role="alert">
          {error}
        </p>
      ) : null}

      {loadState === "ready" && sessions.length === 0 ? (
        <p className="history-state">No saved sessions yet.</p>
      ) : null}

      {loadState === "ready" && sessions.length > 0 ? (
        <div className="history-list">
          {sessions.map((session) => {
            const createdAt = formatCreatedAt(session.createdAt);
            const content = (
              <>
                <span className="history-title">{session.title}</span>
                <span>{getRank(session)}</span>
                <span>{getScore(session)}</span>
                {createdAt ? (
                  <time dateTime={new Date(session.createdAt ?? "").toISOString()}>
                    {createdAt}
                  </time>
                ) : null}
              </>
            );

            return onSelectSession ? (
              <button
                className="history-row"
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session)}
              >
                {content}
              </button>
            ) : (
              <article className="history-row" key={session.id}>
                {content}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
