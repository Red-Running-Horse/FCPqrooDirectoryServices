// ============================================================================
// scripts/event-discovery/seen-store.mjs — persist seen.json on the
// `discovery-data` branch via the GitHub API. MAIN IS NEVER WRITTEN: when
// the branch does not exist yet it is created as an ORPHAN commit containing
// only seen.json, so no main history or tree is copied over.
//
// Layout on the branch:
//   seen.json   { "version": 1, "updated": "YYYY-MM-DD", "fingerprints": [] }
//
// Pure I/O boundary: like report.mjs, fetch is injected for tests.
// ============================================================================

import { emptySeen, parseSeen } from "./dedupe.mjs";

const API = "https://api.github.com";

export const BRANCH = "discovery-data";
export const SEEN_PATH = "seen.json";

function headers(token, extra = {}) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...extra,
  };
}

export function serializeSeen(seen) {
  return `${JSON.stringify(seen, null, 2)}\n`;
}

// Returns { seen, sha } — sha is null when the branch/file does not exist
// yet and the caller must ensureBranch() before writing.
export async function readSeen({ repo, token }, fetchImpl) {
  const response = await fetchImpl(`${API}/repos/${repo}/contents/${SEEN_PATH}?ref=${BRANCH}`, {
    headers: headers(token),
  });
  if (response.status === 404) return { seen: emptySeen(), sha: null };
  if (!response.ok) throw new Error(`GitHub API GET contents/${SEEN_PATH} → ${response.status}`);
  const data = await response.json();
  const text = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { seen: parseSeen(text), sha: data.sha };
}

// Create refs/heads/discovery-data pointing at an orphan commit whose tree
// holds only seen.json. 409/422 means the branch already exists — fine.
export async function ensureBranch({ repo, token, initialSeen }, fetchImpl) {
  const post = async (path, body) => {
    const response = await fetchImpl(`${API}/repos/${repo}${path}`, {
      method: "POST",
      headers: headers(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
  });
    if (!response.ok && response.status !== 409 && response.status !== 422) {
      throw new Error(`GitHub API POST ${path} → ${response.status}`);
    }
    return response.json();
  };

  const blob = await post("/git/blobs", { content: serializeSeen(initialSeen ?? emptySeen()), encoding: "utf-8" });
  const tree = await post("/git/trees", {
    tree: [{ path: SEEN_PATH, mode: "100644", type: "blob", sha: blob.sha }],
  });
  const commit = await post("/git/commits", {
    message: "eventos: inicializa discovery-data con seen.json",
    tree: tree.sha,
    parents: [],
  });
  await post("/git/refs", { ref: `refs/heads/${BRANCH}`, sha: commit.sha });
}

// Upsert seen.json on the branch. `sha` comes from readSeen; omit it when
// the file is being created for the first time.
export async function writeSeen({ repo, token, seen, sha, message }, fetchImpl) {
  const body = {
    message,
    content: Buffer.from(serializeSeen(seen), "utf8").toString("base64"),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const response = await fetchImpl(`${API}/repos/${repo}/contents/${SEEN_PATH}`, {
    method: "PUT",
    headers: headers(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub API PUT contents/${SEEN_PATH} → ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return response.json();
}
