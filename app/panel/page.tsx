"use client";

import { FormEvent, useMemo, useState } from "react";

type PersonaResult = {
  category?: string;
  tone?: string;
  color?: string;
  product?: string;
  opener?: string;
};

const fieldLabels: Array<[keyof PersonaResult, string]> = [
  ["category", "Category"],
  ["tone", "Tone"],
  ["color", "Color"],
  ["product", "Suggested Product"],
  ["opener", "Opener"],
];

export default function PanelPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [persona, setPersona] = useState<PersonaResult | null>(null);

  const personabotUrl = process.env.NEXT_PUBLIC_PERSONABOT_URL;
  const personabotKey = process.env.NEXT_PUBLIC_PERSONABOT_KEY;

  const missingConfig = useMemo(() => !personabotUrl || !personabotKey, [personabotUrl, personabotKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setPersona(null);
    if (missingConfig) {
      setStatus("error");
      setErrorMessage("PERSONABOT_URL or key is not configured in the environment.");
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setStatus("error");
      setErrorMessage("Please enter an Instagram username.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${personabotUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${personabotKey}`
        },
        body: JSON.stringify({ username: trimmedUsername })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorDetail = errorBody?.error ?? response.statusText;
        throw new Error(errorDetail || "Failed to analyze persona.");
      }

      const data = await response.json();
      setPersona({
        category: data?.category,
        tone: data?.tone,
        color: data?.color,
        product: data?.product,
        opener: data?.opener
      });
      setStatus("success");
    } catch (error) {
      console.error("Persona analysis failed", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Try again."
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-white/90 p-8 shadow-2xl shadow-slate-900/50 backdrop-blur">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Persona Analysis</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Instagram Persona Panel</h1>
          <p className="mt-2 text-sm text-slate-500">Enter a username to understand tone, colors, and the right opener.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <label className="block text-sm font-medium text-slate-600" htmlFor="username">
            Instagram Username
          </label>
          <div className="flex gap-3">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="username"
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ice-500 focus:outline-none focus:ring-2 focus:ring-ice-500/60"
            />
            <button
              type="submit"
              disabled={status === "loading" || missingConfig}
              className="inline-flex items-center justify-center rounded-2xl bg-ice-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Analyzing…" : "Analyze Persona"}
            </button>
          </div>
          {missingConfig && (
            <p className="text-xs text-amber-600">
              Configure `NEXT_PUBLIC_PERSONABOT_URL` and `NEXT_PUBLIC_PERSONABOT_KEY` to enable requests.
            </p>
          )}
          {status === "error" && errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </form>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
          {status === "loading" && (
            <p className="text-sm text-slate-500">Loading persona insights…</p>
          )}
          {persona && status === "success" && (
            <dl className="space-y-4">
              {fieldLabels.map(([key, label]) => {
                const value = persona[key];
                return (
                  <div key={key}>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</dt>
                    <dd className="mt-1 text-lg font-medium text-slate-900">{value ?? "Not provided"}</dd>
                  </div>
                );
              })}
            </dl>
          )}
          {status === "idle" && !persona && (
            <p className="text-sm text-slate-500">No analysis yet. Submit a username to begin.</p>
          )}
        </div>
      </section>
    </main>
  );
}
