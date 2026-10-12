// ============================================================================
// scripts/event-discovery/dedupe.mjs — decide which candidates are NEW.
//
// seen.json (committed to the discovery-data branch, never main) is the
// memory between daily runs:
//
//   { "version": 1, "updated": "2026-10-12", "fingerprints": ["…", …] }
//
// A candidate's fingerprint is a short sha1 over source + normalized title +
// start date: stable across runs, different when anything meaningful changes.
// Pure module — no I/O; reading and writing seen.json lives in seen-store.mjs.
// ============================================================================

import { createHash } from "node:crypto";

export const SEEN_VERSION = 1;

function normalizeField(value) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function fingerprint(candidate) {
  const raw = [candidate.sourceId, candidate.title?.es ?? "", candidate.startAt ?? ""].map(normalizeField).join("|");
  return createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

export function emptySeen() {
  return { version: SEEN_VERSION, updated: null, fingerprints: [] };
}

// Throws on malformed JSON — a corrupt seen.json must surface as a red run,
// not silently restart discovery from zero (which would re-file everything).
export function parseSeen(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.fingerprints)) {
    throw new Error("seen.json no tiene un arreglo \`fingerprints\`");
  }
  if (parsed.version !== SEEN_VERSION) {
    throw new Error(`seen.json versión ${parsed.version} no soportada (se esperaba ${SEEN_VERSION})`);
  }
  return { version: SEEN_VERSION, updated: parsed.updated ?? null, fingerprints: parsed.fingerprints };
}

// Split candidates into fresh vs already-seen. Duplicates inside the batch
// itself collapse to their first occurrence, so one page advertising the
// same event twice yields a single issue entry.
export function partitionCandidates(candidates, seen) {
  const known = new Set(seen.fingerprints);
  const fresh = [];
  for (const candidate of candidates) {
    const fp = fingerprint(candidate);
    if (known.has(fp)) continue;
    known.add(fp);
    fresh.push({ ...candidate, fingerprint: fp });
  }
  return { fresh, knownCount: candidates.length - fresh.length };
}

export function updateSeen(seen, fresh, date) {
  return {
    version: SEEN_VERSION,
    updated: date,
    fingerprints: [...seen.fingerprints, ...fresh.map((candidate) => candidate.fingerprint)],
  };
}
