# EVENT_CHECKLIST.md — Revisión de eventos / Event Review

Cómo convertir un candidato (issue de `event-discovery`, aviso manual, sugerencia
del formulario) en un evento publicado. Nada se publica sin pasar por estas
puertas / How a candidate becomes a published event — nothing ships without
passing every gate.

## 1. Verificación / Verification

- [ ] La fecha, la hora y la sede se confirman en la **fuente original** (el
      `sourceUrl` del candidato), no en un captura ni un reenvío.
- [ ] Las horas se interpretan en **hora de Cancún (UTC-5, sin horario de
      verano)**. Una hora mal convertida es el error más común.
- [ ] La sede existe en el directorio → usa `venue.placeId` (las coordenadas
      ya salen del lugar). Si no existe: `venue.name` bilingüe, con
      `latitude`/`longitude` solo si fueron confirmadas en el mapa.
- [ ] **No duplica** un evento ya publicado en `app/events.mjs` (mismo evento,
      otra fuente). Si es la misma fecha re-programada, actualiza el existente.
- [ ] Eventos del Ayuntamiento de FCP y otros Facebook sin espejo público se
      revisan **a mano** — el pipeline no puede leerlos (muro de login).

## 2. Redacción bilingüe / Bilingual copy

- [ ] `title` y `description` redactados (o verificados) en **ES y EN**. El EN
      copiado del ES sin traducir cuenta como pendiente.
- [ ] `category` es una categoría real del directorio (`app/place-index.mjs`),
      nunca `"all"`. La categoría sugerida por el pipeline es solo un arranque.
- [ ] `cost` bilingüe cuando aplica ("Entrada libre / Free entry").

## 3. Publicación / Publishing

- [ ] El registro en `app/events.mjs` lleva `sourceUrl`, `status` (empieza en
      `"unverified"`) y `lastUpdated` con la fecha de la verificación.
- [ ] `contactNote` solo si contactamos a alguien — es interno, jamás se
      renderiza.
- [ ] Nada de `promoted: true`: la promoción es un upsell pagado, nunca
      automático, y está topeada en 3 (`MAX_PROMOTED`).

## 4. Antes de hacer push / Before pushing

- [ ] `npm test` verde — incluye la higiene de datos: todo evento publicado
      debe seguir **en el futuro** (o extenderse).
- [ ] `npm run build` verde.
- [ ] El evento aparece en `/eventos`, en la franja comunitaria y (si tiene
      sede con coordenadas) como marcador en el mapa.

## Pipeline automático / Automated discovery

El workflow `.github/workflows/event-discovery.yml` corre a las 08:00 (hora de
Cancún): escanea las fuentes de `scripts/event-discovery/sources.mjs`, abre un
issue solo cuando hay candidatos nuevos y guarda lo ya visto en `seen.json` en
la rama `discovery-data`. Cero candidatos = corrida verde y silenciosa. Fallos
= corrida roja + issue con el label `eventos-fallo`. Revisar los candidatos en
orden de llegada y cerrar el issue cuando todos queden publicados o descartados.
