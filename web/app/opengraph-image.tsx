import { ImageResponse } from "next/og";

export const alt = "Iva: the grocery agent that pays for her own brain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link preview for Telegram / WhatsApp / X. Text only (no emoji fonts needed at build time).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#1d2421",
          color: "#ecedf0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#9aa1ad" }}>
          ETHGlobal Mumbai 2026 · live on 0G mainnet
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Iva: the grocery agent</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: "#7ed854" }}>
            that pays for her own brain
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#9aa1ad", maxWidth: 980 }}>
            Cheapest basket across Blinkit, Instamart and Zepto. She spends her fees on her own AI on 0G Compute.
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 26 }}>
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 14, background: "#7ed854", color: "#141816" }}>
            t.me/IvaGroceryAgentbot
          </div>
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 14, border: "2px solid #36403c" }}>
            0.2 0G a hunt → depositFor → 0G Compute
          </div>
        </div>
      </div>
    ),
    size,
  );
}
