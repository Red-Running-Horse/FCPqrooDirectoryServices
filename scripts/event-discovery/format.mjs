// ============================================================================
// scripts/event-discovery/format.mjs — render candidates and failures as
// GitHub issue content. Pure module: strings in, strings out.
//
// Language: the issue is Spanish-first with English second, matching the
// site (the editors triage in ES; EN strings exist for the same reason the
// site's UI_TEXT does). Every candidate ships as a checklist that walks
// EVENT_CHECKLIST.md so a reviewed candidate can be pasted into
// app/events.mjs field by field.
// ============================================================================

import { CATEGORIES } from "../../app/place-index.mjs";

const CATEGORY_LABELS = new Map(CATEGORIES.map(({ id, label }) => [id, label]));

function categoryLabel(category) {
  const label = CATEGORY_LABELS.get(category);
  return label ? `${label.es} / ${label.en} (\`${category}\`)` : `\`${category}\``;
}

// "Exposición de Arte Maya" → "exposicion-de-arte-maya". Editors own the
// final id; this is only a starting suggestion in the issue.
export function suggestId(title) {
  return (title ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "pendiente";
}

export function formatCandidateSection(candidate, index) {
  const lines = [
    `### ${index + 1}. ${candidate.title.es}`,
    "",
    `- Fuente / Source: ${candidate.sourceUrl} (vía \`${candidate.sourceId}\`)`,
    `- Cuándo / When: ${candidate.startAt ? `\`${candidate.startAt}\`` : "sin fecha en la fuente — confirmar"}${candidate.endAt ? ` → \`${candidate.endAt}\`` : ""} — confirmar en hora de Cancún (UTC-5)`,
    `- Dónde / Venue: ${candidate.venue?.name?.es ?? "por confirmar"}`,
    `- Categoría sugerida: ${categoryLabel(candidate.categoryGuess)}`,
    `- id sugerido: \`${suggestId(candidate.title.es)}\``,
  ];
  if (candidate.description) {
    lines.push(`- Descripción: ${candidate.description}`);
  }
  lines.push(
    "",
    "```js",
    "// Pega revisado en app/events.mjs — campos por confirmar marcados abajo.",
    "{",
    `  id: "${suggestId(candidate.title.es)}",`,
    `  title: { es: ${JSON.stringify(candidate.title.es)}, en: "" }, // traducir`,
    `  description: { es: "", en: "" }, // redactar en ambos idiomas`,
    `  startAt: "${candidate.startAt ?? ""}",${candidate.startAt ? "" : " // SIN FECHA en la fuente — confirmar antes de publicar"}`,
    candidate.endAt ? `  endAt: "${candidate.endAt}",` : "  // endAt: …,",
    candidate.venue ? `  venue: { name: { es: ${JSON.stringify(candidate.venue.name.es)}, en: ${JSON.stringify(candidate.venue.name.en)} } },` : '  venue: { name: { es: "", en: "" } }, // o placeId de un lugar del directorio',
    `  category: "${candidate.categoryGuess}",`,
    `  sourceUrl: "${candidate.sourceUrl}",`,
    '  status: "unverified",',
    `  lastUpdated: "", // fecha de la verificación`,
    "}",
    "```",
    "",
    "#### Lista de revisión / Review checklist",
    "- [ ] Fecha, hora y sede confirmadas en la fuente original",
    "- [ ] No duplica un evento ya publicado en `app/events.mjs`",
    "- [ ] Título y descripción redactados (o verificados) en ES **y** EN",
    "- [ ] Categoría correcta asignada",
    "- [ ] `sourceUrl`, `status: \"unverified\"` y `lastUpdated` presentes",
    "- [ ] `npm test` y `npm run build` verdes después de publicar",
    "",
  );
  return lines.join("\n");
}

export function discoveryIssueTitle(count, runDate) {
  return `[Eventos] ${count} candidato${count === 1 ? "" : "s"} nuevo${count === 1 ? "" : "s"} — ${runDate}`;
}

// Throws on an empty list: formatting is only ever called with something to
// report, and the guard keeps "zero candidates = silent" from drifting.
export function formatDiscoveryIssue({ candidates, runDate }) {
  if (!candidates.length) {
    throw new Error("formatDiscoveryIssue requiere al menos un candidato");
  }
  const body = [
    `Descubrimiento diario del ${runDate}: ${candidates.length} evento${candidates.length === 1 ? "" : "s"} candidato${candidates.length === 1 ? "" : "s"} en las fuentes registradas.`,
    "",
    "Nada de esto está publicado todavía. Revisar candidato por candidato siguiendo **EVENT_CHECKLIST.md**; el que pase la revisión se agrega a \`app/events.mjs\`.",
    "",
    ...candidates.flatMap((candidate, index) => formatCandidateSection(candidate, index)),
    "---",
    "Issue generado por el workflow \`event-discovery\`. Cero candidatos no genera issue.",
    "",
  ].join("\n");
  return { title: discoveryIssueTitle(candidates.length, runDate), body };
}

export function failureIssueTitle(runDate) {
  return `[Eventos] Falló el descubrimiento diario — ${runDate}`;
}

export function formatFailureIssueBody({ error, runDate }) {
  return [
    `La corrida del ${runDate} falló y el workflow quedó en rojo.`,
    "",
    "```",
    String(error?.stack ?? error?.message ?? error),
    "```",
    "",
    "Causas habituales: fuente caída o rediseñada (revisar \`scripts/event-discovery/sources.mjs\`), \`seen.json\` corrupto en la rama \`discovery-data\`, o un cambio en la API de GitHub.",
    "",
    "Este issue se reutiliza mientras siga abierto: la siguiente falla se anuncia como comentario.",
    "",
  ].join("\n");
}

export function formatFailureComment({ error, runDate }) {
  return [`Falló de nuevo el ${runDate}:`, "", "```", String(error?.stack ?? error?.message ?? error), "```", ""].join("\n");
}
