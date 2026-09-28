import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
      <svg viewBox="0 0 512 512" width="512" height="512">
        <path
          d="M132 398V232c0-99 51.8-162 124-162s124 63 124 162v166"
          fill="none"
          stroke="#f8f3e8"
          strokeWidth="38"
          strokeLinecap="round"
        />
        <circle cx="256" cy="341" r="22" fill="#d7b16a" />
        <circle cx="256" cy="276" r="22" fill="#d7b16a" />
        <circle cx="256" cy="211" r="22" fill="#d7b16a" />
      </svg>
    </div>,
    size,
  );
}
