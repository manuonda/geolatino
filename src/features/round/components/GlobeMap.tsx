"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ExpressionSpecification,
  GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { COUNTRY_LABELS_GEOJSON } from "@/features/round/data/countryLabels";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const LATAM_CENTER: [number, number] = [-64, -15];
const STYLE_URL = "https://demotiles.maplibre.org/style.json";
const LINE_SOURCE = "guess-line";
const LINE_LAYER = "guess-line-layer";
const LINE_CASING = "guess-line-casing";

type LatLng = { lat: number; lng: number };

export type MapReveal = {
  guess: LatLng;
  answer: LatLng;
};

type GlobeMapProps = {
  className?: string;
  allowGuess?: boolean;
  resetKey?: number;
  reveal?: MapReveal | null;
  onGuess?: (guess: LatLng) => void;
};

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

/** Arco sobre el globo entre tu toque y el lugar correcto. */
function greatCircleCoords(from: LatLng, to: LatLng, steps = 48): [number, number][] {
  const lat1 = toRad(from.lat);
  const lon1 = toRad(from.lng);
  const lat2 = toRad(to.lat);
  const lon2 = toRad(to.lng);
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
    ),
  );
  if (!d || Number.isNaN(d)) {
    return [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ];
  }

  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    coords.push([toDeg(lon), toDeg(lat)]);
  }
  return coords;
}

function makePin(kind: "guess" | "answer") {
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col items-center";
  const pin = document.createElement("div");
  pin.className =
    kind === "guess"
      ? "h-4 w-4 border-[3px] border-night bg-gold block-shadow"
      : "h-5 w-5 border-[3px] border-gold bg-chip-green block-shadow";
  const label = document.createElement("span");
  label.className =
    "mt-1 whitespace-nowrap border-[2px] border-night bg-pitch px-1.5 py-0.5 font-hud text-[11px] font-bold leading-none tracking-wider text-gold";
  label.textContent = kind === "guess" ? "TU TOQUE" : "AQUÍ";
  wrap.append(pin, label);
  return wrap;
}

function lineFeature(from: LatLng, to: LatLng) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: greatCircleCoords(from, to),
    },
  };
}

function ensureRevealLine(map: MapLibreMap, from: LatLng, to: LatLng) {
  const data = lineFeature(from, to);
  const source = map.getSource(LINE_SOURCE);
  if (source?.type === "geojson") {
    (source as GeoJSONSource).setData(data);
    return;
  }

  map.addSource(LINE_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: LINE_CASING,
    type: "line",
    source: LINE_SOURCE,
    paint: {
      "line-color": "#1c1410",
      "line-width": 5,
      "line-opacity": 0.9,
    },
  });
  map.addLayer({
    id: LINE_LAYER,
    type: "line",
    source: LINE_SOURCE,
    paint: {
      "line-color": "#e4b44c",
      "line-width": 2.5,
      "line-dasharray": [2, 1.2],
    },
  });
}

function clearRevealLine(map: MapLibreMap) {
  if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER);
  if (map.getLayer(LINE_CASING)) map.removeLayer(LINE_CASING);
  if (map.getSource(LINE_SOURCE)) map.removeSource(LINE_SOURCE);
}

function frameReveal(map: MapLibreMap, guess: LatLng, answer: LatLng) {
  const sameSpot =
    Math.abs(guess.lat - answer.lat) < 0.05 && Math.abs(guess.lng - answer.lng) < 0.05;
  if (sameSpot) {
    map.flyTo({
      center: [answer.lng, answer.lat],
      zoom: 7.5,
      duration: 1100,
    });
    return;
  }

  const bounds = new LngLatBounds()
    .extend([guess.lng, guess.lat])
    .extend([answer.lng, answer.lat]);
  map.fitBounds(bounds, {
    padding: { top: 220, bottom: 210, left: 56, right: 56 },
    duration: 1200,
    maxZoom: 6.2,
  });
}

function addAdmin1Borders(map: MapLibreMap) {
  if (map.getSource("admin1")) return;

  map.addSource("admin1", {
    type: "geojson",
    data: "/geo/latam-admin1.json",
  });

  map.addLayer({
    id: "admin1-casing",
    type: "line",
    source: "admin1",
    minzoom: 2.6,
    paint: {
      "line-color": "#1c1410",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2.5,
        2,
        4,
        2.8,
        6,
        3.6,
        8,
        4.4,
      ],
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "admin1-line",
    type: "line",
    source: "admin1",
    minzoom: 2.6,
    paint: {
      "line-color": "#ffffff",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2.5,
        0.6,
        4,
        1.4,
        6,
        2.2,
        8,
        3,
      ],
      "line-opacity": 0.95,
    },
  });
}

function hideBaseLabels(map: MapLibreMap) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type === "symbol") {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }
}

