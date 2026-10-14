import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { run } from "../scripts/event-discovery/discover.mjs";
import { fingerprint, emptySeen, parseSeen, partitionCandidates, updateSeen } from "../scripts/event-discovery/dedupe.mjs";
import { collectCandidates, extractEventsFromHtml, fetchHtml, guessCategory, isInServiceRegion, parseCardDate } from "../scripts/event-discovery/extract.mjs";
import { discoveryIssueTitle, formatDiscoveryIssue, formatFailureIssueBody, failureIssueTitle, suggestId } from "../scripts/event-discovery/format.mjs";
import { createIssue, ensureFailureIssue, ensureLabel, CANDIDATE_LABEL, FAILURE_LABEL } from "../scripts/event-discovery/report.mjs";
import { readSeen, writeSeen, ensureBranch, serializeSeen, BRANCH } from "../scripts/event-discovery/seen-store.mjs";
import { enabledSources, SOURCES } from "../scripts/event-discovery/sources.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const EVENT_BLOCK =
  '<script type="application/ld+json">' +
  '{"@context":"https://schema.org","@graph":[' +
  '{"@type":"Event","name":"Feria del Queso","startDate":"2026-11-02T12:00:00-05:00","endDate":"2026-11-02T20:00:00-05:00","location":{"@type":"Place","name":"Parque Principal"},"url":"https://siturq.gob.mx/evento/feria-del-queso"},' +
  '{"@type":"Article","headline":"not an event"},' +
  '{"@type":"Event","name":"Sin fecha"}' +
  "]}" +
  "</script>";

// ---------------------------------------------------------------- extract

test("extract: JSON-LD Event blocks become candidates; non-events and blocks without a date are skipped", () => {
  const found = extractEventsFromHtml(
    `garbage<script type="application/ld+json">{not json</script>${EVENT_BLOCK}`,
    { id: "siturq-eventos", url: "https://siturq.gob.mx/eventos" },
  );
  assert.equal(found.length, 1);
  const [candidate] = found;
  assert.equal(candidate.sourceId, "siturq-eventos");
  assert.equal(candidate.title.es, "Feria del Queso");
  assert.equal(candidate.title.en, "Feria del Queso", "EN is a placeholder pending translation");
  assert.equal(candidate.startAt, "2026-11-02T12:00:00-05:00");
  assert.equal(candidate.endAt, "2026-11-02T20:00:00-05:00");
  assert.deepEqual(candidate.venue, { name: { es: "Parque Principal", en: "Parque Principal" } });
  assert.equal(candidate.sourceUrl, "https://siturq.gob.mx/evento/feria-del-queso", "the event's own URL wins");
});

test("extract: venue string and page-URL fallback; full https://schema.org type names are recognized", () => {
  const found = extractEventsFromHtml(
    '<script type="application/ld+json">' +
      '[{"@type":"https://schema.org/Event","name":"Noche de estrellas","startDate":"2026-12-01T19:00:00-05:00","location":"Planetario"}]' +
      "</script>",
    { id: "balam-nah", url: "https://balamnah.fcpqroo.mx" },
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].venue.name.es, "Planetario");
  assert.equal(found[0].sourceUrl, "https://balamnah.fcpqroo.mx", "no event URL → the page URL is the source");
});

test("extract: guessCategory maps keywords to directory categories and defaults to culture", () => {
  assert.equal(guessCategory("Feria de la gastronomía de la Zona Maya"), "food");
  assert.equal(guessCategory("Recorrido por el cenote"), "tours", "first keyword match wins: ruta/tour beats nature here");
  assert.equal(guessCategory("Jornada de reforestación"), "nature");
  assert.equal(guessCategory("Reunión de coordinación"), "culture", "unmatched text defaults to culture");
  assert.ok(guessCategory("concierto") !== "all", "the pseudo-category 'all' is never guessed");
});

test("extract: collectCandidates isolates per-source failures and reports them", async () => {
  const fetchImpl = async (url) => {
    if (url.startsWith("https://siturq.gob.mx")) return new Response(EVENT_BLOCK, { status: 200 });
    return new Response("boom", { status: 500 });
  };
  const sources = [
    { id: "siturq-eventos", url: "https://siturq.gob.mx/eventos" },
    { id: "balam-nah", url: "https://balamnah.fcpqroo.mx" },
  ];
  const { candidates, failures } = await collectCandidates(sources, fetchImpl);
  assert.equal(candidates.length, 1);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].source.id, "balam-nah");
  assert.match(failures[0].message, /500/);
});

