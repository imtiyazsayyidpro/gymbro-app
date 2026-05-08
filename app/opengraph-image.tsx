import { ImageResponse } from "next/og";

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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #0e0e0f 0%, #19191d 100%)",
          color: "#f0f0ee",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: "#c8f135",
            fontSize: "44px",
            fontWeight: 800,
          }}
        >
          <span>GYMBRO</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "78px",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            Track every rep.
            Grow with intent.
          </div>
          <div style={{ fontSize: "34px", opacity: 0.85 }}>
            Progressive overload and workout history built for consistency.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
