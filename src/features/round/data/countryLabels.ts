/**
 * Etiquetas de países de Latinoamérica para el globo.
 * `small`: países chicos que solo muestran el código hasta acercar el zoom, para no tapar a sus vecinos.
 * Las coordenadas son puntos de etiqueta elegidos a mano (no centroides) para que caigan dentro del país.
 */
type CountryLabel = {
  code: string;
  name: string;
  lngLat: [number, number];
  small?: boolean;
};

const COUNTRY_LABELS: CountryLabel[] = [
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

export const COUNTRY_LABELS_GEOJSON = {
  type: "FeatureCollection" as const,
  features: COUNTRY_LABELS.map(({ code, name, lngLat, small }) => ({
    type: "Feature" as const,
    properties: { code, name, small: Boolean(small) },
    geometry: { type: "Point" as const, coordinates: lngLat },
  })),
};
