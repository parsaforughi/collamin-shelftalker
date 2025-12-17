"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function Page() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [withoutCollamin, setWithoutCollamin] = useState<string | null>(null);
  const [withCollamin, setWithCollamin] = useState<string | null>(null);
  const [storyComparison, setStoryComparison] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Floating bottles state
  const [bottles, setBottles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    scale: number;
    speed: number;
    offset: number;
    dragging: boolean;
    dragOffset: { x: number; y: number } | null;
  }>>([]);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // cleanup image URLs
  useEffect(() => {
    return () => {
      if (withoutCollamin) URL.revokeObjectURL(withoutCollamin);
      if (withCollamin) URL.revokeObjectURL(withCollamin);
      if (storyComparison) URL.revokeObjectURL(storyComparison);
    };
  }, [withoutCollamin, withCollamin, storyComparison]);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // Check if image is portrait (vertical)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Check if image is portrait (height > width)
        if (img.width >= img.height) {
          setError("لطفا یک تصویر عمودی (portrait) آپلود کنید. عرض تصویر باید کمتر از ارتفاع باشد.");
          return;
        }
    setImage(file);
    setError(null);
    setWithoutCollamin(null);
    setWithCollamin(null);
    setStoryComparison(null);
    setSliderPosition(50);
    setPreview(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!image) return;

    setLoading(true);
    setError(null);
    setWithoutCollamin(null);
    setWithCollamin(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "خطا در اتصال به سرور";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await res.json();
      
      if (!data.futureWithoutCollamin || !data.futureWithCollamin) {
        setError("تصویر تولید نشد. لطفا دوباره تلاش کنید.");
        setLoading(false);
        return;
      }
      
      // Create blob URLs from base64 images
      try {
        const withoutBlob = base64ToBlob(data.futureWithoutCollamin, "image/png");
        const withBlob = base64ToBlob(data.futureWithCollamin, "image/png");
        
        setWithoutCollamin(URL.createObjectURL(withoutBlob));
        setWithCollamin(URL.createObjectURL(withBlob));
        
        // Handle story comparison image if available
        if (data.storyComparison) {
          const storyBlob = base64ToBlob(data.storyComparison, "image/png");
          setStoryComparison(URL.createObjectURL(storyBlob));
        }
        
        setSliderPosition(50);
        setLoading(false);

        // Scroll to result
        setTimeout(() => {
          const el = document.getElementById("comparison-section");
          if (el) {
            el.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 200);
      } catch (blobError) {
        console.error("Blob creation error", blobError);
        setError("خطا در پردازش تصویر");
        setLoading(false);
      }
    } catch (err) {
      console.error("Generate error", err);
      setError("خطا در اتصال به سرور. لطفا اتصال اینترنت خود را بررسی کنید.");
      setLoading(false);
    }
  }

  function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  function handleSliderMouseDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const slider = document.getElementById("comparison-slider");
    if (!slider) return;

    const updatePosition = (e: MouseEvent | TouchEvent) => {
      const rect = slider.getBoundingClientRect();
      const isTouch = "touches" in e;
      const clientX = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      updatePosition(e);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };

    updatePosition(e.nativeEvent);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);
  }

  function handleDownloadWithout() {
    if (!withoutCollamin) return;
    const a = document.createElement("a");
    a.href = withoutCollamin;
    a.download = "collamin-20-years-without.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDownloadWith() {
    if (!withCollamin) return;
    const a = document.createElement("a");
    a.href = withCollamin;
    a.download = "collamin-20-years-with.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDownloadStory() {
    if (!storyComparison) return;
    const a = document.createElement("a");
    a.href = storyComparison;
    a.download = "collamin-story-comparison.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleShareToInstagram() {
    if (!storyComparison) {
      // If story image not available, download it for user
      if (withoutCollamin && withCollamin) {
        handleDownloadStory();
        return;
      }
      return;
    }

    try {
      // Convert blob URL to File
      const response = await fetch(storyComparison);
      const blob = await response.blob();
      const file = new File([blob], "collamin-story.png", { type: "image/png" });

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "آینده‌ام با کلامین",
        });
      } else {
        // Fallback: Auto-download the story image
        handleDownloadStory();
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Fallback: Auto-download
      handleDownloadStory();
    }
  }

  // Initialize floating bottles on mount
  useEffect(() => {
    const initialBottles = [
      { id: 1, x: 15, y: 10, scale: 0.3, speed: 0.8, offset: 0, dragging: false, dragOffset: null },
      { id: 2, x: 80, y: 25, scale: 0.4, speed: 1.0, offset: 50, dragging: false, dragOffset: null },
      { id: 3, x: 20, y: 60, scale: 0.35, speed: 0.9, offset: 100, dragging: false, dragOffset: null },
      { id: 4, x: 75, y: 70, scale: 0.3, speed: 0.7, offset: 150, dragging: false, dragOffset: null },
      { id: 5, x: 10, y: 45, scale: 0.4, speed: 1.1, offset: 200, dragging: false, dragOffset: null },
      { id: 6, x: 85, y: 15, scale: 0.35, speed: 0.85, offset: 75, dragging: false, dragOffset: null },
    ];
    setBottles(initialBottles);
  }, []);

  // Floating animation
  useEffect(() => {
    if (bottles.length === 0) return;

    let animationId: number;
    let lastTime = Date.now();

    function animate() {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setBottles((prev) =>
        prev.map((bottle) => {
          if (bottle.dragging) return bottle;
          
          const time = currentTime / 1000;
          const baseY = bottle.y;
          const baseX = bottle.x;
          
          // Calculate floating offset (subtle movement)
          const floatY = Math.sin(time * bottle.speed + bottle.offset) * 0.8;
          const floatX = Math.cos(time * bottle.speed * 0.7 + bottle.offset) * 0.5;
          
          // Ensure bottles stay in safe zones
          const newX = Math.max(5, Math.min(95, baseX + floatX));
          const newY = Math.max(15, Math.min(85, baseY + floatY));
          
          // Avoid center card area (middle 40% width)
          const safeX = (newX < 30 || newX > 70) ? newX : (newX < 50 ? 30 : 70);
          
          return { ...bottle, x: safeX, y: newY };
        })
      );

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [bottles.length]);

  // Handle bottle drag
  function handleBottleMouseDown(e: React.MouseEvent, bottleId: number) {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect();
    
    if (!containerRect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setBottles((prev) =>
      prev.map((b) =>
        b.id === bottleId
          ? { ...b, dragging: true, dragOffset: { x: offsetX, y: offsetY } }
          : b
      )
    );

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRect) return;
      
      const x = ((e.clientX - containerRect.left - offsetX) / containerRect.width) * 100;
      const y = ((e.clientY - containerRect.top - offsetY) / containerRect.height) * 100;
      
      // Constrain to safe zones (avoid center 40% width, avoid top 15% and bottom 15%)
      const safeX = Math.max(5, Math.min(95, x));
      const safeY = Math.max(15, Math.min(85, y));
      
      // Avoid center card area (middle 40% width)
      const constrainedX = (safeX < 30 || safeX > 70) ? safeX : (safeX < 50 ? 30 : 70);
      
      setBottles((prev) =>
        prev.map((b) =>
          b.id === bottleId ? { ...b, x: constrainedX, y: safeY } : b
        )
      );
    };

    const handleMouseUp = () => {
      setBottles((prev) =>
        prev.map((b) =>
          b.id === bottleId ? { ...b, dragging: false, dragOffset: null } : b
        )
      );
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
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

        main {
          position: relative;
          z-index: 10;
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
          display: inline-block;
          border-radius: 20px;
          padding: 0.3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 250, 250, 0.95));
          box-shadow:
            0 12px 26px rgba(20, 178, 170, 0.25),
            inset 0 0 18px rgba(255, 255, 255, 0.9);
          width: fit-content;
          max-width: 100%;
        }

        .preview-frame img {
          display: block;
          width: auto;
          height: auto;
          max-width: 100%;
          border-radius: 18px;
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

        /* Comparison Slider */
        .comparison-container {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 16px 32px rgba(20, 178, 170, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.95);
        }

        .comparison-images {
          position: relative;
          width: 100%;
          padding-bottom: 133.33%; /* 3:4 portrait aspect ratio (vertical) */
          overflow: hidden;
        }

        .comparison-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .comparison-image-left {
          clip-path: inset(0 0 0 0);
        }

        .comparison-image-right {
          clip-path: inset(0 0 0 0);
        }

        .comparison-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(36, 91, 78, 0.6);
          transform: translateX(-50%);
          z-index: 20;
          pointer-events: none;
        }

        .comparison-handle {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(36, 91, 78, 0.6);
          border-radius: 50%;
          cursor: grab;
          z-index: 21;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .comparison-handle:active {
          cursor: grabbing;
        }

        .comparison-handle::before,
        .comparison-handle::after {
          content: "";
          position: absolute;
          width: 2px;
          height: 12px;
          background: rgba(36, 91, 78, 0.6);
        }

        .comparison-handle::before {
          left: 50%;
          transform: translateX(-50%) translateX(-6px);
        }

        .comparison-handle::after {
          left: 50%;
          transform: translateX(-50%) translateX(4px);
        }

        .comparison-labels {
          position: absolute;
          top: 12px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 22;
          pointer-events: none;
        }

        .comparison-label {
          background: rgba(255, 255, 255, 0.9);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #245b4e;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Visual difference hints */
        .skin-hint {
          position: absolute;
          font-size: 11px;
          color: rgba(36, 91, 78, 0.7);
          background: rgba(255, 255, 255, 0.75);
          padding: 4px 8px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          animation: fadeInHint 2s ease-in 1s forwards;
          backdrop-filter: blur(4px);
          z-index: 15;
        }

        @keyframes fadeInHint {
          to {
            opacity: 0.85;
          }
        }

        .hint-left-forehead {
          top: 15%;
          left: 25%;
        }

        .hint-left-eye {
          top: 35%;
          left: 30%;
        }

        .hint-right-forehead {
          top: 15%;
          right: 25%;
        }

        .hint-right-eye {
          top: 35%;
          right: 30%;
        }

        /* Product context card */
        .product-context {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 1.5rem;
          text-align: center;
          box-shadow: 0 4px 16px rgba(20, 178, 170, 0.1);
        }

        .product-context-text {
          font-size: 14px;
          font-weight: 500;
          color: #245b4e;
          margin-bottom: 1rem;
        }

        .product-image {
          width: 80px;
          height: auto;
          margin: 0 auto;
          opacity: 0.9;
        }

        /* Floating Bottles Background */
        .floating-bottles-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .floating-bottle {
          position: absolute;
          width: 120px;
          height: auto;
          opacity: 0.15;
          filter: blur(1px);
          transition: transform 0.3s ease-out;
          pointer-events: auto;
          cursor: grab;
          user-select: none;
          transform-origin: center;
        }

        .floating-bottle:hover {
          opacity: 0.2;
        }

        .floating-bottle:active {
          cursor: grabbing;
          opacity: 0.25;
        }

        .floating-bottle.dragging {
          transition: none;
          z-index: 2;
        }
      `}</style>

      {/* Background layers */}
      <div className="winter-layer aurora" />
      <div className="winter-layer snowfield" />
      
      {/* Floating Bottles Background */}
      <div className="floating-bottles-container">
        {bottles.map((bottle) => (
          <img
            key={bottle.id}
            src="/collamin-bottle.webp"
            alt=""
            className={`floating-bottle ${bottle.dragging ? "dragging" : ""}`}
            style={{
              left: `${bottle.x}%`,
              top: `${bottle.y}%`,
              transform: `translate(-50%, -50%) scale(${bottle.scale})`,
              transition: bottle.dragging ? "none" : "transform 0.3s ease-out",
            }}
            onMouseDown={(e) => handleBottleMouseDown(e, bottle.id)}
            draggable={false}
          />
        ))}
      </div>
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
              (فرمت PNG یا JPG، تصویر عمودی، نور معمولی، صورت واضح)
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
            <div className="preview-frame mt-6" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <img src={preview} alt="preview" />
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-600 text-sm" style={{ fontWeight: 500 }}>
                {error}
              </p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="mt-6">
            <button
              disabled={!image || loading}
              onClick={handleGenerate}
              className="primary-btn"
            >
              {loading ? "در حال آماده‌سازی..." : "نشونم بده"}
              {!loading && <span className="btn-shimmer" />}
            </button>
          </div>

          {/* COMPARISON SECTION */}
          {withoutCollamin && withCollamin && (
            <div id="comparison-section" className="mt-6">
              {/* Comparison Title */}
              <div className="text-center mb-4">
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "#245b4e", fontWeight: 700 }}
                >
                  یک آینده، دو انتخاب
                </h2>
              </div>

              {/* Comparison Slider */}
              <div
                id="comparison-slider"
                className="comparison-container"
                style={{ cursor: "col-resize" }}
              >
                <div className="comparison-images">
                  {/* Right Image (With Collamin) */}
                  <img
                    src={withCollamin}
                    alt="Future with Collamin"
                    className="comparison-image comparison-image-right"
                    style={{
                      clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                    }}
                  />

                  {/* Left Image (Without Collamin) */}
                  <img
                    src={withoutCollamin}
                    alt="Future without Collamin"
                    className="comparison-image comparison-image-left"
                    style={{
                      clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                    }}
                  />

                  {/* Divider Line */}
                  <div
                    className="comparison-divider"
                    style={{ left: `${sliderPosition}%` }}
                  />

                  {/* Handle */}
                  <div
                    className="comparison-handle"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={handleSliderMouseDown}
                    onTouchStart={handleSliderMouseDown}
                  />

                  {/* Labels */}
                  <div className="comparison-labels">
                    <div className="comparison-label">۲۰ سال بعد — بدون کلامین</div>
                    <div className="comparison-label">۲۰ سال بعد — با کلامین</div>
                  </div>
                </div>
              </div>

              {/* Context Text */}
              <p
                className="text-center mt-4 text-sm"
                style={{ color: "#666", fontWeight: 300, lineHeight: "1.6" }}
              >
                این مقایسه بر اساس تأثیر مراقبت مداوم از پوست در طول زمان نمایش داده شده است.
              </p>

              {/* Product Context */}
              <div className="product-context">
                <div className="product-context-text">مراقبت امروز، تفاوت فردا</div>
                <img
                  src="/collamin_logo.png"
                  alt="Collamin"
                  className="product-image"
                />
              </div>

              {/* Download Buttons Section */}
              <div className="mt-6">
                <h3
                  className="text-center mb-3 text-lg font-semibold"
                  style={{ color: "#245b4e" }}
                >
                  دانلود تصاویر
                </h3>
                <div className="flex flex-col gap-3">
                  <button 
                    className="download-btn" 
                    onClick={handleDownloadWithout}
                    disabled={!withoutCollamin}
                  >
                    دانلود عکس بدون کلامین ⬇️
                  </button>
                  <button 
                    className="download-btn" 
                    onClick={handleDownloadWith}
                    disabled={!withCollamin}
                  >
                    دانلود عکس با کلامین ⬇️
                  </button>
                  <button 
                    className="download-btn" 
                    onClick={handleDownloadStory}
                    disabled={!storyComparison}
                  >
                    دانلود نسخه استوری ⬇️
                  </button>
                </div>
              </div>

              {/* Share Button */}
              <div className="mt-6">
                <button
                  className="share-instagram-btn"
                  onClick={handleShareToInstagram}
                  disabled={!storyComparison}
                >
                  📷 اشتراک‌گذاری در استوری
                </button>
                <p
                  className="text-center mt-2 text-xs"
                  style={{ color: "#666", opacity: 0.8 }}
                >
                  این تصویر آماده انتشار در استوری است
                </p>
              </div>
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