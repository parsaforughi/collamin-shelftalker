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
    a.download = "collamin-portrait.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShareToInstagram() {
    if (!output) return;

    try {
      // Convert blob URL to File
      const response = await fetch(output);
      const blob = await response.blob();
      const file = new File([blob], "collamin-portrait.png", { type: "image/png" });

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Collamin Portrait",
        });
      } else {
        // Fallback: Try to open Instagram app directly
        window.location.href = "instagram://story-camera";
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Fallback: Open Instagram app
      window.location.href = "instagram://story-camera";
    }
  }

  // اسکرول و اوپاسیتی اولیه
  useEffect(() => {
    document.body.style.overflowY = "auto";
  }, []);

  // ❄ Canvas Snow Engine - DISABLED
  // useEffect(() => {
  //   const canvas = document.getElementById("snow-canvas") as HTMLCanvasElement | null;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   let width = window.innerWidth;
  //   let height = window.innerHeight;
  //   const dpr = window.devicePixelRatio || 1;

  //   function resize() {
  //     width = window.innerWidth;
  //     height = window.innerHeight;
  //     if (canvas) {
  //       canvas.width = width * dpr;
  //       canvas.height = height * dpr;
  //     }
  //     if (ctx) {
  //       ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to device pixel ratio
  //     }
  //   }

  //   resize();
  //   window.addEventListener("resize", resize);

  //   type Flake = {
  //     x: number;
  //     y: number;
  //     r: number;
  //     vy: number;
  //     vx: number;
  //     alpha: number;
  //   };

  //   function makeFlake(): Flake {
  //     return {
  //       x: Math.random() * width,
  //       y: Math.random() * height,
  //       r: 1 + Math.random() * 2.8,
  //       vy: 0.6 + Math.random() * 1.4,
  //       vx: -0.4 + Math.random() * 0.8,
  //       alpha: 0.4 + Math.random() * 0.6,
  //     };
  //   }

  //   const flakes: Flake[] = Array.from({ length: 140 }, () => makeFlake());
  //   let frameId: number;

  //   function render() {
  //     if (!ctx) return;
  //     ctx.clearRect(0, 0, width, height);

  //     for (const f of flakes) {
  //       f.y += f.vy;
  //       f.x += f.vx + Math.sin(f.y / 60) * 0.4; // کمی انحنا شبیه باد

  //       if (f.y > height + 12) {
  //         f.y = -12;
  //         f.x = Math.random() * width;
  //       }
  //       if (f.x > width + 12) f.x = -12;
  //       if (f.x < -12) f.x = width + 12;

  //       ctx.globalAlpha = f.alpha;
  //       ctx.beginPath();
  //       ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  //       ctx.fillStyle = "#ffffff";
  //       ctx.fill();
  //     }

  //     ctx.globalAlpha = 1;
  //     frameId = requestAnimationFrame(render);
  //   }

  //   render();

  //   return () => {
  //     window.removeEventListener("resize", resize);
  //     cancelAnimationFrame(frameId);
  //   };
  // }, []);

  return (
    <>
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: #aeddd7 !important;
          scroll-behavior: smooth;
        }
        
        html {
          background: #aeddd7 !important;
        }

        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 20% 0%, rgba(174, 221, 215, 0.8), transparent 60%),
            radial-gradient(circle at 80% 100%, rgba(150, 210, 200, 0.6), transparent 65%);
          mix-blend-mode: normal;
          opacity: 0.7;
          pointer-events: none;
          z-index: -3;
        }

        /* Frost glass card */
        .frost-glass {
          background: #f4e2d8;
          border-radius: 24px;
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          border: 1px solid rgba(20, 178, 170, 0.2);
          box-shadow:
            0 18px 45px rgba(20, 178, 170, 0.15),
            0 6px 18px rgba(20, 178, 170, 0.1);
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
            radial-gradient(circle at 10% 20%, rgba(20, 178, 170, 0.15), transparent 55%),
            radial-gradient(circle at 80% 70%, rgba(23, 162, 184, 0.12), transparent 65%);
          filter: blur(60px);
          animation: auroraWave 17s ease-in-out infinite alternate;
          opacity: 0.6;
        }

        .winter-layer.snowfield {
          background: radial-gradient(circle, rgba(20, 178, 170, 0.05) 1px, transparent 1px);
          background-size: 160px 160px;
          animation: snowDrift 25s linear infinite;
          opacity: 0.2;
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

        /* Canvas Snow */
        .snow-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
        }

        .frost-glass,
        .result-frame,
        .preview-frame {
          position: relative;
          z-index: 10;
        }

        /* ICE reveal */
        .ice-reveal {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          animation: crackReveal 1.1s ease-out forwards;
          box-shadow:
            inset 0 0 20px rgba(255, 255, 255, 0.8),
            0 14px 30px rgba(20, 178, 170, 0.25);
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.95), #f0f8f8);
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
          border: 1px dashed rgba(20, 178, 170, 0.5);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: inset 0 0 14px rgba(20, 178, 170, 0.1);
          transition:
            box-shadow 0.25s ease,
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .upload-zone:hover {
          border-color: rgba(20, 178, 170, 0.8);
          box-shadow:
            inset 0 0 18px rgba(20, 178, 170, 0.15),
            0 8px 22px rgba(23, 162, 184, 0.2);
          transform: translateY(-2px);
        }

        .preview-frame {
          border-radius: 20px;
          padding: 0.3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 250, 250, 0.95));
          box-shadow:
            0 12px 26px rgba(20, 178, 170, 0.25),
            inset 0 0 18px rgba(255, 255, 255, 0.9);
        }

        .result-frame {
          border-radius: 20px;
          padding: 0.3rem;
          background: linear-gradient(135deg, rgba(245, 252, 252, 0.98), rgba(240, 250, 250, 0.98));
          box-shadow:
            0 16px 32px rgba(20, 178, 170, 0.3),
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
          background: #3c8e7c;
          color: #ffffff;
          font-weight: 650;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 14px 35px rgba(60, 142, 124, 0.5),
            0 0 20px rgba(60, 142, 124, 0.4);
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
          border-radius: 999px;
          padding: 0.95rem;
          background: rgba(60, 142, 124, 0.85);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          color: #ffffff;
          font-weight: 650;
          position: relative;
          overflow: hidden;
          box-shadow:
            inset 0 0 14px rgba(255, 255, 255, 0.2),
            0 14px 35px rgba(60, 142, 124, 0.4),
            0 0 20px rgba(60, 142, 124, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .download-btn:hover {
          background: rgba(60, 142, 124, 0.9);
          box-shadow:
            inset 0 0 18px rgba(255, 255, 255, 0.3),
            0 8px 22px rgba(60, 142, 124, 0.5),
            0 0 25px rgba(60, 142, 124, 0.4);
          transform: translateY(-2px);
        }

        .download-btn:disabled {
          opacity: 0.5;
          cursor: default;
          box-shadow: none;
        }

        .download-btn:not(:disabled):active {
          transform: scale(0.97);
        }

        .share-instagram-btn {
          width: 100%;
          border-radius: 999px;
          padding: 0.95rem;
          background: rgba(60, 142, 124, 0.85);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          color: #ffffff;
          font-weight: 650;
          position: relative;
          overflow: hidden;
          box-shadow:
            inset 0 0 14px rgba(255, 255, 255, 0.2),
            0 14px 35px rgba(60, 142, 124, 0.4),
            0 0 20px rgba(60, 142, 124, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .share-instagram-btn:hover {
          background: rgba(60, 142, 124, 0.9);
          box-shadow:
            inset 0 0 18px rgba(255, 255, 255, 0.3),
            0 8px 22px rgba(60, 142, 124, 0.5),
            0 0 25px rgba(60, 142, 124, 0.4);
          transform: translateY(-2px);
        }

        .share-instagram-btn:disabled {
          opacity: 0.5;
          cursor: default;
          box-shadow: none;
        }

        .share-instagram-btn:not(:disabled):active {
          transform: scale(0.97);
        }
      `}</style>

      {/* Background layers */}
      <div className="winter-layer aurora" />
      <div className="winter-layer snowfield" />
      {/* Canvas Snow - DISABLED */}
      {/* <canvas id="snow-canvas" className="snow-canvas" /> */}

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
              src="/collamin_logo.png"
              alt="Collamin logo"
              style={{ width: "140px", height: "auto", objectFit: "contain" }}
            />
          </div>

          {/* HEADER */}
          <header className="text-center mb-4">
            <h1
              className="text-3xl font-bold"
              style={{ color: "#245b4e", fontWeight: 800 }}
            >
              آماده ای با ۲۰ سال بعد مواجه بشی ؟
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "#555", fontWeight: 300 }}
            >
              عکست رو بده تا آیندت رو نشون بدم
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
              {loading ? "در حال ساخت پرتره زمستونی..." : "نشونم بده"}
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
            <div className="mt-4 flex flex-col gap-3">
              <button className="download-btn" onClick={handleDownload}>
                دانلود تصویر نهایی ⬇️
              </button>
              <button
                className="share-instagram-btn"
                onClick={handleShareToInstagram}
              >
                📷 اشتراک در استوری اینستاگرام
              </button>
            </div>
          )}

          {/* FOOTER */}
          <footer className="mt-5 text-center text-gray-700">
            <span style={{ fontWeight: 300 }}>تگمون کن </span>
            <a
              href="https://www.instagram.com/collamin.iran/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, color: "inherit", textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <img
                src="/instagram-icon.png"
                alt="Instagram"
                style={{ width: "16px", height: "16px", objectFit: "contain" }}
              />
              collamin.iran
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}