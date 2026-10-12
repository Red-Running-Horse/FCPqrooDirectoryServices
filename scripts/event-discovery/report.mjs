// ============================================================================
// scripts/event-discovery/report.mjs — GitHub REST client for the discovery
// pipeline. All network access goes through an injectable fetch so tests
// mock at this boundary and never touch api.github.com.
//
// Only two write scopes are ever needed (mirrored in the workflow):
//   issues: write   — file candidate and failure issues
//   contents: write — committed separately by seen-store.mjs
// ============================================================================

import { formatFailureComment, formatFailureIssueBody, failureIssueTitle } from "./format.mjs";

const API = "https://api.github.com";

export const CANDIDATE_LABEL = "eventos-candidato";
export const FAILURE_LABEL = "eventos-fallo";

export const LABELS = {
  [CANDIDATE_LABEL]: { color: "1d76db", description: "Evento candidato detectado por el pipeline de descubrimiento; pendiente de revisión editorial." },
  [FAILURE_LABEL]: { color: "d93f0b", description: "La corrida diaria de descubrimiento de eventos falló (workflow en rojo)." },
};

async function github(path, { method = "GET", token, body, repo, allow404 = false }, fetchImpl) {
  const response = await fetchImpl(`${API}/repos/${repo}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 404 && allow404) return null;
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub API ${method} ${path} → ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return response.status === 204 ? null : response.json();
}

// Labels must exist before an issue can carry them; create on demand.
export async function ensureLabel({ repo, token, name }, fetchImpl) {
  const existing = await github(`/labels/${encodeURIComponent(name)}`, { token, repo, allow404: true }, fetchImpl);
  if (existing) return existing;
  const spec = LABELS[name] ?? { color: "cccccc", description: name };
  return github(`/labels`, { method: "POST", token, repo, body: { name, ...spec } }, fetchImpl);
}

export async function createIssue({ repo, token, title, body, labels = [] }, fetchImpl) {
  return github(`/issues`, { method: "POST", token, repo, body: { title, body, labels } }, fetchImpl);
}

export async function listOpenIssues({ repo, token, labels = [] }, fetchImpl) {
  const query = labels.map((label) => `labels=${encodeURIComponent(label)}`).join("&");
  const issues = await github(`/issues?state=open&per_page=50${query ? `&${query}` : ""}`, { token, repo }, fetchImpl);
  return issues.filter((issue) => !issue.pull_request);
}

export async function commentOnIssue({ repo, token, issueNumber, body }, fetchImpl) {
  return github(`/issues/${issueNumber}/comments`, { method: "POST", token, repo, body: { body } }, fetchImpl);
}

// One failure issue at a time: while an open one exists, further failures
// comment on it instead of spawning a daily duplicate.
export async function ensureFailureIssue({ repo, token, runDate, error }, fetchImpl) {
  await ensureLabel({ repo, token, name: FAILURE_LABEL }, fetchImpl).catch(() => null);
  const open = await listOpenIssues({ repo, token, labels: [FAILURE_LABEL] }, fetchImpl);
  const current = open.find((issue) => issue.title.startsWith("[Eventos] Falló"));
  if (current) {
    await commentOnIssue({ repo, token, issueNumber: current.number, body: formatFailureComment({ error, runDate }) }, fetchImpl);
    return { ...current, commented: true };
  }
  return createIssue(
    { repo, token, title: failureIssueTitle(runDate), body: formatFailureIssueBody({ error, runDate }), labels: [FAILURE_LABEL] },
    fetchImpl,
  );
}