test("extract: fetchHtml rejects non-2xx and passes an HTML accept header", async () => {
  let seenAccept;
  const ok = await fetchHtml(
    "https://example.mx",
    async (_url, opts) => {
      seenAccept = opts.headers.Accept;
      return new Response("<html></html>", { status: 200 });
    },
  );
  assert.equal(ok, "<html></html>");
  assert.match(seenAccept, /text\/html/);
  await assert.rejects(() => fetchHtml("https://example.mx", async () => new Response("x", { status: 503 })), /503/);
});

// ------------------------------------------------- card fallback (SITUR shape)

// Representative markup copied from https://siturq.gob.mx/eventos (2026-10):
// <div class="card" data-municipality="…"> with h3.card-title, p.card-text,
// span.date ("30 octubre 2026") and a "Ver más" a.card-link detail link.
const SITUR_SOURCE = { id: "siturq-eventos", url: "https://siturq.gob.mx/eventos" };
const SITUR_CARD = (
  municipality,
  {
    date = "30 octubre 2026",
    description = "Una descripción del evento.",
    link = "https://siturq.gob.mx/evento/abc-123",
    title = "Carnaval Felipe Carrillo Puerto",
  } = {},
) =>
  `<div class="card" data-id="0" ${municipality ? `data-municipality="${municipality}" ` : ""}data-aos="fade-up">` +
  `<div class="image-container"><img src="x.jpg" class="card-img-top" alt="${title}"></div>` +
  `<div class="card-body"><a href="${link ?? "#"}"><h3 class="card-title mb-2 text-body-primary">${title}</h3></a>` +
  (description ? `<p class="card-text fw-medium fixed-height">${description}</p>` : "") +
  `</div><div class="card-footer d-flex justify-content-between py-4 btn-bottom">` +
  (date ? `<span class="date fw-medium">${date}</span>` : `<span class="date fw-medium"></span>`) +
  (link ? `<a href="${link}" class="card-link fw-medium">Ver más</a>` : "") +
  `</div></div>`;

test("extract: JSON-LD wins when a page carries both JSON-LD and cards", () => {
  const found = extractEventsFromHtml(
    `${EVENT_BLOCK}${SITUR_CARD("Felipe Carrillo Puerto")}`,
    SITUR_SOURCE,
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].title.es, "Feria del Queso");
  assert.equal(found[0].startAt, "2026-11-02T12:00:00-05:00");
});

test("extract: card fallback maps the SITUR card shape into a candidate", () => {
  const found = extractEventsFromHtml(SITUR_CARD("Felipe Carrillo Puerto"), SITUR_SOURCE);
  assert.equal(found.length, 1);
  const [candidate] = found;
  assert.equal(candidate.sourceId, "siturq-eventos");
  assert.equal(candidate.title.es, "Carnaval Felipe Carrillo Puerto");
  assert.equal(candidate.title.en, candidate.title.es, "EN placeholder pending translation");
  assert.equal(candidate.startAt, "2026-10-30");
  assert.equal(candidate.endAt, null);
  assert.equal(candidate.description, "Una descripción del evento.");
  assert.equal(candidate.sourceUrl, "https://siturq.gob.mx/evento/abc-123", "the Ver más link wins");
  assert.deepEqual(
    candidate.venue,
    { name: { es: "Felipe Carrillo Puerto", en: "Felipe Carrillo Puerto" } },
    "data-municipality pre-fills the venue",
  );
  assert.equal(candidate.categoryGuess, "culture");
});

test("extract: parseCardDate handles the observed format and stays null on the rest", () => {
  assert.equal(parseCardDate("30 octubre 2026"), "2026-10-30");
  assert.equal(parseCardDate("07 octubre 2026"), "2026-10-07", "zero-padded day");
  assert.equal(parseCardDate("6 de marzo de 2026"), "2026-03-06", "unpadded day, optional 'de'");
  assert.equal(parseCardDate("6 al 8 de marzo de 2026"), null, "ranges stay dateless for the checklist");
  assert.equal(parseCardDate("próximamente"), null);
  assert.equal(parseCardDate(""), null);
});

