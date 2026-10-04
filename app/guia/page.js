// app/guia/page.js — "Guía del Viajero / Visitor's Guide" page for fcpqroo.mx
// Create the folder app/guia/ and paste this as page.js, then:
//   npm run build   (the static export will include /guia/index.html)
// Optional: add a link from the homepage header (see note at the bottom).

const guideData = {
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  name: "Guía del Viajero — Felipe Carrillo Puerto 2026",
  description:
    "Guía del visitante para Felipe Carrillo Puerto, Quintana Roo: cómo llegar, qué hacer y esenciales prácticos. Visitor's guide to Felipe Carrillo Puerto.",
  touristType: ["es-MX", "en-US"],
};

const h2 = { marginTop: "2rem", fontSize: "1.3rem" };
const h3 = { marginTop: "1.4rem", fontSize: "1.05rem" };
const note = { background: "#faf3e7", padding: "0.8rem 1rem", borderRadius: "8px" };
const li = { marginBottom: "0.4rem" };

export const metadata = {
  title: "Guía del Viajero 2026 — Felipe Carrillo Puerto",
  description:
    "Cómo llegar, qué hacer y esenciales prácticos para visitar Felipe Carrillo Puerto y la Zona Maya de Quintana Roo. Getting there, what to do, and practical essentials.",
};

