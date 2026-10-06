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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#E4B44C",
          border: "16px solid #E4B44C",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700 }}>GeoLatino</div>
        <div style={{ fontSize: 32, color: "#F4EBD0", marginTop: 16 }}>
          Tocá en el mapa dónde pasó
        </div>
      </div>
    ),
    { ...size },
  );
}