test("extract: undated/undescribed cards still extract; internal detail/municipality flags ride along", () => {
  const found = extractEventsFromHtml(
    SITUR_CARD("Felipe Carrillo Puerto", { date: "garbage sin fecha", description: "" }),
    SITUR_SOURCE,
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].startAt, null, "no parseable date → null, still a candidate");
  assert.equal(found[0].description, "");
  assert.equal(found[0].__detailUrl, "https://siturq.gob.mx/evento/abc-123", "flagged for its detail link");
  assert.equal(found[0].__municipality, "Felipe Carrillo Puerto");
});

test("collect: detail links are followed only for incomplete cards, one level, filling missing fields", async () => {
  const detail =
    '<script type="application/ld+json">' +
    '{"@type":"Event","name":"Carnaval Felipe Carrillo Puerto","startDate":"2026-03-06T16:00:00-05:00","description":"Comparsas y carros alegóricos."}' +
    "</script>";
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url === SITUR_SOURCE.url) {
      return new Response(
        SITUR_CARD("Felipe Carrillo Puerto", { date: null, description: "", link: "https://siturq.gob.mx/evento/carnaval" }) +
          SITUR_CARD("Felipe Carrillo Puerto", {
            date: "15 octubre 2026",
            description: "Festival de la Xtáabay.",
            link: "https://siturq.gob.mx/evento/xtaabay",
            title: "Festival de la Xtáabay",
          }) +
          SITUR_CARD("Felipe Carrillo Puerto", { date: null, description: "", link: null, title: "Evento sin enlace" }),
        { status: 200 },
      );
    }
    if (url === "https://siturq.gob.mx/evento/carnaval") return new Response(detail, { status: 200 });
    throw new Error(`unmocked: ${url}`);
  };
  const { candidates, regionDropped, detailFetches } = await collectCandidates([SITUR_SOURCE], fetchImpl);
  assert.equal(regionDropped, 0);
  assert.equal(detailFetches, 1, "only the card missing date AND description fetched its detail");
  assert.ok(!calls.includes("https://siturq.gob.mx/evento/xtaabay"), "a complete card never fetches");
  const [carnaval, xtaabay, sinEnlace] = candidates;
  assert.equal(carnaval.startAt, "2026-03-06T16:00:00-05:00", "detail JSON-LD filled the date");
  assert.equal(carnaval.description, "Comparsas y carros alegóricos.", "detail filled the description");
  assert.equal(carnaval.sourceUrl, "https://siturq.gob.mx/evento/carnaval");
  assert.equal(xtaabay.startAt, "2026-10-15", "complete card keeps its listing data untouched");
  assert.equal(sinEnlace.startAt, null, "dateless card without a link is still reported");
  assert.equal(sinEnlace.sourceUrl, SITUR_SOURCE.url, "no link → the page URL");
  for (const candidate of candidates) {
    assert.ok(!("__detailUrl" in candidate) && !("__municipality" in candidate), "internal bookkeeping stripped");
  }
});

test("collect: a failing detail page keeps the listing-level candidate instead of dropping it", async () => {
  const fetchImpl = async (url) => {
    if (url === SITUR_SOURCE.url) {
      return new Response(
        SITUR_CARD("Felipe Carrillo Puerto", { date: null, description: "", link: "https://siturq.gob.mx/evento/caido" }),
        { status: 200 },
      );
    }
    return new Response("down", { status: 503 });
  };
  const { candidates, detailFetches } = await collectCandidates([SITUR_SOURCE], fetchImpl);
  assert.equal(detailFetches, 0, "failed detail fetches do not consume successful ones");
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].startAt, null);
});

