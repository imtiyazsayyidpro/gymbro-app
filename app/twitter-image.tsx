import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(130deg, #0e0e0f 0%, #17171c 100%)",
          color: "#f0f0ee",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ color: "#c8f135", fontSize: "42px", fontWeight: 800 }}>
          GYMBRO
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.07,
            }}
          >
            Your workouts,
            always progressing.
          </div>
          <div style={{ fontSize: "32px", opacity: 0.85 }}>
            Mobile-first tracking for consistent strength gains.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