function addCountryLabels(map: MapLibreMap) {
  if (map.getSource("country-labels")) return;

  map.addSource("country-labels", { type: "geojson", data: COUNTRY_LABELS_GEOJSON });

  const code: ExpressionSpecification = ["get", "code"];
  const nameWithCode: ExpressionSpecification = [
    "format",
    ["get", "name"],
    {},
    "\n",
    {},
    code,
    { "font-scale": 0.85 },
  ];

  map.addLayer({
    id: "country-labels",
    type: "symbol",
    source: "country-labels",
    layout: {
      "text-field": [
        "step",
        ["zoom"],
        ["case", ["get", "small"], ["format", code, {}], nameWithCode],
        4,
        nameWithCode,
      ],
      "text-font": ["Open Sans Semibold"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 1.5, 11, 3, 13, 6, 16],
      "text-line-height": 1.05,
      "text-padding": 1,
      "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
      "text-radial-offset": 0.4,
      "symbol-sort-key": ["case", ["get", "small"], 1, 0],
    },
    paint: {
      "text-color": "#1c1410",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8,
    },
  });
}

const GLOBE_FILL = 0.47;
const DEFAULT_ZOOM = 2.15;

/**
 * Zoom con el que el globo ocupa casi todo el lado corto del contenedor.
 * Mide el radio en pantalla proyectando un punto a 30° del centro (distancia = R·sen 30°).
 */
function fittedGlobeZoom(map: MapLibreMap): number {
  const canvas = map.getCanvas();
  const target = Math.min(canvas.clientWidth, canvas.clientHeight) * GLOBE_FILL;
  const center = map.getCenter();
  const from = map.project(center);
  const to = map.project([center.lng, center.lat + 30]);
  const radius = Math.hypot(to.x - from.x, to.y - from.y) / Math.sin(Math.PI / 6);
  if (!target || !radius || !Number.isFinite(radius)) return map.getZoom();
  return map.getZoom() + Math.log2(target / radius);
}

export default function GlobeMap({
  className = "relative h-full w-full",
  allowGuess = false,
  resetKey = 0,
  reveal = null,
  onGuess,
}: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const guessMarkerRef = useRef<Marker | null>(null);
  const answerMarkerRef = useRef<Marker | null>(null);
  const allowGuessRef = useRef(allowGuess);
  const onGuessRef = useRef(onGuess);
  const homeZoomRef = useRef(DEFAULT_ZOOM);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    allowGuessRef.current = allowGuess;
    onGuessRef.current = onGuess;
  }, [allowGuess, onGuess]);

  useEffect(() => {
    guessMarkerRef.current?.remove();
    guessMarkerRef.current = null;
    answerMarkerRef.current?.remove();
    answerMarkerRef.current = null;
    const map = mapRef.current;
    if (!map) return;
    clearRevealLine(map);
    if (resetKey === 0) return;
    map.flyTo({ center: LATAM_CENTER, zoom: homeZoomRef.current, duration: 700 });
  }, [resetKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (!reveal) {
      answerMarkerRef.current?.remove();
      answerMarkerRef.current = null;
      clearRevealLine(map);
      return;
    }

    guessMarkerRef.current?.remove();
    guessMarkerRef.current = new Marker({
      element: makePin("guess"),
      anchor: "bottom",
    })
      .setLngLat([reveal.guess.lng, reveal.guess.lat])
      .addTo(map);

    answerMarkerRef.current?.remove();
    answerMarkerRef.current = new Marker({
      element: makePin("answer"),
      anchor: "bottom",
    })
      .setLngLat([reveal.answer.lng, reveal.answer.lat])
      .addTo(map);

    ensureRevealLine(map, reveal.guess, reveal.answer);
    frameReveal(map, reveal.guess, reveal.answer);
  }, [reveal, ready]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: STYLE_URL,
      center: LATAM_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true },
    });

    mapRef.current = map;

    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
      hideBaseLabels(map);
      addAdmin1Borders(map);
      addCountryLabels(map);
      map.resize();
      homeZoomRef.current = fittedGlobeZoom(map);
      map.jumpTo({ zoom: homeZoomRef.current });
      setReady(true);
    });

    map.on("error", (event) => {
      console.error("MapLibre error", event.error);
    });

    map.on("click", (event) => {
      if (!allowGuessRef.current) return;
      guessMarkerRef.current?.remove();
      const pin = document.createElement("div");
      pin.className = "h-4 w-4 border-[3px] border-night bg-gold block-shadow";
      guessMarkerRef.current = new Marker({ element: pin, anchor: "center" })
        .setLngLat(event.lngLat)
        .addTo(map);
      onGuessRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    return () => {
      guessMarkerRef.current?.remove();
      guessMarkerRef.current = null;
      answerMarkerRef.current?.remove();
      answerMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={`overflow-hidden bg-night ${className}`}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {!ready && (
        <p className="absolute inset-0 z-10 flex items-center justify-center font-hud text-sm font-bold tracking-widest text-gold">
          Cargando mapa…
        </p>
      )}
    </div>
  );
}
