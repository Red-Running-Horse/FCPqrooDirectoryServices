import HighwayMap from "./highway-map";

export default function Home() {
  return (
    <main>
      <h1>Explora Felipe Carrillo Puerto</h1>
      <p>
        Mapa turístico de las carreteras regionales. Acércate para ver los nombres de las
        carreteras. Los puntos de interés son ejemplos sin verificar, no destinos confirmados.
      </p>
      <ul className="legend">
        <li>
          <span className="swatch" aria-hidden="true" />
          Carretera regional
        </li>
      </ul>
      <HighwayMap />
    </main>
  );
}
