"use client";

import { useEffect, useState } from "react";

export default function StatsPage() {
  const [stats, setStats] = useState<{
    successfulGenerations: number;
    totalGenerations: number;
    failedGenerations: number;
    averageProcessingTime: number;
    storyImagesGenerated: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("خطا در بارگذاری");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        setError("نتونستم آمار رو بگیرم.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#aeddd7] flex items-center justify-center" dir="rtl">
        <p className="text-[#245b4e] font-medium">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-[#aeddd7] flex items-center justify-center" dir="rtl">
        <p className="text-red-600 font-medium">{error || "آمار در دسترس نیست."}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#aeddd7] flex flex-col items-center justify-center px-4 py-10"
      dir="rtl"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center shadow-lg"
        style={{
          background: "#f4e2d8",
          border: "1px solid rgba(20, 178, 170, 0.2)",
          boxShadow: "0 18px 45px rgba(20, 178, 170, 0.15)",
        }}
      >
        <h1 className="text-xl font-bold text-[#245b4e] mb-6">شمارنده استفاده</h1>

        <div className="text-5xl font-extrabold text-[#245b4e] mb-2">
          {stats.successfulGenerations.toLocaleString("fa-IR")}
        </div>
        <p className="text-[#245b4e]/80 text-sm font-medium mb-8">بار استفاده شده</p>

        <div className="border-t border-[#245b4e]/20 pt-4 space-y-2 text-sm text-[#245b4e]/90">
          <p>
            کل درخواست‌ها: <strong>{stats.totalGenerations.toLocaleString("fa-IR")}</strong>
          </p>
          <p>
            ناموفق: <strong>{stats.failedGenerations.toLocaleString("fa-IR")}</strong>
          </p>
          <p>
            تصویر استوری ساخته‌شده:{" "}
            <strong>{stats.storyImagesGenerated.toLocaleString("fa-IR")}</strong>
          </p>
          <p>
            میانگین زمان تولید: <strong>{stats.averageProcessingTime}</strong> ثانیه
          </p>
        </div>

        <a
          href="/"
          className="inline-block mt-6 px-6 py-2 rounded-full text-sm font-semibold text-[#245b4e] border-2 border-[#245b4e]/40 hover:bg-[#245b4e]/10 transition-colors"
        >
          بازگشت به صفحه اصلی
        </a>
      </div>
    </div>
  );
}
