import QRCode from "qrcode";

export interface QRCodeOptions {
  size?: number;
}

/**
 * Generates a QR code as a base64 PNG data URL.
 *
 * @param url - The URL or text to encode in the QR code
 * @param options - Optional configuration (size defaults to 300)
 * @returns A data URL string (data:image/png;base64,...)
 */
export async function generateQRCodeDataURL(
  url: string,
  options: QRCodeOptions = {},
): Promise<string> {
  const { size = 300 } = options;

  return QRCode.toDataURL(url, {
    type: "image/png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#1a1d3a",
      light: "#ffffffff",
    },
  });
}