test("collect: the detail-fetch cap bounds total fetches per run", async () => {
  const cards = [1, 2, 3, 4]
    .map((i) =>
      SITUR_CARD("Felipe Carrillo Puerto", {
        date: null,
        description: "",
        link: `https://siturq.gob.mx/evento/e${i}`,
        title: `Evento ${i}`,
      }),
    )
    .join("");
  const fetches = [];
  const fetchImpl = async (url) => {
    fetches.push(url);
    if (url === SITUR_SOURCE.url) return new Response(cards, { status: 200 });
    return new Response(
      SITUR_CARD("Felipe Carrillo Puerto", { date: "01 noviembre 2026", description: "Detalle." }),
      { status: 200 },
    );
  };
  const { candidates, detailFetches } = await collectCandidates([SITUR_SOURCE], fetchImpl, { maxDetailFetches: 2 });
  assert.equal(detailFetches, 2);
  assert.equal(fetches.length, 3, "1 listing + 2 detail fetches — the cap holds");
  assert.equal(candidates.filter((c) => c.startAt === "2026-11-01").length, 2, "first two cards enriched in order");
  assert.equal(candidates.filter((c) => c.startAt === null).length, 2, "capped cards stay dateless, still reported");
});

test("collect: cards outside the Zona Maya are dropped with a count; unknown regions are kept", async () => {
  assert.equal(isInServiceRegion("Benito Juárez"), false);
  assert.equal(isInServiceRegion("COZUMEL"), false);
  assert.equal(isInServiceRegion("Bacalar"), false);
  assert.equal(isInServiceRegion("FELIPE CARRILLO PUERTO"), true, "case-insensitive");
  assert.equal(isInServiceRegion("José María Morelos"), true, "accent-insensitive");
  assert.equal(isInServiceRegion(null), true, "unknown region → kept, silence beats guesses");

  const html =
    SITUR_CARD("Benito Juárez", { title: "Maratón Cancún" }) +
    SITUR_CARD("COZUMEL", { title: "Fiesta Cozumel" }) +
    SITUR_CARD("FELIPE CARRILLO PUERTO", { title: "Feria FCP" }) +
    SITUR_CARD("José María Morelos", { title: "Feria JMM" }) +
    `<div class="card" data-aos="fade-up"><div class="card-body"><a href="https://siturq.gob.mx/evento/xyz"><h3 class="card-title">Evento sin municipio</h3></a><p class="card-text">Sin atributo.</p></div><div class="card-footer"><span class="date">05 noviembre 2026</span></div></div>`;
  const { candidates, regionDropped } = await collectCandidates([SITUR_SOURCE], async (url) =>
    url === SITUR_SOURCE.url ? new Response(html, { status: 200 }) : new Response("?", { status: 404 }),
  );
  assert.equal(regionDropped, 2, "Benito Juárez + Cozumel dropped");
  assert.deepEqual(
    candidates.map((c) => c.title.es),
    ["Feria FCP", "Feria JMM", "Evento sin municipio"],
  );
  assert.ok(candidates.every((c) => !("__municipality" in c)), "bookkeeping stripped from survivors");
});

// ---------------------------------------------------------------- dedupe

test("dedupe: fingerprints are normalization-insensitive but date- and source-sensitive", () => {
  const a = { sourceId: "s", title: { es: "Feria del Queso" }, startAt: "2026-11-02" };
  const same = { sourceId: "s", title: { es: "  feria DEL queso " }, startAt: "2026-11-02" };
  const accent = { sourceId: "s", title: { es: "Exposición" }, startAt: "2026-11-02" };
  const noAccent = { sourceId: "s", title: { es: "exposicion" }, startAt: "2026-11-02" };
  assert.equal(fingerprint(a), fingerprint(same));
  assert.equal(fingerprint(accent), fingerprint(noAccent));
  assert.notEqual(fingerprint(a), fingerprint({ ...a, startAt: "2026-11-03" }));
  assert.notEqual(fingerprint(a), fingerprint({ ...a, sourceId: "other" }));
});

test("dedupe: partition drops known and in-batch duplicates; updateSeen appends", () => {
  const seenOne = { sourceId: "s", title: { es: "Viejo" }, startAt: "2026-01-01" };
  const seen = updateSeen(emptySeen(), [{ ...seenOne, fingerprint: fingerprint(seenOne) }], "2026-10-01");
  const twin = { sourceId: "s", title: { es: "Nuevo" }, startAt: "2026-11-01" };
  const { fresh, knownCount } = partitionCandidates([seenOne, twin, twin], seen);
  assert.equal(fresh.length, 1, "known and in-batch twins collapse");
  assert.equal(knownCount, 2);
  const next = updateSeen(seen, fresh, "2026-10-12");
  assert.equal(next.fingerprints.length, 2);
  assert.equal(next.updated, "2026-10-12");
});

