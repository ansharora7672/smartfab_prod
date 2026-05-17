import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SmartFab Lathe — Precision Manufacturing Dubai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080C14 0%, #0a1628 60%, #1e3a5f 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent circle */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Top label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.25)" }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Precision Manufacturing
          </span>
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.25)" }} />
        </div>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            SMARTFAB
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={{ width: 32, height: 2, background: "#3b82f6" }} />
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.4em",
                color: "#3b82f6",
              }}
            >
              LATHE
            </span>
            <div style={{ width: 32, height: 2, background: "#3b82f6" }} />
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.05em",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Engineering Accuracy. Crafted in Metal.
        </div>

        {/* Service pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["CNC Milling", "Turning", "Laser Cutting", "Welding"].map((s) => (
            <div
              key={s}
              style={{
                padding: "10px 22px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 14,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em",
          }}
        >
          smartfablathe.com
        </div>
      </div>
    ),
    { ...size }
  );
}
