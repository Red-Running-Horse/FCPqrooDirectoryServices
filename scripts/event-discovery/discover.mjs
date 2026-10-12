#!/usr/bin/env node
// ============================================================================
// scripts/event-discovery/discover.mjs — daily event discovery orchestrator.
// Run by .github/workflows/event-discovery.yml (cron 0 13 * * * = 08:00 en
// hora de Cancún) and runnable by hand:
//
//   GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=… node scripts/event-discovery/discover.mjs
//
// Behavior (the delivery contract):
//   - New candidates   → ONE issue listing them all, labels applied,
//                        seen.json updated on the discovery-data branch.
//   - Zero candidates  → green run, no issue, no commit. Silent by design.
//   - Any failure      → red run (exit 1) AND one failure issue; while an
//                        open failure issue exists, later failures comment
//                        on it instead of opening duplicates.
//
// Delivery is GitHub Issues only, and the only ref ever written is
// discovery-data — never the default branch.
// ============================================================================

import { pathToFileURL } from "node:url";
import { partitionCandidates, updateSeen } from "./dedupe.mjs";
import { collectCandidates } from "./extract.mjs";
import { formatDiscoveryIssue } from "./format.mjs";
import { createIssue, ensureFailureIssue, ensureLabel, CANDIDATE_LABEL } from "./report.mjs";
import { readSeen, writeSeen, ensureBranch, BRANCH } from "./seen-store.mjs";
import { enabledSources } from "./sources.mjs";

export async function run({ repo, token, fetchImpl = fetch, log = console.log }) {
  const runDate = new Date().toISOString().slice(0, 10);
  try {
    const sources = enabledSources();
    if (sources.length === 0) throw new Error("No hay fuentes habilitadas en sources.mjs");

    const { seen, sha } = await readSeen({ repo, token }, fetchImpl);
    const { candidates, failures } = await collectCandidates(sources, fetchImpl);
    for (const failure of failures) {
      log(`aviso: ${failure.source.id} falló (${failure.message}) — se sigue con las demás fuentes`);
    }
    if (candidates.length === 0 && failures.length === sources.length) {
      throw new Error(`Todas las fuentes fallaron: ${failures.map((f) => `${f.source.id} (${f.message})`).join("; ")}`);
    }

    const { fresh, knownCount } = partitionCandidates(candidates, seen);
    if (fresh.length === 0) {
      log(`0 candidatos nuevos (${knownCount} ya vistos, ${failures.length} fuente(s) caída(s)) — sin issue, corrida verde.`);
      return 0;
    }

    await ensureLabel({ repo, token, name: CANDIDATE_LABEL }, fetchImpl);
    const { title, body } = formatDiscoveryIssue({ candidates: fresh, runDate });
    const issue = await createIssue({ repo, token, title, body, labels: [CANDIDATE_LABEL] }, fetchImpl);

    if (sha === null) await ensureBranch({ repo, token, initialSeen: seen }, fetchImpl);
    await writeSeen(
      { repo, token, seen: updateSeen(seen, fresh, runDate), sha, message: `eventos: registra ${fresh.length} candidato(s) visto(s) el ${runDate}` },
      fetchImpl,
    );

    log(`issue #${issue.number} con ${fresh.length} candidato(s) nuevo(s); seen.json actualizado en la rama ${BRANCH}.`);
    return 0;
  } catch (error) {
    log(`ERROR: ${error?.message ?? error}`);
    await ensureFailureIssue({ repo, token, runDate, error }, fetchImpl).catch(() => null);
    return 1;
  }
}

// Auto-run only when executed directly (node scripts/event-discovery/discover.mjs),
// never when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN ?? process.env.DISCOVERY_TOKEN;
  if (!repo || !token) {
    console.error("Faltan GITHUB_REPOSITORY y/o GITHUB_TOKEN (o DISCOVERY_TOKEN).");
    process.exit(2);
  }
  run({ repo, token }).then((code) => {
    process.exitCode = code;
  });
}