test("dedupe: parseSeen rejects corrupt files and foreign versions instead of restarting from zero", () => {
  assert.throws(() => parseSeen("not json"));
  assert.throws(() => parseSeen('{"version":1}'), /fingerprints/);
  assert.throws(() => parseSeen('{"version":99,"fingerprints":[]}'), /versión/);
  const ok = parseSeen('{"version":1,"updated":"2026-10-01","fingerprints":["abc"]}');
  assert.deepEqual(ok.fingerprints, ["abc"]);
});

// ---------------------------------------------------------------- format

test("format: discovery issues are ES-first, list every candidate and embed the review checklist", () => {
  const candidates = [
    {
      sourceId: "siturq-eventos",
      title: { es: "Feria del Queso", en: "Feria del Queso" },
      startAt: "2026-11-02T12:00:00-05:00",
      endAt: null,
      venue: { name: { es: "Parque Principal", en: "Parque Principal" } },
      sourceUrl: "https://siturq.gob.mx/evento/feria-del-queso",
      description: "",
      categoryGuess: "food",
    },
    {
      sourceId: "balam-nah",
      title: { es: "Noche de estrellas", en: "Noche de estrellas" },
      startAt: "2026-12-01T19:00:00-05:00",
      endAt: null,
      venue: null,
      sourceUrl: "https://balamnah.fcpqroo.mx",
      description: "",
      categoryGuess: "culture",
    },
  ];
  const { title, body } = formatDiscoveryIssue({ candidates, runDate: "2026-10-12" });
  assert.equal(title, discoveryIssueTitle(2, "2026-10-12"));
  assert.match(title, /2 candidatos/);
  assert.equal((body.match(/### \d\./g) ?? []).length, 2, "one section per candidate");
  assert.ok(body.includes("https://siturq.gob.mx/evento/feria-del-queso"));
  assert.ok(body.includes("EVENT_CHECKLIST.md"));
  assert.ok(body.includes("hora de Cancún (UTC-5)"));
  assert.ok(body.includes("Comida / Food (`food`)"));
  assert.ok(body.includes("feria-del-queso"), "suggested id slug embedded");
  assert.equal((body.match(/- \[ \]/g) ?? []).length >= 12, true, "checklist boxes per candidate");
  assert.throws(() => formatDiscoveryIssue({ candidates: [], runDate: "2026-10-12" }), /al menos un candidato/);
});

test("format: failure issues carry the error; slugs are accent-free and bounded", () => {
  const body = formatFailureIssueBody({ error: new Error("red"), runDate: "2026-10-12" });
  assert.match(body, /Error: red/);
  assert.match(body, /discovery-data/);
  assert.match(failureIssueTitle("2026-10-12"), /Falló/);
  assert.equal(suggestId("Exposición de Arte Maya!! 2026"), "exposicion-de-arte-maya-2026");
  assert.equal(suggestId("???"), "pendiente");
});

// ---------------------------------------------------------------- report

test("report: createIssue POSTs title/body/labels; ensureLabel creates the label only when missing", async () => {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push([opts.method ?? "GET", url]);
    if (url.endsWith(`/labels/${CANDIDATE_LABEL}`)) return jsonResponse({ name: CANDIDATE_LABEL });
    if (url.endsWith("/issues") && opts.method === "POST") {
      const body = JSON.parse(opts.body);
      assert.equal(body.title, "T");
      assert.deepEqual(body.labels, [CANDIDATE_LABEL]);
      return jsonResponse({ number: 9 }, 201);
    }
    return jsonResponse({});
  };
  await ensureLabel({ repo: "o/r", token: "t", name: CANDIDATE_LABEL }, fetchImpl);
  const issue = await createIssue({ repo: "o/r", token: "t", title: "T", body: "B", labels: [CANDIDATE_LABEL] }, fetchImpl);
  assert.equal(issue.number, 9);
  assert.equal(calls.filter(([m]) => m === "POST").length, 1, "label existed → no label POST");

  const created = [];
  await ensureLabel({ repo: "o/r", token: "t", name: CANDIDATE_LABEL }, async (url, opts = {}) => {
    if (url.includes(`/labels/${CANDIDATE_LABEL}`)) return new Response("{}", { status: 404 });
    created.push([url, JSON.parse(opts.body)]);
    return jsonResponse({}, 201);
  });
  assert.equal(created.length, 1);
  assert.ok(created[0][0].endsWith("/labels"));
  assert.equal(created[0][1].name, CANDIDATE_LABEL);
});

test("report: ensureFailureIssue comments on the open failure issue instead of duplicating it", async () => {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push([opts.method ?? "GET", url]);
    if (url.includes("/issues?state=open")) {
      return jsonResponse([{ number: 3, title: "[Eventos] Falló el descubrimiento diario — 2026-10-11" }]);
    }
    if (url.endsWith("/issues/3/comments")) return jsonResponse({}, 201);
    if (url.endsWith("/issues") && opts.method === "POST") return jsonResponse({ number: 4 }, 201);
    return jsonResponse({});
  };
  const result = await ensureFailureIssue({ repo: "o/r", token: "t", runDate: "2026-10-12", error: new Error("x") }, fetchImpl);
  assert.equal(result.number, 3);
  assert.ok(calls.some(([m, u]) => m === "POST" && u.endsWith("/issues/3/comments")));
  assert.ok(!calls.some(([m, u]) => m === "POST" && u.endsWith("/issues")), "no duplicate failure issue");

  const calls2 = [];
  const created = await ensureFailureIssue({ repo: "o/r", token: "t", runDate: "2026-10-12", error: new Error("x") }, async (url, opts = {}) => {
    calls2.push([opts.method ?? "GET", url]);
    if (url.includes("/issues?state=open")) return jsonResponse([]);
    if (url.endsWith("/issues") && opts.method === "POST") return jsonResponse({ number: 5 }, 201);
    return jsonResponse({});
  });
  assert.equal(created.number, 5, "no open failure issue → a new one is filed");
  assert.ok(calls2.some(([m, u]) => m === "POST" && u.endsWith("/issues")));
});

// ---------------------------------------------------------------- seen-store

test("seen-store: readSeen maps 404 to an empty store and decodes base64 content", async () => {
  const missing = await readSeen({ repo: "o/r", token: "t" }, async () => new Response("{}", { status: 404 }));
  assert.equal(missing.sha, null);
  assert.deepEqual(missing.seen, emptySeen());

  const payload = { version: 1, updated: "2026-10-01", fingerprints: ["abc"] };
  const present = await readSeen({ repo: "o/r", token: "t" }, async (url, opts) => {
    assert.match(url, new RegExp(`ref=${BRANCH}`));
    assert.ok(opts.headers.Authorization.includes("t"));
    return jsonResponse({ content: Buffer.from(serializeSeen(payload)).toString("base64"), sha: "shaxx" });
  });
  assert.equal(present.sha, "shaxx");
  assert.deepEqual(present.seen, payload);
});

test("seen-store: ensureBranch builds an ORPHAN commit with only seen.json (main never copied)", async () => {
  const posts = [];
  const fetchImpl = async (url, opts = {}) => {
    const body = JSON.parse(opts.body);
    posts.push([url.replace("https://api.github.com/repos/o/r", ""), body]);
    if (url.endsWith("/git/blobs")) return jsonResponse({ sha: "blobSha" }, 201);
    if (url.endsWith("/git/trees")) return jsonResponse({ sha: "treeSha" }, 201);
    if (url.endsWith("/git/commits")) return jsonResponse({ sha: "commitSha" }, 201);
    if (url.endsWith("/git/refs")) return jsonResponse({}, 201);
    throw new Error(url);
  };
  await ensureBranch({ repo: "o/r", token: "t", initialSeen: emptySeen() }, fetchImpl);
  const [blobs, trees, commits, refs] = posts;
  assert.deepEqual(commits[1].parents, [], "orphan commit: no parent, so no main history");
  assert.equal(trees[1].tree.length, 1);
  assert.equal(trees[1].tree[0].path, "seen.json");
  assert.equal(refs[1].ref, `refs/heads/${BRANCH}`);
});

test("seen-store: writeSeen PUTs to the discovery-data branch and only sends a sha when updating", async () => {
  const puts = [];
  const fetchImpl = async (url, opts = {}) => {
    puts.push(JSON.parse(opts.body));
    return jsonResponse({ commit: { sha: "c" } });
  };
  const seen = { version: 1, updated: "2026-10-12", fingerprints: ["x"] };
  await writeSeen({ repo: "o/r", token: "t", seen, sha: "old", message: "m" }, fetchImpl);
  await writeSeen({ repo: "o/r", token: "t", seen, message: "m" }, fetchImpl);
  assert.equal(puts[0].branch, BRANCH);
  assert.equal(puts[0].sha, "old");
  assert.ok(!("sha" in puts[1]), "create call omits sha");
  assert.deepEqual(JSON.parse(Buffer.from(puts[0].content, "base64").toString("utf8")), seen);
});

// ---------------------------------------------------------------- discover.run

function mockGitHub({ pageHtml, seenText = null, seenSha = null }) {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    const method = opts.method ?? "GET";
    calls.push([method, url, opts.body ? JSON.parse(opts.body) : undefined]);
    if (url === "https://siturq.gob.mx/eventos" || url === "https://balamnah.fcpqroo.mx") {
      return new Response(pageHtml, { status: 200 });
    }
    if (url.includes(`/contents/seen.json`) && method === "GET") {
      if (seenText === null) return new Response("{}", { status: 404 });
      return jsonResponse({ content: Buffer.from(seenText).toString("base64"), sha: seenSha });
    }
    if (url.endsWith(`/labels/${CANDIDATE_LABEL}`) || url.endsWith(`/labels/${FAILURE_LABEL}`)) return jsonResponse({});
    if (url.endsWith("/issues") && method === "POST") return jsonResponse({ number: 7 }, 201);
    if (url.includes("/issues?state=open")) return jsonResponse([]);
    if (url.endsWith("/git/blobs")) return jsonResponse({ sha: "b" }, 201);
    if (url.endsWith("/git/trees")) return jsonResponse({ sha: "t" }, 201);
    if (url.endsWith("/git/commits")) return jsonResponse({ sha: "c" }, 201);
    if (url.endsWith("/git/refs")) return jsonResponse({}, 201);
    if (url.includes("/contents/seen.json") && method === "PUT") return jsonResponse({ commit: { sha: "x" } });
    throw new Error(`unmocked: ${method} ${url}`);
  };
  return { calls, fetchImpl };
}

