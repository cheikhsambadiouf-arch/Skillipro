import type { CSSProperties } from "react";

// Même logique que cv-templates.tsx : styles inline avec des couleurs
// littérales uniquement, pour rester indépendant du design system de l'app
// (couleurs oklch()/color-mix()) et permettre une capture html2canvas fiable
// dans l'iframe isolé utilisé pour l'export PDF (voir talent-lettre.tsx).

const neutral = {
  900: "#171717",
  700: "#404040",
  600: "#525252",
  500: "#737373",
  300: "#d4d4d4",
};

const teal = {
  700: "#0f766e",
};

export interface LetterPreviewData {
  senderName: string;
  senderLocation: string;
  companyName: string;
  recruiterName: string;
  dateLabel: string;
  content: string;
}

const page: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  backgroundColor: "#ffffff",
  color: neutral[900],
  boxSizing: "border-box",
  maxWidth: "210mm",
  margin: "0 auto",
  width: "100%",
};

export function ClassicLetterTemplate({ letter }: { letter: LetterPreviewData }) {
  return (
    <div style={{ ...page, padding: "30mm 25mm" }} lang="fr">
      <div style={{ textAlign: "right", fontSize: 13, color: neutral[700] }}>
        {letter.senderLocation && `${letter.senderLocation}, `}
        {letter.dateLabel}
      </div>

      <div style={{ marginTop: 32, fontSize: 13, lineHeight: 1.7, color: neutral[900], whiteSpace: "pre-line" }}>
        {letter.content}
      </div>

      <div style={{ marginTop: 40, fontSize: 13, fontWeight: 600 }}>{letter.senderName}</div>
    </div>
  );
}

export function ModernLetterTemplate({ letter }: { letter: LetterPreviewData }) {
  return (
    <div style={page} lang="fr">
      <div style={{ backgroundColor: teal[700], color: "#ffffff", padding: "16mm 25mm" }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{letter.senderName}</div>
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>
          {[letter.senderLocation, letter.dateLabel].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div style={{ padding: "20mm 25mm" }}>
        {letter.companyName && (
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: teal[700] }}>
            À l'attention de {letter.recruiterName || letter.companyName}
          </div>
        )}
        <div
          style={{
            marginTop: 20,
            fontSize: 13,
            lineHeight: 1.7,
            color: neutral[900],
            whiteSpace: "pre-line",
          }}
        >
          {letter.content}
        </div>
        <div style={{ marginTop: 32, fontSize: 13, fontWeight: 600, color: teal[700] }}>{letter.senderName}</div>
      </div>
    </div>
  );
}
