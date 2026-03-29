"use client";

import { Download } from "lucide-react";

export interface QRCodeProps {
  /** Base64 PNG data URL returned from generateQRCodeDataURL */
  dataUrl: string;
  /** Optional label displayed below the QR code */
  label?: string;
}

/**
 * Displays a QR code image with an optional label and a download button.
 * Print-friendly: hides the download button in print context.
 */
export function QRCode({ dataUrl, label }: QRCodeProps): React.ReactElement {
  function handleDownload(): void {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = label ? `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png` : "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Image */}
      <div className="rounded-xl border border-border bg-white p-3 shadow-sm print:shadow-none print:border-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={label ? `QR code for ${label}` : "QR code"}
          width={300}
          height={300}
          className="block"
          draggable={false}
        />
      </div>

      {/* Label */}
      {label ? (
        <p className="text-sm font-medium text-center text-foreground">{label}</p>
      ) : null}

      {/* Download button — hidden during print */}
      <button
        type="button"
        onClick={handleDownload}
        aria-label={`Download QR code${label ? ` for ${label}` : ""}`}
        className="print:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download QR Code
      </button>
    </div>
  );
}