test("discover: fresh candidates → green, ONE issue, seen.json committed to discovery-data", async () => {
  const { calls, fetchImpl } = mockGitHub({ pageHtml: EVENT_BLOCK });
  const code = await run({ repo: "o/r", token: "t", fetchImpl, log: () => {} });
  assert.equal(code, 0);
  const issueCalls = calls.filter(([m, u]) => m === "POST" && u.endsWith("/issues"));
  assert.equal(issueCalls.length, 1);
  assert.deepEqual(issueCalls[0][2].labels, [CANDIDATE_LABEL]);
  assert.match(issueCalls[0][2].body, /Feria del Queso/);
  const put = calls.find(([m, u]) => m === "PUT" && u.includes("/contents/seen.json"));
  assert.ok(put, "seen.json was committed");
  assert.equal(put[2].branch, BRANCH);
  const saved = JSON.parse(Buffer.from(put[2].content, "base64").toString("utf8"));
  assert.equal(saved.fingerprints.length, 2, "both enabled sources found the same event once each");
});

test("discover: zero candidates → green, silent — no issue, no commit", async () => {
  const { calls, fetchImpl } = mockGitHub({ pageHtml: "<html><body>sin eventos</body></html>" });
  const code = await run({ repo: "o/r", token: "t", fetchImpl, log: () => {} });
  assert.equal(code, 0);
  assert.ok(!calls.some(([m, u]) => m === "POST" && u.endsWith("/issues")), "no issue filed");
  assert.ok(!calls.some(([m, u]) => m === "PUT" && u.includes("/contents/seen.json")), "seen.json untouched");
});

