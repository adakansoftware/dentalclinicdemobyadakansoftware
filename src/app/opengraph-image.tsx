import { ImageResponse } from "next/og";
import { getHeroImageDataUrl } from "@/lib/social-image-route";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default async function OpenGraphImage() {
  const heroDataUrl = await getHeroImageDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#101417",
          color: "#ffffff",
          overflow: "hidden",
        }}
      >
        <img
          src={heroDataUrl}
          alt="Adakan Dental Klinik"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(16,20,23,0.82) 0%, rgba(16,20,23,0.55) 48%, rgba(16,20,23,0.18) 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 18,
            padding: "64px 68px",
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 3,
              color: "#d7c08a",
              textTransform: "uppercase",
            }}
          >
            Adakan Dental Klinik
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 700,
              fontSize: 66,
              lineHeight: 1.05,
              fontWeight: 700,
            }}
          >
            Modern dis klinigi deneyimi
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 720,
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.86)",
            }}
          >
            Guven veren sunum, online randevu akisi ve mobil uyumlu klinik web sitesi demosu.
          </div>
        </div>
      </div>
    ),
    size
  );
}
