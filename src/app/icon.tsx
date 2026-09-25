import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6b5344",
          color: "#f7f3ea",
          fontSize: 220,
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.04em",
        }}
      >
        C
      </div>
    ),
    size,
  );
}
