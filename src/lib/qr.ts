import QRCode from "qrcode";

export function toQrDataUrl(url: string, width = 480) {
  return QRCode.toDataURL(url, {
    width,
    margin: 1,
    color: { dark: "#3f2e1e", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}
