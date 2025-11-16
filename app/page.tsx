"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function Page() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // cleanup output url
  useEffect(() => {
    return () => {
      if (output) URL.revokeObjectURL(output);
    };
  }, [output]);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setImage(file);
    setOutput(null);

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

    try {
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

      // اسکرول نرم تا نتیجه
      setTimeout(() => {
        const el = document.getElementById("result-section");
        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 200);
    } catch (err) {
      console.error("Generate error", err);
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!output) return;
    const a = document.createElement("a");
    a.href = output;
    a.download = "iceball-portrait.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: radial-gradient(circle at top, #d6ecff 0%, #eaf2ff 35%, #ffffff 80%);
          scroll-behavior: smooth;
          overflow-x: hidden;
        }

        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.55), transparent 60%),
            radial-gradient(circle at 80% 100%, rgba(180, 210, 255, 0.45), transparent 65%);
          mix-blend-mode: screen;
          opacity: 0.5;
          pointer-events: none;
          z-index: -3;
        }

        /* Frost glass card */
        .frost-glass {
          background: rgba(255, 255, 255, 0.38);
          border-radius: 24px;
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 18px 45px rgba(0, 50, 110, 0.18),
            0 6px 18px rgba(0, 40, 90, 0.12);
        }

        .card-float {
          animation: floatCard 4.8s ease-in-out infinite;
        }

        @keyframes floatCard {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-7px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        /* Background layers */
        .winter-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -2;
        }

        .winter-layer.aurora {
          background:
            radial-gradient(circle at 10% 20%, rgba(140, 190, 255, 0.45), transparent 55%),
            radial-gradient(circle at 80% 70%, rgba(190, 225, 255, 0.4), transparent 65%);
          filter: blur(60px);
          animation: auroraWave 17s ease-in-out infinite alternate;
          opacity: 0.9;
        }

        .winter-layer.snowfield {
          background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 1px, transparent 1px);
          background-size: 160px 160px;
          animation: snowDrift 25s linear infinite;
          opacity: 0.35;
        }

        @keyframes auroraWave {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-12px) translateX(8px);
          }
          100% {
            transform: translateY(6px) translateX(-6px);
          }
        }

        @keyframes snowDrift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(40px);
          }
        }

        /* Snowflakes */
        .snowflake {
          position: fixed;
          top: -5%;
          color: rgba(255, 255, 255, 0.96);
          text-shadow:
            0 0 6px rgba(140, 190, 255, 0.9),
            0 0 14px rgba(140, 190, 255, 1);
          animation-name: snowFall, snowSway;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          z-index: 5;
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
            transform: translateX(18px);
          }
          100% {
            transform: translateX(-10px);
          }
        }

        .snow-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
        }

        /* ICE reveal (بدون ماسک خراب‌کننده) */
        .ice-reveal {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          animation: crackReveal 1.1s ease-out forwards;
          box-shadow:
            inset 0 0 20px rgba(255, 255, 255, 0.8),
            0 14px 30px rgba(60, 120, 190, 0.35);
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.95), #e4f1ff);
        }

        .ice-reveal img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          border-radius: 18px;
        }

        @keyframes crackReveal {
          0% {
            opacity: 0;
            filter: blur(16px);
            transform: scale(0.96);
          }
          60% {
            opacity: 1;
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        /* Upload zone */
        .upload-zone {
          border-radius: 18px;
          border: 1px dashed rgba(150, 190, 230, 0.9);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: inset 0 0 14px rgba(230, 240, 255, 0.9);
          transition:
            box-shadow 0.25s ease,
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .upload-zone:hover {
          border-color: rgba(40, 120, 255, 0.9);
          box-shadow:
            inset 0 0 18px rgba(230, 240, 255, 1),
            0 8px 22px rgba(60, 130, 220, 0.2);
          transform: translateY(-2px);
        }

        .preview-frame {
          border-radius: 20px;
          padding: 0.3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(210, 230, 255, 0.9));
          box-shadow:
            0 12px 26px rgba(80, 130, 200, 0.35),
            inset 0 0 18px rgba(255, 255, 255, 0.9);
        }

        .result-frame {
          border-radius: 20px;
          padding: 0.3rem;
          background: linear-gradient(135deg, rgba(230, 245, 255, 0.98), rgba(205, 230, 255, 0.98));
          box-shadow:
            0 16px 32px rgba(40, 100, 190, 0.45),
            inset 0 0 20px rgba(255, 255, 255, 0.95);
        }

        .result-frame img {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 18px;
          object-fit: cover;
        }

        /* Buttons */
        .primary-btn {
          width: 100%;
          border-radius: 999px;
          padding: 0.95rem;
          background: linear-gradient(135deg, #0f4780, #1e8dff);
          color: white;
          font-weight: 650;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 14px 35px rgba(30, 120, 255, 0.6),
            0 0 20px rgba(140, 200, 255, 0.7);
          border: none;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: default;
          box-shadow: none;
        }

        .primary-btn:not(:disabled):active {
          transform: scale(0.97);
        }

        .btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.9) 45%,
            transparent 80%
          );
          transform: translateX(-130%);
          animation: shimmer 3.3s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-130%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(130%);
            opacity: 0;
          }
        }

        .download-btn {
          width: 100%;
          margin-top: 0.85rem;
          padding: 0.95rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #ffffff, #e8f3ff);
          font-weight: 700;
          color: #0d294a;
          border: 1px solid rgba(100, 140, 200, 0.32);
          box-shadow:
            0 12px 28px rgba(40, 120, 200, 0.28),
            0 0 18px rgba(180, 215, 255, 0.8);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            0 14px 32px rgba(40, 120, 200, 0.38),
            0 0 20px rgba(180, 215, 255, 1);
        }

        .download-btn:active {
          transform: scale(0.97);
        }

        .download-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.8) 45%,
            transparent 90%
          );
          transform: translateX(-130%);
          animation: shimmerDL 3.6s infinite;
          pointer-events: none;
        }

        @keyframes shimmerDL {
          0% {
            transform: translateX(-130%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(130%);
            opacity: 0;
          }
        }
      `}</style>

      {/* Background layers */}
      <div className="winter-layer aurora" />
      <div className="winter-layer snowfield" />

      {/* Snow container – ensures snow renders above all layers */}
      <div className="snow-container">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${11 + Math.random() * 10}s, ${6 + Math.random() * 5}s`,
              fontSize: `${10 + Math.random() * 14}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <main
        dir="rtl"
        className="min-h-screen w-full flex justify-center px-4 py-10"
        style={{ alignItems: "center" }}
      >
        <div
          className="relative w-full max-w-md frost-glass card-float"
          style={{ padding: "2.2rem 1.9rem 1.8rem" }}
        >
          {/* LOGO */}
          <div className="w-full flex justify-center mb-4">
            <img
              src="/iceball_logo.png"
              alt="IceBall logo"
              style={{ width: "140px", height: "auto" }}
            />
          </div>

          {/* HEADER */}
          <header className="text-center mb-4">
            <h1
              className="text-3xl font-bold"
              style={{ color: "#102540", fontWeight: 800 }}
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

          {/* UPLOAD ZONE */}
          <label className="block cursor-pointer upload-zone px-4 py-5 text-center">
            <p
              className="text-gray-800 mb-1"
              style={{ fontWeight: 600 }}
            >
              عکست رو برام بفرست
            </p>
            <p
              className="text-xs text-gray-600"
              style={{ opacity: 0.9 }}
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

          {/* PREVIEW */}
          {preview && (
            <div className="preview-frame mt-6 ice-reveal">
              <img src={preview} alt="preview" />
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="mt-6">
            <button
              disabled={!image || loading}
              onClick={handleGenerate}
              className="primary-btn"
            >
              {loading ? "در حال ساخت پرتره زمستونی..." : "بزن که یخ بزنی"}
              {!loading && <span className="btn-shimmer" />}
            </button>
          </div>

          {/* RESULT */}
          {output && (
            <div
              id="result-section"
              className="result-frame mt-6 ice-reveal"
            >
              <img src={output} alt="generated" />
            </div>
          )}
          {output && (
            <button className="download-btn mt-4" onClick={handleDownload}>
              دانلود تصویر نهایی ⬇️
            </button>
          )}

          {/* FOOTER */}
          <footer className="mt-5 text-center text-gray-700">
            <span style={{ fontWeight: 300 }}>تگمون کن </span>
            <span style={{ fontWeight: 600 }}>@Iceball_ir</span>
            <span> ❄</span>
          </footer>
        </div>
      </main>
    </>
  );
}