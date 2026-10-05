import { ImageResponse } from "next/og";

export const alt = "GeoLatino — Tocá en el mapa dónde pasó";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#07161A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E4B44C",
          fontSize: 72,
          fontWeight: 700,
        }}
      >
        GeoLatino
      </div>
    ),
    { ...size },
  );
}
