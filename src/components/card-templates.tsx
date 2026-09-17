import type { CSSProperties } from "react";

// Même logique que cv-templates.tsx / letter-templates.tsx : styles inline
// avec des couleurs littérales uniquement, pour un rendu indépendant du
// design system de l'app et une capture html2canvas fiable dans l'iframe
// isolé utilisé pour l'export PDF (voir talent-carte.tsx).

const neutral = { 900: "#171717", 600: "#525252", 500: "#737373", 200: "#e5e5e5" };
const teal = { 700: "#0f766e", 100: "#ccfbf1" };

const CARD_WIDTH = "85mm";
const CARD_HEIGHT = "55mm";

const cardBase: CSSProperties = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
  overflow: "hidden",
  position: "relative",
};

export interface CardFrontData {
  name: string;
  jobTitle: string;
  kind: "freelance" | "entreprise";
  companyName: string;
  companyLogoDataUrl: string;
  phone: string;
  address: string;
}

export interface CardBackData {
  qrCodeDataUrl: string;
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function ClassicCardFront({ data }: { data: CardFrontData }) {
  return (
    <div style={{ ...cardBase, backgroundColor: "#ffffff", color: neutral[900], padding: "5mm 6mm" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3mm", backgroundColor: teal[700] }} />
      <div style={{ fontSize: 13, fontWeight: 700 }}>{data.name}</div>
      {data.jobTitle && <div style={{ marginTop: 2, fontSize: 10, color: neutral[600] }}>{data.jobTitle}</div>}

      {data.kind === "entreprise" ? (
        <div style={{ position: "absolute", left: "6mm", right: "6mm", bottom: "5mm", display: "flex", alignItems: "center", gap: 8 }}>
          {data.companyLogoDataUrl && (
            <img src={data.companyLogoDataUrl} alt={data.companyName} style={{ height: 20, maxWidth: 60, objectFit: "contain" }} />
          )}
          {data.companyName && <span style={{ fontSize: 10, fontWeight: 600, color: teal[700] }}>{data.companyName}</span>}
        </div>
      ) : (
        <div style={{ position: "absolute", left: "6mm", right: "6mm", bottom: "5mm", fontSize: 9, color: neutral[600], lineHeight: 1.5 }}>
          {data.phone && <div>📞 {data.phone}</div>}
          {data.address && <div>📍 {data.address}</div>}
        </div>
      )}
    </div>
  );
}

export function ClassicCardBack({ data }: { data: CardBackData }) {
  return (
    <div
      style={{
        ...cardBase,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {data.qrCodeDataUrl && <img src={data.qrCodeDataUrl} alt="QR code du profil" style={{ width: 30, height: 30 }} />}
      <span style={{ fontSize: 8, color: neutral[500] }}>Scannez pour voir mon profil SKILLIA</span>
    </div>
  );
}

export function ModernCardFront({ data }: { data: CardFrontData }) {
  return (
    <div style={{ ...cardBase, backgroundColor: teal[700], color: "#ffffff", padding: "5mm 6mm" }}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 24,
          height: 24,
          borderRadius: 9999,
          backgroundColor: "rgba(255,255,255,0.18)",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {initials(data.name)}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>{data.name}</div>
      {data.jobTitle && <div style={{ marginTop: 2, fontSize: 10, color: teal[100] }}>{data.jobTitle}</div>}

      {data.kind === "entreprise" ? (
        <div style={{ position: "absolute", left: "6mm", right: "6mm", bottom: "5mm", display: "flex", alignItems: "center", gap: 8 }}>
          {data.companyLogoDataUrl && (
            <img
              src={data.companyLogoDataUrl}
              alt={data.companyName}
              style={{ height: 20, maxWidth: 60, objectFit: "contain", backgroundColor: "#ffffff", borderRadius: 4, padding: 2 }}
            />
          )}
          {data.companyName && <span style={{ fontSize: 10, fontWeight: 600 }}>{data.companyName}</span>}
        </div>
      ) : (
        <div style={{ position: "absolute", left: "6mm", right: "6mm", bottom: "5mm", fontSize: 9, color: teal[100], lineHeight: 1.5 }}>
          {data.phone && <div>📞 {data.phone}</div>}
          {data.address && <div>📍 {data.address}</div>}
        </div>
      )}
    </div>
  );
}

export function ModernCardBack({ data }: { data: CardBackData }) {
  return (
    <div
      style={{
        ...cardBase,
        backgroundColor: teal[700],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {data.qrCodeDataUrl && (
        <div style={{ backgroundColor: "#ffffff", padding: 4, borderRadius: 6 }}>
          <img src={data.qrCodeDataUrl} alt="QR code du profil" style={{ width: 30, height: 30, display: "block" }} />
        </div>
      )}
      <span style={{ fontSize: 8, color: teal[100] }}>Scannez pour voir mon profil SKILLIA</span>
    </div>
  );
}