export default function Guia() {
  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "1.5rem 1rem 4rem", lineHeight: 1.65 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideData).replace(/</g, "\\u003c") }}
      />

      <p>
        <a href="/">← Volver al mapa / Back to the map</a>
      </p>

      <h1 style={{ fontSize: "1.7rem", lineHeight: 1.3 }}>
        Felipe Carrillo Puerto — Guía del Viajero 2026
        <br />
        <span style={{ fontSize: "1.05rem", fontWeight: 400 }}>
          Felipe Carrillo Puerto — Visitor&apos;s Guide 2026
        </span>
      </h1>

      <div style={note}>
        📌 Guía para viajeros que ya están en México: cómo llegar, qué hacer y lo esencial
        (dinero, teléfono, seguridad, salud). For travelers already in Mexico: getting there,
        what to do, and the practical essentials.
      </div>

      <h2 style={h2}>¿Por qué visitar? / Why visit?</h2>
      <p>
        Felipe Carrillo Puerto (~80,000 hab.) es la capital cultural de la Zona Maya: un pueblo
        maya vivo, no un resort. Fue capital de la nación maya independiente durante la Guerra de
        Castas y sigue siendo una de las comunidades de más fuerte identidad maya de México — el
        maya yucateco se habla a diario en hogares y mercados junto al español. Ven por Sian
        Ka&apos;an sin las multitudes de Tulum, el ecoturismo comunitario, la comida regional a
        precio local y una ventana a la cultura maya viva. Es también estación del Tren Maya, un
        traslado fácil entre Tulum y Bacalar/Chetumal. / Felipe Carrillo Puerto is the cultural
        capital of the Zona Maya — a living Maya town, not a resort, and an easy Tren Maya stop
        between Tulum and Bacalar/Chetumal.
      </p>
      <p>
        <em>
          Espéralo así: una ciudad provincial tranquila — sin clubes de playa, sin cadenas
          hoteleras, pocos hablantes de inglés. Ese es el punto. / Expect a modest, working
          provincial town — that&apos;s the point.
        </em>
      </p>

      <h2 style={h2}>Cómo llegar / Getting there</h2>
      <h3 style={h3}>Tren Maya (recomendado)</h3>
      <ul>
        <li style={li}>Estación completa en el Tramo 6 (Tulum–Chetumal) con servicios de turismo Maya Ka&apos;an.</li>
        <li style={li}>Desde Tulum: ~1 h. Desde Cancún: ~3.5 h. Hacia Bacalar ~45 min y Chetumal ~1 h.</li>
        <li style={li}>Boletos y horarios en la app oficial del Tren Maya; reserva con anticipación los fines de semana. / Tickets via the official Tren Maya app; book ahead on weekends.</li>
      </ul>
      <h3 style={h3}>ADO y colectivos</h3>
      <ul>
        <li style={li}>Terminal ADO en el centro: Tulum ~1 h, Playa del Carmen ~2 h, Cancún ~3.5–4 h, Chetumal/Bacalar ~1.5–2 h. Boletos en la app ADO.</li>
        <li style={li}>Colectivos a Tulum (~MXN 60–80) desde las salidas junto a la terminal; pregunta por &quot;Carrillo&quot;. / Colectivos to Tulum from stands near the terminal; ask for &quot;Carrillo&quot;.</li>
        <li style={li}>En auto: carretera 307 al sur de Tulum (~55 km); topes frecuentes. Maneja solo de día. / By car: Hwy 307 south from Tulum (~55 km); daytime driving only.</li>
      </ul>

      <h2 style={h2}>Qué hacer / What to do</h2>
      <h3 style={h3}>En el centro / In town</h3>
      <ul>
        <li style={li}><strong>Santuario de la Cruz Parlante</strong> — corazón espiritual de la Guerra de Castas; sitio de peregrinación activo. Vístete con modestia, pide permiso para fotos, sin sombrero ni calzado al entrar. / Active pilgrimage site: dress modestly, no hats or shoes inside, ask before photographing.</li>
        <li style={li}><strong>Museo de la Ciudad</strong> y <strong>Casa de la Cultura</strong> (Plaza Cívica) — historia local, galerías y la tienda de artesanías mayas Kábo&apos;ob Ku Meyajo&apos;ob. / City Museum and House of Culture on the plaza, with the Maya artisan shop.</li>
        <li style={li}><strong>Iglesia de la Santa Cruz</strong> y <strong>Pila de los Azotes</strong> — circuito del centro histórico. / Historic-center circuit.</li>
        <li style={li}><strong>Mercado municipal</strong> — cochinita pibil, panuchos, salbutes, kibi y aguas frescas. / The market: Yucatecan food at its best.</li>
      </ul>
      <h3 style={h3}>Naturaleza y comunidades / Nature &amp; communities</h3>
      <ul>
        <li style={li}><strong>Muyil (Chunyaxché)</strong> (~30 min): zona arqueológica en la selva + camino de maderas + <strong>flotador por el canal Maya</strong> en Laguna Muyil, operado por guías comunitarios (2–3 h). Ve temprano. / Ruins + boardwalk + the famous Maya-canal float with community guides; go early.</li>
        <li style={li}><strong>Reserva Much Kanan K&apos;áax / Síijil Noh Ha</strong> (~10 km): cabañas rústicas, kayak, temazcal y comida casera; reserva por WhatsApp. / Community reserve: cabins, kayaking, temazcal, home cooking.</li>
        <li style={li}><strong>Tihosuco</strong> (~1 h): Museo de la Guerra de Castas, templo colonial con mural y talleres de artesanía. / Caste War Museum, colonial church mural, artisan workshops.</li>
        <li style={li}><strong>Cueva de las Serpientes Colgantes, Kantemó</strong>: al atardecer, murciélagos y culebras en pleno vuelo; tour comunitario. / Dusk bat flight and hunting snakes; community tour on a dirt road.</li>
        <li style={li}><strong>Chunhuhub</strong>: &quot;Secretos de la Cocina Maya&quot; — maíz, pib y tortillas a mano con mujeres mayas locales. / Maya cooking tour: corn, earth oven, hand-made tortillas.</li>
        <li style={li}><strong>Cenotes y lagunas de la Zona Maya</strong>: pregunta en el módulo de turismo o consulta el mapa de fcpqroo.mx; algunos son de cuota comunitaria, solo efectivo. / Cenotes and lagoons: ask at the tourism kiosk or check the fcpqroo.mx map; community fees, cash only.</li>
      </ul>

      <h2 style={h2}>Esenciales prácticos / Practical essentials</h2>
      <ul>
        <li style={li}><strong>Dinero / Money:</strong> usa cajeros dentro de bancos; al preguntarte &quot;¿Acepta la conversión?&quot; siempre di que no. Efectivo para mercado, colectivos, cuotas comunitarias y cenotes — lleva billetes chicos (50/100/200). / Use indoor bank ATMs, decline conversion, carry small bills — cash is king.</li>
        <li style={li}><strong>Teléfono / Phone:</strong> Telcel funciona bien en el pueblo, mal en la reserva. Descarga el <strong>mapa sin conexión de fcpqroo.mx</strong> antes de salir. / Download the site&apos;s offline map before heading into the reserve.</li>
        <li style={li}><strong>Idioma / Language:</strong> el maya se habla tanto como el español; el inglés es raro. &quot;Ma&apos;aloob&quot; (bien) y &quot;Bix a beel?&quot; (¿cómo estás?) abren puertas. / A few Maya words open doors; English is rare.</li>
        <li style={li}><strong>Seguridad / Safety:</strong> pueblo tranquilo y familiar; taxis de sitio de noche, no manejes de noche en caminos rurales. / Quiet town; use sitio taxis at night; no night driving on rural roads.</li>
        <li style={li}><strong>Salud / Health:</strong> dengue presente en el interior — repelente mañana y tarde; agua embotellada; seguro con evacuación (los centros de referencia son Chetumal y Cancún). / Repellent for dengue, bottled water, evacuation insurance.</li>
        <li style={li}><strong>Comida / Food:</strong> el mercado es la joya; el <strong>lechón</strong> de fin de semana es famoso en la región — sigue el humo y la fila local. / Weekend lechón is famous — follow the smoke and the local line.</li>
        <li style={li}><strong>Etiqueta / Etiquette:</strong> saluda antes de preguntar (&quot;Buenos días&quot;), viste con modestia, pide permiso para fotos de personas o ceremonias, paga con gusto las cuotas comunitarias. / Greet first, dress modestly, ask before photos, pay community fees gladly.</li>
      </ul>

      <h2 style={h2}>Itinerario sugerido de 2 días / Suggested 2-day itinerary</h2>
      <p>
        <strong>Día 1:</strong> llega en Tren Maya al mediodía; comida corrida en la plaza, Museo
        de la Ciudad + Casa de la Cultura + mercado; tarde en Síijil Noh Ha (kayak y cena con
        familia local, con reserva); lechón si es fin de semana. / Arrive by train, town
        cultural circuit, then Much Kanan K&apos;áax in the late afternoon.
      </p>
      <p>
        <strong>Día 2:</strong> Muyil temprano (7:30): ruinas + flotador del canal con guías
        comunitarios (de vuelta al mediodía); comida en FCP; cenote o Santuario por la tarde;
        Tren Maya de tarde hacia Bacalar/Chetumal o de vuelta a Tulum. / Early Muyil ruins +
        canal float, lunch in town, optional cenote, afternoon train onward.
      </p>

      <h2 style={h2}>Referencia rápida / Quick reference</h2>
      <ul>
        <li style={li}><strong>Mapa:</strong> fcpqroo.mx — guarda el mapa sin conexión antes de entrar a la reserva / save the offline map</li>
        <li style={li}><strong>Zona horaria:</strong> Quintana Roo (Este, sin horario de verano) / Eastern, no DST</li>
        <li style={li}><strong>Mejores meses:</strong> nov–abr; 3 de mayo (Santa Cruz) para la peregrinación grande / Nov–Apr; May 3 pilgrimage</li>
        <li style={li}><strong>Efectivo sugerido:</strong> MXN 1,500–2,000 en billetes chicos para 2 días / small-bill cash buffer for 2 days</li>
        <li style={li}><strong>Emergencias:</strong> 911</li>
      </ul>

      <p style={{ marginTop: "3rem", fontSize: "0.85rem", opacity: 0.7 }}>
        Guía 2026 elaborada con el mapa local oficial de fcpqroo.mx y el programa de turismo
        comunitario Maya Ka&apos;an. Verifica horarios y tarifas antes de viajar. / Built from the
        official fcpqroo.mx local map and the Maya Ka&apos;an community tourism program; verify
        schedules and fares before traveling.
      </p>

      {/*
        OPCIONAL — enlaza esta guía desde la cabecera del mapa:
        en app/highway-map.js (o donde renderices el encabezado), añade:
          <a href="/guia">Guía del viajero / Visitor's guide</a>
      */}
    </main>
  );
}