"use client";

import { useState, useTransition } from "react";
import type { CpuSaver } from "@/lib/cpuSaver";
import { setCpuSaver } from "./cpuSaverActions";

function when(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** Owner's on/off switch for lib/cpuSaver.ts. */
export default function CpuSaverSwitch({ initial }: { initial: CpuSaver }) {
  const [saver, setSaver] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function flip() {
    const next = !saver.on;
    setError(null);
    startTransition(async () => {
      const result = await setCpuSaver(next);
      if (result.saver) setSaver(result.saver);
      else setError(result.error ?? "Could not save.");
    });
  }

  return (
    <section
      className={`mt-4 rounded-2xl border p-4 ${saver.on ? "border-amber-400 bg-amber-50" : "border-gold-200 bg-white"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-maroon-800">CPU saver {saver.on ? "ON" : "OFF"}</h2>
          <p className="mt-1 text-sm text-maroon-700/80">
            {saver.on
              ? `On since ${when(saver.changedAt)}. POS rate/stock changes are NOT reaching the website. Turn it off when Vercel CPU is fine again.`
              : "Turn on when Vercel's Fluid Active CPU is running out. POS updates pause; orders and pages keep working."}
          </p>
        </div>
        <button
          type="button"
          onClick={flip}
          disabled={pending}
          role="switch"
          aria-checked={saver.on}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
            saver.on ? "bg-green-700" : "bg-maroon-700"
          }`}
        >
          {pending ? "Saving…" : saver.on ? "Turn off" : "Turn on"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
