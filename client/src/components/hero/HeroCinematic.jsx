import { ArrowUpRight, Search, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Nairobi Nocturne — Cinematic Hero
 * Full-viewport dark stage, editorial serif with soft italic accents,
 * ember-warm radial atmosphere, mint signal CTAs.
 */
export default function HeroCinematic() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="nn-app relative min-h-[92vh] w-full overflow-hidden bg-obsidian-900">
      {/* Atmospheric layers */}
      <div className="absolute inset-0 bg-nn-radial-ember" aria-hidden />
      <div className="absolute inset-0 bg-nn-radial-mint" aria-hidden />

      {/* Vertical rail: coordinates ticker */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:block">
        <div className="font-mono-nn text-[10px] uppercase tracking-[0.24em] text-bone-600 [writing-mode:vertical-rl] rotate-180">
          01°17′S · 36°49′E · Nairobi
        </div>
      </div>

      {/* Top hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/[0.06]" />

      {/* Kicker cluster */}
      <div className={`relative mx-auto max-w-[1400px] px-6 md:px-14 pt-32 md:pt-40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex items-center gap-3 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-chlorophyll-300 shadow-[0_0_12px_2px_rgba(251,191,36,0.6)] animate-pulse" />
          <span className="font-mono-nn text-[11px] uppercase tracking-[0.2em] text-bone-400">
            Live · 771 verified listings across Kenya
          </span>
        </div>

        {/* Headline — serif display, mixed weights, italic pivot */}
        <h1 className="max-w-[18ch]">
          <span
            className="block font-display font-light text-bone-50 tracking-[-0.045em] leading-[0.92]"
            style={{
              fontSize: "clamp(3.5rem, 2rem + 8vw, 9rem)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 0, 'WONK' 0",
              animation: mounted ? "nn-fade-up 900ms cubic-bezier(0.16,1,0.3,1) both" : "none",
              animationDelay: "80ms",
            }}
          >
            Find your
          </span>
          <span
            className="block font-display italic text-chlorophyll-300 tracking-[-0.03em] leading-[0.95]"
            style={{
              fontSize: "clamp(3.5rem, 2rem + 8vw, 9rem)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
              animation: mounted ? "nn-fade-up 900ms cubic-bezier(0.16,1,0.3,1) both" : "none",
              animationDelay: "200ms",
            }}
          >
            piece of Kenya.
          </span>
        </h1>

        {/* Deck / subhead */}
        <p
          className="mt-10 max-w-[52ch] font-sans-nn text-[1.0625rem] leading-relaxed text-bone-200"
          style={{
            animation: mounted ? "nn-fade-up 900ms cubic-bezier(0.16,1,0.3,1) both" : "none",
            animationDelay: "360ms",
          }}
        >
          Curated apartments, plots and homes across Nairobi, Mombasa, Kisumu and beyond —
          plotted on a live map, filterable to the shilling.
        </p>

        {/* Search bar — obsidian pill with mint CTA */}
        <div
          className="mt-10 max-w-[720px] rounded-full bg-obsidian-800/80 border border-white/[0.08] backdrop-blur-md
                     flex items-center gap-2 p-2 pl-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
          style={{
            animation: mounted ? "nn-fade-up 900ms cubic-bezier(0.16,1,0.3,1) both" : "none",
            animationDelay: "500ms",
          }}
        >
          <MapPin className="h-4 w-4 text-bone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search Kilimani, Karen, Nyali, Runda…"
            className="flex-1 bg-transparent font-sans-nn text-[15px] text-bone-50 placeholder:text-bone-600 outline-none"
          />
          <button className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-chlorophyll-300 text-obsidian-950 font-sans-nn font-medium text-sm
                             transition-all duration-300 hover:bg-chlorophyll-200 hover:shadow-[0_0_60px_-12px_rgba(251,191,36,0.6)]">
            <Search className="h-4 w-4" strokeWidth={2.2} />
            Explore
          </button>
        </div>

        {/* Stat rail */}
        <div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[720px]"
          style={{
            animation: mounted ? "nn-fade-up 900ms cubic-bezier(0.16,1,0.3,1) both" : "none",
            animationDelay: "680ms",
          }}
        >
          {[
            { k: "771", v: "listings live", sub: "updated daily" },
            { k: "47", v: "counties", sub: "coverage" },
            { k: "12k+", v: "monthly seekers", sub: "and growing" },
            { k: "0", v: "commission", sub: "on searches" },
          ].map((s) => (
            <div key={s.v} className="border-l border-white/[0.08] pl-4">
              <div className="font-display text-[2.25rem] leading-none text-bone-50 tabular-nums tracking-[-0.03em]"
                   style={{ fontVariationSettings: "'opsz' 144" }}>
                {s.k}
              </div>
              <div className="mt-2 font-mono-nn text-[10px] uppercase tracking-[0.16em] text-chlorophyll-300">
                {s.v}
              </div>
              <div className="font-sans-nn text-[12px] text-bone-600 mt-0.5">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hairline + scroll cue */}
      <div className="absolute bottom-8 inset-x-0 px-6 md:px-14 flex items-end justify-between">
        <div className="font-mono-nn text-[10px] uppercase tracking-[0.2em] text-bone-600">
          MaplotiKenya · Est. 2026
        </div>
        <div className="hidden md:flex items-center gap-3 font-mono-nn text-[10px] uppercase tracking-[0.2em] text-bone-600">
          <span>Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-bone-600 to-transparent" />
        </div>
      </div>
    </section>
  );
}
