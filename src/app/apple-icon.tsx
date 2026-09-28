import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4c3158",
      }}
    >
      <svg viewBox="0 0 180 180" width="180" height="180">
        <path
          d="M47 140V82c0-35 18.2-57 43-57s43 22 43 57v58"
          fill="none"
          stroke="#f8f3e8"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="90" cy="120" r="7.5" fill="#d7b16a" />
        <circle cx="90" cy="97" r="7.5" fill="#d7b16a" />
        <circle cx="90" cy="74" r="7.5" fill="#d7b16a" />
      </svg>
    </div>,
    size,
  );
}
