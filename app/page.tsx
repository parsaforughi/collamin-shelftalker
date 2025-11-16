"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function Page() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cleanup preview URL on unmount/change
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Cleanup output URL on unmount/change
  useEffect(() => {
    return () => {
      if (output) URL.revokeObjectURL(output);
    };
  }, [output]);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setImage(file);
    setOutput(null); // reset old result

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!image) return;

    setLoading(true);
    setOutput(null);

    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Generate failed", await res.text());
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setOutput(url);
    setLoading(false);
  }

  function handleDownload() {
    if (!output) return;
    const link = document.createElement("a");
    link.href = output;
    link.download = "iceball-portrait.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "SF Pro Text", sans-serif;
          background: radial-gradient(circle at top, #d6ecff 0%, #eaf2ff 35%, #ffffff 80%);
          overflow-x: hidden;
        }

        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            url("/textures/noise.png") repeat,
            radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.55), transparent 60%),
            radial-gradient(circle at 80% 100%, rgba(180, 210, 255, 0.45), transparent 65%);
          mix-blend-mode: screen;
          opacity: 0.45;
          pointer-events: none;
          z-index: -3;
        }

        /* Winter parallax layers */
        .winter-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -2;
        }

        .winter-layer.aurora {
          background:
            radial-gradient(circle at 10% 20%, rgba(140, 190, 255, 0.4), transparent 55%),
            radial-gradient(circle at 80% 70%, rgba(190, 225, 255, 0.35), transparent 65%);
          filter: blur(60px);
          animation: auroraWave 18s ease-in-out infinite alternate;
          opacity: 0.9;
        }

        .winter-layer.snowfield {
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px);
          background-size: 160px 160px;
          animation: snowDrift 26s linear infinite;
          opacity: 0.35;
        }

        /* Snowflakes */
        .snowflake {
          position: fixed;
          top: -5%;
          color: rgba(255, 255, 255, 0.95);
          text-shadow:
            0 0 6px rgba(140, 190, 255, 0.8),
            0 0 16px rgba(140, 190, 255, 0.9);
          animation-name: snowFall, snowSway;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          z-index: -1;
        }

        @keyframes snowFall {
          0% {
            transform: translateY(-10vh);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh);
            opacity: 0;
          }
        }

        @keyframes snowSway {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(20px);
          }
          100% {
            transform: translateX(-10px);
          }
        }

        /* Frost screen glow behind card */
        .frost-screen {
          position: absolute;
          inset: -140px;
          border-radius: 40px;
          background:
            radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.8), transparent 60%),
            radial-gradient(circle at 100% 100%, rgba(160, 205, 255, 0.6), transparent 60%);
          filter: blur(45px);
          opacity: 0.8;
          z-index: -1;
        }

        .frost-glass {
          backdrop-filter: blur(30px);
          background: rgba(255, 255, 255, 0.38);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 24px 60px rgba(70, 120, 170, 0.45),
            inset 0 0 30px rgba(255, 255, 255, 0.25);
        }

        .card-float {
          animation: floatCard 6s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes floatCard {
          0% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translateY(-6px) rotateX(1.5deg) rotateY(-1.5deg);
          }
          100% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg);
          }
        }

        .upload-zone {
          border-radius: 18px;
          border: 1px dashed rgba(255, 255, 255, 0.75);
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.35),
            rgba(230, 242, 255, 0.7)
          );
          box-shadow:
            inset 0 0 18px rgba(255, 255, 255, 0.7),
            0 18px 35px rgba(135, 180, 235, 0.3);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .upload-zone:hover {
          transform: translateY(-2px);
          box-shadow:
            inset 0 0 22px rgba(255, 255, 255, 0.9),
            0 22px 40px rgba(135, 190, 245, 0.4);
        }

        .preview-frame {
          position: relative;
          border-radius: 22px;
          padding: 4px;
          margin-top: 1.5rem;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.9),
            rgba(180, 210, 255, 0.7)
          );
          box-shadow:
            0 18px 40px rgba(110, 160, 220, 0.45),
            inset 0 0 22px rgba(255, 255, 255, 0.7);
          overflow: hidden;
          animation: frostIn 0.4s ease-out forwards;
        }

        .preview-frame img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: cover;
          border-radius: 18px;
        }

        .result-frame {
          margin-top: 1.75rem;
          border-radius: 22px;
          padding: 4px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.9),
            rgba(160, 210, 255, 0.75)
          );
          box-shadow:
            0 20px 48px rgba(90, 145, 215, 0.5),
            inset 0 0 26px rgba(255, 255, 255, 0.8);
        }

        .result-frame img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: cover;
          border-radius: 18px;
        }

        @keyframes frostIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .primary-btn {
          position: relative;
          width: 100%;
          border-radius: 999px;
          padding: 0.95rem 1.2rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          background: linear-gradient(135deg, #0f4780, #1e8dff);
          color: #ffffff;
          font-weight: 650;
          font-size: 0.95rem;
          letter-spacing: 0.4px;
          box-shadow:
            0 14px 35px rgba(30, 120, 255, 0.6),
            0 0 22px rgba(140, 200, 255, 0.75);
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }

        .primary-btn:hover:enabled {
          transform: translateY(-2px);
          box-shadow:
            0 18px 45px rgba(40, 135, 255, 0.7),
            0 0 26px rgba(155, 210, 255, 0.9);
        }

        .primary-btn:active:enabled {
          transform: translateY(1px) scale(0.98);
          box-shadow:
            0 8px 22px rgba(20, 100, 210, 0.7),
            0 0 16px rgba(130, 190, 255, 0.8);
        }

        .primary-btn:disabled {
          opacity: 0.7;
          cursor: default;
          box-shadow:
            0 10px 28px rgba(120, 160, 210, 0.5),
            0 0 12px rgba(160, 200, 245, 0.7);
        }

        .btn-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.75) 45%,
            transparent 80%
          );
          transform: translateX(-120%);
          animation: shimmer 3.2s ease-in-out infinite;
          mix-blend-mode: screen;
        }

        .download-btn {
          margin-top: 0.85rem;
          width: 100%;
          border-radius: 999px;
          padding: 0.8rem 1rem;
          border: 1px solid rgba(15, 71, 128, 0.24);
          background: rgba(255, 255, 255, 0.9);
          color: #123a63;
          font-weight: 600;
          font-size: 0.88rem;
          letter-spacing: 0.2px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          box-shadow: 0 10px 26px rgba(100, 150, 210, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .download-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 14px 30px rgba(110, 160, 220, 0.5);
        }

        .download-btn:active {
          transform: translateY(1px) scale(0.98);
          box-shadow: 0 8px 20px rgba(90, 140, 205, 0.5);
        }

        footer {
          opacity: 0.75;
          font-size: 0.7rem;
          letter-spacing: 0.4px;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.35));
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-130%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          60% {
            transform: translateX(0%);
            opacity: 1;
          }
          100% {
            transform: translateX(130%);
            opacity: 0;
          }
        }

        @keyframes auroraWave {
          0% {
            transform: translate3d(-10px, 0, 0) skewX(-3deg);
          }
          50% {
            transform: translate3d(6px, -8px, 0) skewX(1deg);
          }
          100% {
            transform: translate3d(-4px, 6px, 0) skewX(-2deg);
          }
        }

        @keyframes snowDrift {
          0% {
            transform: translate3d(0, -15px, 0);
          }
          100% {
            transform: translate3d(0, 15px, 0);
          }
        }
      `}</style>

      {/* Winter background layers */}
      <div className="winter-layer aurora" />
      <div className="winter-layer snowfield" />
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={`flake-${i}`}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${10 + Math.random() * 10}s, ${6 + Math.random() * 6
              }s`,
            animationDelay: `${Math.random() * 8}s, ${Math.random() * 5}s`,
            fontSize: `${10 + Math.random() * 10}px`,
          }}
        >
          ❄
        </div>
      ))}

      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 py-10"
      >
        <div
          className="relative w-full max-w-md frost-glass card-float"
          style={{
            padding: "2.2rem 1.9rem 1.6rem",
          }}
        >
          <div className="frost-screen" />

          {/* Logo */}
          <div className="w-full flex justify-center mb-4">
            <img
              src="/iceball_logo.png"
              alt="IceBall logo"
              style={{
                width: "140px",
                maxWidth: "50%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Header */}
          <header className="text-center mb-4">
            <h1
              className="text-3xl font-bold"
              style={{
                fontWeight: 800,
                letterSpacing: "-0.06em",
                color: "#102540",
              }}
            >
              آماده‌ای یخ بزنی؟
            </h1>
            <p
              className="mt-2 text-sm text-gray-700"
              style={{ fontWeight: 300 }}
            >
              عکست رو بده؛ من سردترین حالتت رو می‌سازم ❄
            </p>
          </header>

          {/* Upload box */}
          <label className="block cursor-pointer upload-zone px-4 py-5 text-center">
            <p
              className="text-gray-800 mb-1"
              style={{ fontWeight: 600, fontSize: "0.95rem" }}
            >
              عکست رو برام بفرست
            </p>
            <p
              className="text-xs text-gray-600"
              style={{ fontWeight: 300, opacity: 0.9 }}
            >
              (فرمت PNG یا JPG، نور معمولی، صورت واضح)
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>

          {/* Preview */}
          {preview && (
            <div className="preview-frame mt-6">
              <img src={preview} alt="preview" />
            </div>
          )}

          {/* Generate button */}
          <div className="mt-6">
            <button
              onClick={handleGenerate}
              disabled={!image || loading}
              className="primary-btn"
            >
              {loading ? "در حال ساخت پرتره زمستونی..." : "بزن که یخ بزنی"}
              <span className="btn-shimmer" />
            </button>

            {/* Download button – only when output exists */}
            {output && (
              <button
                type="button"
                className="download-btn"
                onClick={handleDownload}
              >
                <span>دانلود تصویر نهایی</span>
                <span style={{ fontSize: "1.1rem" }}>⬇️</span>
              </button>
            )}
          </div>

          {/* Result */}
          {output && (
            <div className="result-frame mt-6">
              <img src={output} alt="generated portrait" />
            </div>
          )}

          {/* Footer */}
          <footer className="mt-5 text-center text-gray-700">
            <span style={{ fontWeight: 300 }}>تگمون کن </span>
            <span style={{ fontWeight: 600 }}>@Iceball_ir</span>
            <span style={{ marginLeft: 4 }}>❄</span>
          </footer>
        </div>
      </main>
    </>
  );
}