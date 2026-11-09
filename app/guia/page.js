// app/guia/page.js — "Guía del Viajero / Visitor's Guide" page for fcpqroo.mx
//
// Bilingual by design ("el español guía"): every copy block renders Spanish
// as the primary text and English as a clearly secondary, muted span
// (.guide-es / .guide-en). Identical proper nouns render once, outside the
// language spans. Place mentions deep-link into the map (/?lugar=<place-id>).

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

// Structured bilingual spans: ES primary, EN secondary.
const Es = ({ children }) => <span className="guide-es" lang="es">{children}</span>;
const En = ({ children }) => <span className="guide-en" lang="en">{children}</span>;

// Place deep link into the homepage map (/?lugar=<place-id> selects and
// focuses the place). Records without a place stay plain text.
const placeLink = (id, label) => <a href={`/?lugar=${id}`}>{label}</a>;

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
        <Es>Felipe Carrillo Puerto — Guía del Viajero 2026</Es>{" "}
        <span className="guide-en" lang="en" style={{ fontSize: "0.62em", fontWeight: 400 }}>
          Felipe Carrillo Puerto — Visitor&apos;s Guide 2026
        </span>
      </h1>

      <div style={note}>
        <p style={{ margin: 0 }}>
          <Es>📌 Guía para viajeros que ya están en México: cómo llegar, qué hacer y lo esencial
          (dinero, teléfono, seguridad, salud).</Es>{" "}
          <En>For travelers already in Mexico: getting there, what to do, and the practical
          essentials.</En>
        </p>
      </div>

      <h2 style={h2}>
        <Es>¿Por qué visitar?</Es> <En>Why visit?</En>
      </h2>
      <p>
        <Es>Felipe Carrillo Puerto (~80,000 hab.) es la capital cultural de la Zona Maya: un pueblo
        maya vivo, no un resort. Fue capital de la nación maya independiente durante la Guerra de
        Castas y sigue siendo una de las comunidades de más fuerte identidad maya de México — el
        maya yucateco se habla a diario en hogares y mercados junto al español. Ven por Sian
        Ka&apos;an sin las multitudes de Tulum, el ecoturismo comunitario, la comida regional a
        precio local y una ventana a la cultura maya viva. Es también estación del Tren Maya, un
        traslado fácil entre Tulum y Bacalar/Chetumal.</Es>{" "}
        <En>It is the cultural capital of the Zona Maya — a living Maya town, not a resort, and an
        easy Tren Maya stop between Tulum and Bacalar/Chetumal.</En>
      </p>
      <p>
        <em>
          <Es>Espéralo así: una ciudad provincial tranquila — sin clubes de playa, sin cadenas
          hoteleras, pocos hablantes de inglés. Ese es el punto.</Es>{" "}
          <En>Expect a modest, working provincial town — that&apos;s the point.</En>
        </em>
      </p>

      <h2 style={h2}>
        <Es>Cómo llegar</Es> <En>Getting there</En>
      </h2>
      <h3 style={h3}>
        <Es>Tren Maya (recomendado)</Es> <En>Tren Maya (recommended)</En>
      </h3>
      <ul>
        <li style={li}>
          <Es>Estación completa en el Tramo 6 (Tulum–Chetumal) con servicios de turismo Maya
          Ka&apos;an.</Es>
        </li>
        <li style={li}>
          <Es>Desde Tulum: ~1 h. Desde Cancún: ~3.5 h. Hacia Bacalar ~45 min y Chetumal ~1
          h.</Es>
        </li>
        <li style={li}>
          <Es>Boletos y horarios en la app oficial del Tren Maya; reserva con anticipación los
          fines de semana.</Es>{" "}
          <En>Tickets via the official Tren Maya app; book ahead on weekends.</En>
        </li>
      </ul>
      <h3 style={h3}>ADO y colectivos</h3>
      <ul>
        <li style={li}>
          <Es>Terminal ADO en el centro: Tulum ~1 h, Playa del Carmen ~2 h, Cancún ~3.5–4 h,
          Chetumal/Bacalar ~1.5–2 h. Boletos en la app ADO.</Es>
        </li>
        <li style={li}>
          <Es>Colectivos a Tulum (~MXN 60–80) desde las salidas junto a la terminal; pregunta por
          &quot;Carrillo&quot;.</Es>{" "}
          <En>Colectivos to Tulum from stands near the terminal; ask for &quot;Carrillo&quot;.</En>
        </li>
        <li style={li}>
          <Es>En auto: carretera 307 al sur de Tulum (~55 km); topes frecuentes. Maneja solo de
          día.</Es> <En>By car: Hwy 307 south from Tulum (~55 km); daytime driving only.</En>
        </li>
      </ul>

      <h2 style={h2}>
        <Es>Qué hacer</Es> <En>What to do</En>
      </h2>
      <h3 style={h3}>
        <Es>En el centro</Es> <En>In town</En>
      </h3>
      <ul>
        <li style={li}>
          <strong>Santuario de la Cruz Parlante</strong> —{" "}
          <Es>corazón espiritual de la Guerra de Castas; sitio de peregrinación activo. Vístete con
          modestia, pide permiso para fotos, sin sombrero ni calzado al entrar.</Es>{" "}
          <En>Active pilgrimage site: dress modestly, no hats or shoes inside, ask before
          photographing.</En>
        </li>
        <li style={li}>
          <strong>Museo de la Ciudad</strong> y <strong>Casa de la Cultura</strong> (Plaza Cívica) —{" "}
          <Es>historia local, galerías y la tienda de artesanías mayas Kábo&apos;ob Ku
          Meyajo&apos;ob.</Es>{" "}
          <En>City history, galleries and the Maya artisan shop on the plaza.</En>
        </li>
        <li style={li}>
          <strong>Iglesia de la Santa Cruz</strong> y <strong>Pila de los Azotes</strong> —{" "}
          <Es>circuito del centro histórico.</Es> <En>Historic-center circuit.</En>
        </li>
        <li style={li}>
          <strong>{placeLink("mercado-felipe-carrillo-puerto", "Mercado municipal")}</strong> —{" "}
          <Es>cochinita pibil, panuchos, salbutes, kibi y aguas frescas.</Es>{" "}
          <En>Yucatecan food at its best.</En>
        </li>
        <li style={li}>
          <strong>{placeLink("el-tekaxeno-mercado-fcp", "El Tekaxeño")}</strong> (interior del
          Mercado Público):{" "}
          <Es>cocina yucateca casera — queso relleno, cochinita pibil, salbutes y más; por orden o
          media orden, hasta las 4 pm.</Es>{" "}
          <En>Home-style Yucatecan kitchen inside the Public Market; full or half portions until 4
          PM.</En>
        </li>
        <li style={li}>
          <strong>{placeLink("restaurante-epico", "Restaurante Épico")}</strong> (Col. Francisco
          May): <Es>platillos para compartir, terraza y ambiente local.</Es>{" "}
          <En>Small plates, terrace and a local atmosphere.</En>
        </li>
      </ul>
      <figure className="guide-figure">
        <img
          src="/img/guia/el-tekaxeno.webp"
          alt="La cocina de El Tekaxeño en el Mercado Público de Felipe Carrillo Puerto / El Tekaxeño's home-style kitchen in the Public Market"
          width={1200}
          height={892}
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <Es>Cocina yucateca casera en el Mercado Público.</Es>{" "}
          <En>Home-style Yucatecan cooking at the Public Market.</En>
        </figcaption>
      </figure>
      <h3 style={h3}>
        <Es>Naturaleza y comunidades</Es> <En>Nature &amp; communities</En>
      </h3>
      <ul>
        <li style={li}>
          <strong>Muyil (Chunyaxché)</strong> (~30 min):{" "}
          <Es>zona arqueológica en la selva + camino de maderas + flotador por el canal Maya en
          Laguna Muyil, operado por guías comunitarios (2–3 h). Ve temprano.</Es>{" "}
          <En>Jungle ruins + boardwalk + the famous Maya-canal float with community guides; go
          early.</En>
        </li>
        <li style={li}>
          <strong>Reserva Much Kanan K&apos;áax / Síijil Noh Ha</strong> (~10 km):{" "}
          <Es>cabañas rústicas, kayak, temazcal y comida casera; reserva por WhatsApp.</Es>{" "}
          <En>Community reserve: cabins, kayaking, temazcal, home cooking.</En>
        </li>
        <li style={li}>
          <strong>{placeLink("selva-morena", "Selva Morena")}</strong> (~20 min del centro):{" "}
          <Es>cabañas con jacuzzi, temazcal, ceremonia de cacao y restaurante orgánico.</Es>{" "}
          <En>Contemporary Maya-style cabins with jacuzzi, temazcal, cacao ceremony and organic
          restaurant.</En>
        </li>
        <li style={li}>
          <strong>Tihosuco</strong> (~1 h):{" "}
          <Es>Museo de la Guerra de Castas, templo colonial con mural y talleres de
          artesanía.</Es>{" "}
          <En>Caste War Museum, colonial church mural, artisan workshops.</En>
        </li>
        <li style={li}>
          <strong>Cueva de las Serpientes Colgantes, Kantemó</strong>:{" "}
          <Es>al atardecer, murciélagos y culebras en pleno vuelo; tour comunitario.</Es>{" "}
          <En>Dusk bat flight and hunting snakes; community tour on a dirt road.</En>
        </li>
        <li style={li}>
          <strong>{placeLink("casa-saastal", "Casa Sáastal")}</strong> (Col. Francisco May):{" "}
          <Es>recorridos educativos dedicados a las abejas nativas sin aguijón, con apoyo de
          CONANP — ideal para familias; cita previa por WhatsApp.</Es>{" "}
          <En>Hands-on tours dedicated to native stingless bees (CONANP-supported), great for
          families; by appointment.</En>
        </li>
        <li style={li}>
          <strong>Cenotes y lagunas de la Zona Maya</strong>:{" "}
          <Es>pregunta en el módulo de turismo o consulta el mapa de fcpqroo.mx; algunos son de
          cuota comunitaria, solo efectivo.</Es>{" "}
          <En>Ask at the tourism kiosk or check the fcpqroo.mx map; community fees, cash
          only.</En>
        </li>
      </ul>

      <h2 style={h2}>
        <Es>Dónde dormir</Es> <En>Where to stay</En>
      </h2>
      <ul>
        <li style={li}>
          <strong>{placeLink("hotel-tihosuco-colonial", "Hotel Tihosuco Colonial")}</strong>{" "}
          (Tihosuco, ~1 h):{" "}
          <Es>alberca, restaurante tradicional y habitaciones familiares — la base ideal para la
          ruta de la Guerra de Castas; reserva por{" "}
          <a
            href="https://www.booking.com/hotel/mx/tihosuco-colonial.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Booking.com
          </a>
          .</Es>{" "}
          <En>Pool, traditional restaurant and family rooms — the perfect base for the Caste War
          route; book via Booking.com.</En>
        </li>
        <li style={li}>
          <strong>Selva Morena</strong> (~20 min):{" "}
          <Es>cabañas con jacuzzi, temazcal y cacao — bienestar en la selva; reserva por{" "}
          <a
            href="https://selvamorenareserva.wixsite.com/selva-morena"
            target="_blank"
            rel="noopener noreferrer"
          >
            su sitio web
          </a>{" "}
          o Booking.</Es>{" "}
          <En>Cabins with jacuzzi, temazcal and cacao — book via their website or Booking.</En>
        </li>
        <li style={li}>
          <strong>Reserva Much Kanan K&apos;áax</strong>:{" "}
          <Es>cabañas rústicas dentro de la reserva.</Es>{" "}
          <En>Rustic cabins inside the community reserve itself.</En>
        </li>
      </ul>

      <h2 style={h2}>
        <Es>Cuándo ir</Es> <En>When to come</En>
      </h2>
      <p>
        <Es>Temporada alta de noviembre a abril — y agenda cultural todo el año. Consulta los{" "}
        <a href="/eventos">próximos eventos</a>: el Festival de la Xtáabay (octubre), las veladas
        de Día de Muertos en el museo (finales de octubre), el Festival de Cultura del Caribe con
        Belice (noviembre) y la gran feria de la Santa Cruz (23 de abril–3 de mayo).</Es>{" "}
        <En>High season is November–April, with a full cultural calendar year-round — see the
        events board for the Xtabay Festival (October), Día de Muertos evenings (late October),
        the Caribbean Culture Festival with Belize (November) and the Santa Cruz fair (April
        23–May 3).</En>
      </p>
      <figure className="guide-figure guide-figure--portrait">
        <img
          src="/img/guia/janal-pixan.webp"
          alt="Cartel del Janal Pixan, las veladas de Día de Muertos del museo / Janal Pixan poster for the museum's Day of the Dead evenings"
          width={900}
          height={1200}
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <Es>Janal Pixan: las ánimas recorren las calles a finales de octubre.</Es>{" "}
          <En>Janal Pixan: the souls walk the streets in late October.</En>
        </figcaption>
      </figure>

      <h2 style={h2}>
        <Es>Esenciales prácticos</Es> <En>Practical essentials</En>
      </h2>
      <ul>
        <li style={li}>
          <strong>
            <Es>Dinero</Es> <En>Money</En>:
          </strong>{" "}
          <Es>usa cajeros dentro de bancos; al preguntarte &quot;¿Acepta la conversión?&quot;
          siempre di que no. Efectivo para mercado, colectivos, cuotas comunitarias y cenotes —
          lleva billetes chicos (50/100/200).</Es>{" "}
          <En>Use indoor bank ATMs, decline conversion, carry small bills — cash is king.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Teléfono</Es> <En>Phone</En>:
          </strong>{" "}
          <Es>Telcel funciona bien en el pueblo, mal en la reserva. Descarga el mapa sin conexión
          de fcpqroo.mx antes de salir.</Es>{" "}
          <En>Download the site&apos;s offline map before heading into the reserve.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Idioma</Es> <En>Language</En>:
          </strong>{" "}
          <Es>el maya se habla tanto como el español; el inglés es raro. &quot;Ma&apos;aloob&quot;
          (bien) y &quot;Bix a beel?&quot; (¿cómo estás?) abren puertas.</Es>{" "}
          <En>A few Maya words open doors; English is rare.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Seguridad</Es> <En>Safety</En>:
          </strong>{" "}
          <Es>pueblo tranquilo y familiar; taxis de sitio de noche, no manejes de noche en
          caminos rurales.</Es>{" "}
          <En>Quiet town; use sitio taxis at night; no night driving on rural roads.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Salud</Es> <En>Health</En>:
          </strong>{" "}
          <Es>dengue presente en el interior — repelente mañana y tarde; agua embotellada; seguro
          con evacuación (los centros de referencia son Chetumal y Cancún).</Es>{" "}
          <En>Repellent for dengue, bottled water, evacuation insurance.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Comida</Es> <En>Food</En>:
          </strong>{" "}
          <Es>el mercado es la joya; el lechón de fin de semana es famoso en la región — sigue el
          humo y la fila local.</Es>{" "}
          <En>Weekend lechón is famous — follow the smoke and the local line.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Etiqueta</Es> <En>Etiquette</En>:
          </strong>{" "}
          <Es>saluda antes de preguntar (&quot;Buenos días&quot;), viste con modestia, pide
          permiso para fotos de personas o ceremonias, paga con gusto las cuotas
          comunitarias.</Es>{" "}
          <En>Greet first, dress modestly, ask before photos, pay community fees gladly.</En>
        </li>
      </ul>

      <h2 style={h2}>
        <Es>Itinerario sugerido de 2 días</Es> <En>Suggested 2-day itinerary</En>
      </h2>
      <p>
        <strong>
          <Es>Día 1:</Es> <En>Day 1</En>:
        </strong>{" "}
        <Es>llega en Tren Maya al mediodía; comida corrida en la plaza, Museo de la Ciudad + Casa
        de la Cultura + mercado; tarde en Síijil Noh Ha (kayak y cena con familia local, con
        reserva); lechón si es fin de semana.</Es>{" "}
        <En>Arrive by train, town cultural circuit, then Much Kanan K&apos;áax in the late
        afternoon.</En>
      </p>
      <p>
        <strong>
          <Es>Día 2:</Es> <En>Day 2</En>:
        </strong>{" "}
        <Es>Muyil temprano (7:30): ruinas + flotador del canal con guías comunitarios (de vuelta
        al mediodía); comida en FCP; cenote o Santuario por la tarde; Tren Maya de tarde hacia
        Bacalar/Chetumal o de vuelta a Tulum.</Es>{" "}
        <En>Early Muyil ruins + canal float, lunch in town, optional cenote, afternoon train
        onward.</En>
      </p>

      <h2 style={h2}>
        <Es>Referencia rápida</Es> <En>Quick reference</En>
      </h2>
      <ul>
        <li style={li}>
          <strong>
            <Es>Mapa</Es> <En>Map</En>:
          </strong>{" "}
          <Es>fcpqroo.mx — guarda el mapa sin conexión antes de entrar a la reserva.</Es>{" "}
          <En>save the offline map.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Zona horaria</Es> <En>Time zone</En>:
          </strong>{" "}
          <Es>Quintana Roo (Este, sin horario de verano).</Es> <En>Eastern, no DST.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Mejores meses</Es> <En>Best months</En>:
          </strong>{" "}
          <Es>nov–abr; 3 de mayo (Santa Cruz) para la peregrinación grande.</Es>{" "}
          <En>Nov–Apr; May 3 pilgrimage.</En>
        </li>
        <li style={li}>
          <strong>
            <Es>Efectivo sugerido</Es> <En>Suggested cash</En>:
          </strong>{" "}
          <Es>MXN 1,500–2,000 en billetes chicos para 2 días.</Es>{" "}
          <En>small-bill cash buffer for 2 days.</En>
        </li>
        <li style={li}>
          <strong>Emergencias:</strong> 911
        </li>
      </ul>

      <h2 style={h2}>
        <Es>¿Tienes un negocio o experiencia?</Es> <En>Own a business or experience?</En>
      </h2>
      <p>
        <Es>Aparece en esta guía, en el mapa y en el directorio — gratis, para siempre. Escríbenos
        por WhatsApp al 984 184 1313.</Es>{" "}
        <En>Appear in this guide, on the map and in the directory — free, forever. WhatsApp 984
        184 1313.</En>
      </p>

      <p style={{ marginTop: "3rem", fontSize: "0.85rem", opacity: 0.7 }}>
        <Es>Guía 2026 elaborada con el mapa local oficial de fcpqroo.mx y el programa de turismo
        comunitario Maya Ka&apos;an. Verifica horarios y tarifas antes de viajar.</Es>{" "}
        <En>Built from the official fcpqroo.mx local map and the Maya Ka&apos;an community tourism
        program; verify schedules and fares before traveling.</En>
      </p>
    </main>
  );
}