test("discover: already-seen candidates are not re-reported", async () => {
  const all = [
    ...extractEventsFromHtml(EVENT_BLOCK, { id: "siturq-eventos", url: "https://siturq.gob.mx/eventos" }),
    ...extractEventsFromHtml(EVENT_BLOCK, { id: "balam-nah", url: "https://balamnah.fcpqroo.mx" }),
  ];
  const seen = updateSeen(emptySeen(), all.map((candidate) => ({ ...candidate, fingerprint: fingerprint(candidate) })), "2026-10-01");
  const { calls, fetchImpl } = mockGitHub({ pageHtml: EVENT_BLOCK, seenText: serializeSeen(seen), seenSha: "s1" });
  const code = await run({ repo: "o/r", token: "t", fetchImpl, log: () => {} });
  assert.equal(code, 0);
  assert.ok(!calls.some(([m, u]) => m === "POST" && u.endsWith("/issues")));
});

test("discover: any failure → red exit AND a failure issue", async () => {
  const { calls, fetchImpl } = mockGitHub({ pageHtml: "<html></html>", seenText: "not json at all", seenSha: "s" });
  const code = await run({ repo: "o/r", token: "t", fetchImpl, log: () => {} });
  assert.equal(code, 1, "red run");
  const failure = calls.find(([m, u, body]) => m === "POST" && u.endsWith("/issues") && body.labels.includes(FAILURE_LABEL));
  assert.ok(failure, "failure issue filed");
});

