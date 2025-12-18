"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function generate() {
    if (!image) return;
    setLoading(true);
    setGenerated(null);

    const form = new FormData();
    form.append("image", await fetch(image).then((r) => r.blob()));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });

      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      setGenerated(`data:image/png;base64,${base64}`);

      // 🧊 جلوگیری از پریدن اسکرول بعد از رندر
      setTimeout(() => {
        window.scrollTo({
          top: 200,
          behavior: "smooth",
        });
      }, 300);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#e9f6ff] pb-32 flex flex-col items-center pt-10">

      {/* Collamin logo fixed */}
      <img
        src="/collamin_logo.png"
        alt="Collamin"
        className="w-[180px] max-w-[70%] object-contain mb-6"
        style={{ marginTop: "-10px" }}
      />

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        آماده‌ای یخ بزنی؟ ❄️
      </h1>

      <p className="text-gray-700 -mt-1 mb-6 text-center px-6">
        عکست رو بده؛ من سردترین نسخه‌ت رو می‌سازم
      </p>

      {/* Upload box */}
      <label className="bg-white shadow-lg rounded-xl px-6 py-4 border border-blue-200 cursor-pointer text-gray-800">
        <span className="font-semibold">عکست رو آپلود کن</span>
        <p className="text-sm text-gray-500">(فرمت JPG یا PNG)</p>
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </label>

      {/* Preview */}
      {image && (
        <img
          src={image}
          className="w-[85%] max-w-sm rounded-xl shadow-xl mt-6 border border-white"
        />
      )}

      {/* Generate button */}
      {image && (
        <button
          onClick={generate}
          disabled={loading}
          className="mt-6 px-10 py-4 bg-[#3ba4ff] text-white font-semibold rounded-xl shadow-lg hover:bg-[#2196f3] transition-all"
        >
          {loading ? "درحال ساخت..." : "❄️ بزن که یخ بزنی"}
        </button>
      )}

      {/* Result */}
      {generated && (
        <div className="mt-10 flex flex-col items-center">
          <img
            src={generated}
            className="w-[90%] max-w-sm rounded-xl shadow-xl border border-white"
          />

          {/* Download Button – clean, luxury, Collamin style */}
          <a
            href={generated}
            download="collamin_result.png"
            className="mt-6 px-8 py-4 bg-[#0b74d9] text-white font-semibold rounded-xl shadow-md hover:bg-[#005bbb] transition-all"
          >
            ⬇️ دانلود تصویر نهایی
          </a>
        </div>
      )}

      {/* Footer tag */}
      <p className="mt-16 text-gray-600 text-sm">
        ساخته شده برای <span className="font-semibold">collamin.iran</span>
      </p>

      <p className="text-gray-400 text-xs mt-1 mb-20">
        با عشق توسط سیلانه 💙
      </p>
    </div>
  );
}