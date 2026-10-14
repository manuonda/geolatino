import { writeFileSync } from "node:fs";
import path from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";

/**
 * Latinoamérica: posiciones elegidas a mano para que la etiqueta caiga dentro del país.
 * `small`: solo muestra el código hasta acercar el zoom, para no tapar a sus vecinos.
 */
const LATAM = [
  { code: "AR", name: "Argentina", lngLat: [-64.5, -34.5] },
  { code: "BO", name: "Bolivia", lngLat: [-64.7, -16.8] },
  { code: "BR", name: "Brasil", lngLat: [-51.5, -10] },
  { code: "CL", name: "Chile", lngLat: [-70.4, -24.5] },
  { code: "CO", name: "Colombia", lngLat: [-73.5, 4] },
  { code: "EC", name: "Ecuador", lngLat: [-78.3, -1.5] },
  { code: "GY", name: "Guyana", lngLat: [-58.9, 5], small: true },
  { code: "SR", name: "Surinam", lngLat: [-55.9, 4], small: true },
  { code: "GF", name: "Guayana Francesa", lngLat: [-53.2, 3.9], small: true },
  { code: "PY", name: "Paraguay", lngLat: [-58.2, -23.3] },
  { code: "PE", name: "Perú", lngLat: [-75, -9.5] },
  { code: "UY", name: "Uruguay", lngLat: [-56, -32.8], small: true },
  { code: "VE", name: "Venezuela", lngLat: [-65, 7.5] },
  { code: "MX", name: "México", lngLat: [-102, 23.8] },
  { code: "GT", name: "Guatemala", lngLat: [-90.3, 15.6], small: true },
  { code: "BZ", name: "Belice", lngLat: [-88.7, 17.2], small: true },
  { code: "SV", name: "El Salvador", lngLat: [-88.9, 13.7], small: true },
  { code: "HN", name: "Honduras", lngLat: [-86.6, 14.8], small: true },
  { code: "NI", name: "Nicaragua", lngLat: [-85, 12.9], small: true },
  { code: "CR", name: "Costa Rica", lngLat: [-84.1, 9.9], small: true },
  { code: "PA", name: "Panamá", lngLat: [-80.1, 8.5], small: true },
  { code: "CU", name: "Cuba", lngLat: [-79, 21.9] },
  { code: "JM", name: "Jamaica", lngLat: [-77.3, 18.1], small: true },
  { code: "HT", name: "Haití", lngLat: [-72.6, 19], small: true },
  { code: "DO", name: "Rep. Dominicana", lngLat: [-70.4, 18.8], small: true },
  { code: "PR", name: "Puerto Rico", lngLat: [-66.5, 18.2], small: true },
];

const NAME_OVERRIDES = {
  US: "Estados Unidos",
  GB: "Reino Unido",
  CD: "Rep. Dem. del Congo",
  CF: "Rep. Centroafricana",
};

/** Menor número = gana cuando dos etiquetas se pisan. */
function priority({ latam, curated, small, rank }) {
  if (curated) return small ? 1 : 0;
  if (latam) return 2;
  return 2 + rank;
}

function feature({ code, name, lngLat, small, priority: p }) {
  return {
    type: "Feature",
    properties: { code, name, small, priority: p },
    geometry: {
      type: "Point",
      coordinates: lngLat.map((n) => Math.round(n * 100) / 100),
    },
  };
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Natural Earth: HTTP ${response.status}`);
const { features } = await response.json();

const curatedCodes = new Set(LATAM.map((c) => c.code));
const labels = LATAM.map((c) =>
  feature({ ...c, small: Boolean(c.small), priority: priority({ curated: true, small: c.small }) }),
);

const byRank = [...features].sort((a, b) => a.properties.LABELRANK - b.properties.LABELRANK);
const seen = new Set(curatedCodes);

for (const { properties: p } of byRank) {
  const code = p.ISO_A2_EH;
  if (!code || code === "-99" || seen.has(code)) continue;
  seen.add(code);
  const latam = p.REGION_WB === "Latin America & Caribbean";
  const small = p.LABELRANK >= 4;
  labels.push(
    feature({
      code,
      name: NAME_OVERRIDES[code] ?? p.NAME_ES ?? p.NAME,
      lngLat: [p.LABEL_X, p.LABEL_Y],
      small,
      priority: priority({ latam, rank: p.LABELRANK }),
    }),
  );
}

const dest = path.join(process.cwd(), "public", "geo", "country-labels.json");
writeFileSync(dest, JSON.stringify({ type: "FeatureCollection", features: labels }));
console.log(`Wrote ${labels.length} country labels to public/geo/country-labels.json`);
