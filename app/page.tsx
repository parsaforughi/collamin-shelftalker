"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function Page() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (output) URL.revokeObjectURL(output);
    };
  }, [output]);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImage(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!image) return;

    setLoading(true);
    setOutput(null);

    // Ice FX burst روی دکمه
    const fxRoot = document.getElementById("iceFX-root");
    if (fxRoot) {
      const burst = document.createElement("div");
      burst.className = "ice-burst";
      fxRoot.appendChild(burst);

      const ripple = document.createElement("div");
      ripple.className = "shock-ripple";
      fxRoot.appendChild(ripple);

      setTimeout(() => {
        burst.remove();
        ripple.remove();
      }, 1200);
    }

    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    setOutput(url);
    setLoading(false);
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
          background: linear-gradient(180deg, #cfe9ff 0%, #eaf2ff 60%, #ffffff 100%);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "IRANSans", "Vazirmatn", sans-serif;
        }

        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            url("/textures/noise.png") repeat,
            radial-gradient(circle, rgba(255, 255, 255, 0.07), transparent 70%);
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        /* برف ریزون عمومی */
        @keyframes snowFall {
          0% {
            transform: translateY(-10%);
            opacity: 0.8;
          }
          100% {
            transform: translateY(110vh);
            opacity: 0.2;
          }
        }

        .snowflake {
          position: fixed;
          top: -40px;
          color: rgba(255, 255, 255, 0.9);
          pointer-events: none;
          animation-name: snowFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          text-shadow: 0 0 6px rgba(255, 255, 255, 0.7);
          z-index: 1;
        }

        .snow-blur {
          position: fixed;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent 60%);
          filter: blur(12px);
          opacity: 0.35;
          pointer-events: none;
          z-index: 1;
        }

        /* کارت یخی */
        .frost-glass {
          backdrop-filter: blur(28px);
          background: rgba(255, 255, 255, 0.42);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            inset 0 0 22px rgba(255, 255, 255, 0.5),
            0 18px 40px rgba(80, 130, 190, 0.35);
          position: relative;
          overflow: hidden;
        }

        .ice-halo {
          position: absolute;
          inset: -40px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(150, 210, 255, 0.55), transparent 70%);
          filter: blur(40px);
          z-index: -1;
        }

        .freeze-pulse {
          animation: coldGlow 7s ease-in-out infinite;
        }

        @keyframes coldGlow {
          0%,
          100% {
            box-shadow:
              inset 0 0 22px rgba(255, 255, 255, 0.5),
              0 18px 40px rgba(80, 130, 190, 0.35);
          }
          50% {
            box-shadow:
              inset 0 0 32px rgba(255, 255, 255, 0.8),
              0 24px 60px rgba(120, 180, 255, 0.55);
          }
        }

        @keyframes floatCard {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        /* حاشیه ترک یخ روی کارت */
        .ice-crack-border {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background-image: url("/textures/ice-cracks.png");
          background-size: cover;
          background-repeat: no-repeat;
          mix-blend-mode: screen;
          opacity: 0.4;
        }

        /* ناحیه دراپزون + پریویو */
        .upload-zone {
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }

        .upload-zone:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 26px rgba(150, 200, 255, 0.4);
          background: rgba(255, 255, 255, 0.9);
        }

        .preview-frame {
          border-radius: 18px;
          padding: 4px;
          background: linear-gradient(
            135deg,
            rgba(180, 220, 255, 0.7),
            rgba(255, 255, 255, 0.9)
          );
          box-shadow:
            inset 0 0 18px rgba(255, 255, 255, 0.7),
            0 16px 40px rgba(90, 140, 200, 0.45);
          animation: frostIn 0.4s ease-out forwards;
        }

        @keyframes frostIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* دکمه یخی */
        .ice-button-wrap {
          position: relative;
          overflow: visible;
        }

        .generate-button {
          background: linear-gradient(135deg, #0a3d62, #1e90ff);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 10px 32px rgba(40, 120, 255, 0.55);
          padding: 1rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }

        .generate-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(60, 150, 255, 0.7);
          background: linear-gradient(135deg, #0b4875, #2f9bff);
        }

        .generate-button:active {
          transform: translateY(0px) scale(0.97);
          box-shadow: 0 6px 24px rgba(40, 120, 255, 0.55);
        }

        .ice-button-refraction {
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0)
          );
          opacity: 0.0;
          mix-blend-mode: screen;
          animation: refractionSweep 4s ease-in-out infinite;
        }

        @keyframes refractionSweep {
          0% {
            opacity: 0;
            transform: translateX(-130%);
          }
          40% {
            opacity: 0.85;
            transform: translateX(0%);
          }
          100% {
            opacity: 0;
            transform: translateX(130%);
          }
        }

        /* بک‌گراند پارالاکس و آئورا */
        .winter-bg-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -5;
        }

        .winter-bg-layer.snow-parallax {
          background: radial-gradient(circle, rgba(255, 255, 255, 0.7) 1px, transparent 1px);
          background-size: 150px 150px;
          animation: snowParallax 22s linear infinite;
          opacity: 0.5;
        }

        .winter-bg-layer.aurora {
          background:
            radial-gradient(circle at 20% 30%, rgba(120, 180, 255, 0.35), transparent 60%),
            radial-gradient(circle at 80% 75%, rgba(170, 210, 255, 0.45), transparent 70%);
          filter: blur(80px);
          animation: auroraWave 16s ease-in-out infinite alternate;
          opacity: 0.65;
        }

        @keyframes snowParallax {
          0% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(60px);
          }
        }

        @keyframes auroraWave {
          0% {
            transform: translateX(-40px) scale(1.03);
          }
          100% {
            transform: translateX(40px) scale(1.12);
          }
        }

        /* لایه‌های فروست سراسری */
        .frost-screen {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            url("/textures/frost-texture.png") repeat,
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.25), transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(180, 220, 255, 0.2), transparent 70%);
          opacity: 0.55;
          filter: blur(1.6px);
          mix-blend-mode: screen;
          animation: frostPulse 6s ease-in-out infinite;
          z-index: -4;
        }

        @keyframes frostPulse {
          0%,
          100% {
            opacity: 0.45;
            filter: blur(1.4px);
          }
          50% {
            opacity: 0.8;
            filter: blur(2.6px);
          }
        }

        .frost-growth {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: url("/textures/frost-growth.png");
          background-size: cover;
          opacity: 0;
          z-index: -3;
          animation: frostGrow 11s ease-out forwards;
        }

        @keyframes frostGrow {
          0% {
            opacity: 0;
            transform: scale(1.08);
            filter: blur(8px);
          }
          40% {
            opacity: 0.4;
            transform: scale(1.02);
            filter: blur(5px);
          }
          100% {
            opacity: 0.78;
            transform: scale(1);
            filter: blur(2px);
          }
        }

        .frost-cracks {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: url("/textures/ice-cracks-strong.png");
          background-size: contain;
          background-repeat: repeat;
          mix-blend-mode: lighten;
          opacity: 0.22;
          animation: frostCrackShimmer 8s ease-in-out infinite;
          z-index: -2;
        }

        @keyframes frostCrackShimmer {
          0%,
          100% {
            opacity: 0.22;
          }
          50% {
            opacity: 0.34;
          }
        }

        /* افکت کلیک دکمه: انفجار یخ + شاک‌ویو */
        .ice-burst {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(180, 220, 255, 0.55),
            rgba(140, 180, 255, 0.15),
            transparent 70%
          );
          mix-blend-mode: screen;
          opacity: 0;
          transform: scale(0.3);
          animation: iceBurstAnim 0.9s ease-out forwards;
        }

        @keyframes iceBurstAnim {
          0% {
            opacity: 0.9;
            transform: scale(0.3);
            filter: blur(2px);
          }
          40% {
            opacity: 0.7;
            transform: scale(1.2);
            filter: blur(4px);
          }
          100% {
            opacity: 0;
            transform: scale(2.3);
            filter: blur(8px);
          }
        }

        .shock-ripple {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(200, 230, 255, 0.5);
          opacity: 0;
          pointer-events: none;
          animation: shockRippleAnim 1.2s ease-out forwards;
        }

        @keyframes shockRippleAnim {
          0% {
            opacity: 0.95;
            transform: scale(0.4);
          }
          60% {
            opacity: 0.3;
            transform: scale(2.2);
          }
          100% {
            opacity: 0;
            transform: scale(3.2);
          }
        }

        footer {
          opacity: 0.7;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.35));
        }
      `}</style>

      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center overflow-hidden px-4 relative"
      >
        {/* لایه‌های بک‌گراند */}
        <div className="winter-bg-layer snow-parallax" />
        <div className="winter-bg-layer aurora" />
        <div className="frost-screen" />
        <div className="frost-growth" />
        <div className="frost-cracks" />

        {/* برف ریزون رندوم */}
        {Array.from({ length: 32 }).map((_, idx) => (
          <div
            key={`flake-${idx}`}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 8}s`,
              fontSize: `${10 + Math.random() * 10}px`,
            }}
          >
            ❄
          </div>
        ))}

        {/* هاله‌های بلور */}
        <div className="snow-blur" style={{ top: "10%", left: "18%" }} />
        <div className="snow-blur" style={{ bottom: "12%", left: "24%" }} />
        <div className="snow-blur" style={{ top: "28%", right: "16%" }} />
        <div className="snow-blur" style={{ bottom: "26%", right: "22%" }} />

        {/* کارت اصلی */}
        <div
          className="mx-auto px-6 py-10 relative frost-glass freeze-pulse"
          style={{
            maxWidth: "480px",
            animation: "floatCard 6s ease-in-out infinite",
          }}
        >
          <div className="ice-halo" />
          <div className="ice-crack-border" />
          <div id="iceFX-root" className="pointer-events-none absolute inset-0" />

          <header className="text-center space-y-2 mb-6 relative z-10">
            <h1 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: "-0.04em" }}>
              آماده‌ای یخ بزنی؟
            </h1>
            <p className="text-sm text-gray-700" style={{ fontWeight: 300 }}>
              عکست رو بده؛ من سردترین نسخه‌ت رو می‌سازم ❄
            </p>
          </header>

          <div className="relative z-10 space-y-4">
            <label
              className="block text-center cursor-pointer upload-zone"
              style={{
                border: "1px dashed rgba(180,200,230,0.9)",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.88)",
                padding: "1.5rem",
              }}
            >
              <p className="font-semibold text-gray-800 mb-1">عکست رو آپلود کن</p>
              <p className="text-xs text-gray-500">(فرمت JPG یا PNG)</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>

            {preview && (
              <div className="preview-frame mt-2">
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxHeight: "420px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    display: "block",
                  }}
                />
              </div>
            )}

            <div className="ice-button-wrap mt-4">
              <button
                onClick={handleGenerate}
                disabled={!image || loading}
                className="generate-button w-full text-white font-semibold"
              >
                {loading ? "در حال ساخت..." : "بزن که یخ بزنی ❄"}
              </button>
              <div className="ice-button-refraction" />
            </div>

            {output && (
              <div className="preview-frame mt-5">
                <img
                  src={output}
                  alt="generated portrait"
                  style={{
                    width: "100%",
                    maxHeight: "420px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    display: "block",
                  }}
                />
              </div>
            )}

            <footer className="text-center text-xs text-gray-600 mt-4">
              @Luxirana — تگمون کن ❄
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}