test("discover: all sources down → red even though zero candidates were extracted", async () => {
  const { calls, fetchImpl } = mockGitHub({ pageHtml: "" });
  const failing = async (url, opts) => {
    if (url.startsWith("https://siturq.gob.mx") || url.startsWith("https://balamnah")) {
      return new Response("down", { status: 503 });
    }
    return fetchImpl(url, opts);
  };
  const code = await run({ repo: "o/r", token: "t", fetchImpl: failing, log: () => {} });
  assert.equal(code, 1, "red run");
  const failure = calls.find(([m, u, body]) => m === "POST" && u.endsWith("/issues") && body.labels.includes(FAILURE_LABEL));
  assert.ok(failure, "failure issue filed");
});

// ---------------------------------------------------------------- wiring

test("sources registry: only enabled sources run, and every source has an id and http(s) URL", () => {
  for (const source of SOURCES) {
    assert.match(source.id, /^[a-z0-9-]+$/);
    assert.match(source.url, /^https:\/\//);
  }
  assert.ok(enabledSources().every((source) => source.enabled));
  assert.ok(enabledSources().length < SOURCES.length, "at least one source is a documented manual-check entry");
});

test("workflow: cron 13:00 UTC, contents+issues write, discovery-data branch, no Formspree", () => {
  const workflow = read("../.github/workflows/event-discovery.yml");
  assert.match(workflow, /cron:\s*["']0 13 \* \* \*["']/);
  assert.match(workflow, /contents:\s*write/);
  assert.match(workflow, /issues:\s*write/);
  assert.ok(workflow.includes("scripts/event-discovery/discover.mjs"));
  assert.ok(workflow.includes(BRANCH));
  assert.doesNotMatch(workflow, /formspree/i, "delivery is GitHub Issues, not Formspree");
  assert.doesNotMatch(workflow, /git push.*main/, "the workflow never pushes main");
});

test("pipeline modules never reference main or Formspree", () => {
  for (const file of ["sources.mjs", "extract.mjs", "dedupe.mjs", "format.mjs", "report.mjs", "seen-store.mjs", "discover.mjs"]) {
    const source = read(`../scripts/event-discovery/${file}`);
    assert.doesNotMatch(source, /formspree/i, `${file} must not route through Formspree`);
  }
  assert.ok(existsSync(new URL("../scripts/event-discovery/discover.mjs", import.meta.url)));
});

test("EVENT_CHECKLIST.md exists at the repo root and covers the editorial gates", () => {
  assert.ok(existsSync(new URL("../EVENT_CHECKLIST.md", import.meta.url)), "checklist lives at the repo root");
  const checklist = read("../EVENT_CHECKLIST.md");
  for (const expected of ["app/events.mjs", "UTC-5", "sourceUrl", "npm test", "npm run build", "Revisión", "Review"]) {
    assert.ok(checklist.includes(expected), `EVENT_CHECKLIST.md must mention ${expected}`);
  }
});
