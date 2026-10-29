"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// Teselas de OpenStreetMap: con calles y nombres, para ubicar un estadio con precisión.
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

const LATAM_CENTER: [number, number] = [-64, -15];

type PinPickerProps = {
  defaultLat?: number;
  defaultLng?: number;
  errors?: { lat?: string; lng?: string };
};

const toInput = (value: number | undefined) => (value === undefined ? "" : String(value));
const round = (value: number) => Math.round(value * 1e5) / 1e5;

/** Mapa para elegir la respuesta: un clic pone el pin. Los campos lat y lng van en el formulario. */
export function PinPicker({ defaultLat, defaultLng, errors }: PinPickerProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const [lat, setLat] = useState(toInput(defaultLat));
  const [lng, setLng] = useState(toInput(defaultLng));

  useEffect(() => {
    if (!container.current) return;
    const hasPin = defaultLat !== undefined && defaultLng !== undefined;
    const instance = new MapLibreMap({
      container: container.current,
      style: OSM_STYLE,
      center: hasPin ? [defaultLng, defaultLat] : LATAM_CENTER,
      zoom: hasPin ? 14 : 2.5,
    });
    map.current = instance;

    instance.on("click", (event) => {
      setLat(String(round(event.lngLat.lat)));
      setLng(String(round(event.lngLat.lng)));
    });

    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // El mapa se crea una sola vez; después el pin sigue a los campos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El pin sigue a los campos, se cambien con un clic o escribiendo.
  useEffect(() => {
    const instance = map.current;
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const valid =
      lat !== "" && lng !== "" && Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180;
    if (!instance) return;
    if (!valid) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = new Marker({ color: "#e23d3d" }).setLngLat([lngNum, latNum]).addTo(instance);
    } else {
      marker.current.setLngLat([lngNum, latNum]);
    }
  }, [lat, lng]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={container}
        className="h-80 w-full border-[3px] border-cream/30"
        aria-label="Mapa: hacé clic para poner el pin de la respuesta"
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Latitud
          <input
            name="lat"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="admin-input"
            required
          />
          {errors?.lat && <span className="text-card">{errors.lat}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Longitud
          <input
            name="lng"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="admin-input"
            required
          />
          {errors?.lng && <span className="text-card">{errors.lng}</span>}
        </label>
      </div>
    </div>
  );
}
