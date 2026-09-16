import HeroCinematic from "../components/hero/HeroCinematic";
import Card from "../components/card/card";

const swatches = [
  { name: "obsidian-900", hex: "#0c0e13", role: "app background" },
  { name: "obsidian-800", hex: "#14171f", role: "surface" },
  { name: "obsidian-600", hex: "#262b39", role: "border" },
  { name: "chlorophyll-300", hex: "#000000", role: "signal / mint" },
  { name: "ember-500", hex: "#f25c0d", role: "warm accent" },
  { name: "bone-50", hex: "#fafaf7", role: "headline text" },
  { name: "bone-200", hex: "#e7e5dd", role: "body text" },
  { name: "bone-400", hex: "#a9a69a", role: "muted" },
];

const typeSamples = [
  { fam: "Fraunces / Display", cls: "font-display", weight: "300", style: { fontVariationSettings: "'opsz' 144, 'SOFT' 0" }, sample: "Nairobi at dusk" },
  { fam: "Fraunces / Display Italic Soft", cls: "font-display italic", weight: "300", style: { fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }, sample: "piece of Kenya" },
  { fam: "Instrument Sans / Body", cls: "font-sans-nn", weight: "400", style: {}, sample: "Curated apartments, plots and homes across Kenya." },
  { fam: "JetBrains Mono / Data", cls: "font-mono-nn", weight: "500", style: {}, sample: "KSh 145,000 · 01°17′S 36°49′E" },
];

const demoProperties = [
  {
    id: "demo-1",
    title: "Sunlit maisonette in Kilimani with garden",
    price: 145000,
    address: "Kilimani, Nairobi",
    bedroom: 3,
    bathroom: 2,
    type: "Maisonette",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "demo-2",
    title: "Ocean-facing loft above Nyali beach",
    price: 92000,
    address: "Nyali, Mombasa",
    bedroom: 2,
    bathroom: 2,
    type: "Loft",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "demo-3",
    title: "Riverside townhouse with acacia courtyard",
    price: 210000,
    address: "Karen, Nairobi",
    bedroom: 4,
    bathroom: 3,
    type: "Townhouse",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60",
  },
];

export default function DesignPreview() {
  return (
    <div className="nn-app nn-grain min-h-screen bg-obsidian-900">
      <HeroCinematic />

      {/* ── Palette ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 md:px-14 py-24">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="font-mono-nn text-[11px] uppercase tracking-[0.2em] text-chlorophyll-300 mb-3">
              01 · Palette
            </div>
            <h2 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[0.95] tracking-[-0.03em] text-bone-50"
                style={{ fontVariationSettings: "'opsz' 144" }}>
              Nairobi Nocturne
            </h2>
          </div>
          <p className="font-sans-nn text-bone-400 max-w-md">
            Obsidian for depth, ember for warmth (Kenyan sunset iron rooftops),
            chlorophyll mint (#000000) elevated as the signal color.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {swatches.map((s) => (
            <div key={s.name} className="rounded-2xl overflow-hidden border border-white/[0.06]">
              <div className="aspect-[4/3]" style={{ background: s.hex }} />
              <div className="p-4 bg-obsidian-800">
                <div className="font-mono-nn text-[11px] uppercase tracking-[0.14em] text-bone-50">
                  {s.name}
                </div>
                <div className="font-mono-nn text-[10px] text-bone-400 mt-1">{s.hex}</div>
                <div className="font-sans-nn text-[12px] text-bone-600 mt-2">{s.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 md:px-14 py-24 border-t border-white/[0.06]">
        <div className="mb-12">
          <div className="font-mono-nn text-[11px] uppercase tracking-[0.2em] text-chlorophyll-300 mb-3">
            02 · Typography
          </div>
          <h2 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[0.95] tracking-[-0.03em] text-bone-50"
              style={{ fontVariationSettings: "'opsz' 144" }}>
            A trio, not a system font.
          </h2>
        </div>

        <div className="space-y-10">
          {typeSamples.map((t) => (
            <div key={t.fam} className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-baseline border-t border-white/[0.06] pt-6">
              <div>
                <div className="font-mono-nn text-[11px] uppercase tracking-[0.16em] text-chlorophyll-300">
                  {t.fam}
                </div>
                <div className="font-mono-nn text-[10px] text-bone-600 mt-1">weight {t.weight}</div>
              </div>
              <div className={`${t.cls} text-bone-50 text-[clamp(1.5rem,1rem+2vw,2.5rem)] leading-[1.05] tracking-[-0.02em]`}
                   style={t.style}>
                {t.sample}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cards ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 md:px-14 py-24 border-t border-white/[0.06]">
        <div className="mb-12">
          <div className="font-mono-nn text-[11px] uppercase tracking-[0.2em] text-chlorophyll-300 mb-3">
            03 · Property card
          </div>
          <h2 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[0.95] tracking-[-0.03em] text-bone-50"
              style={{ fontVariationSettings: "'opsz' 144" }}>
            Hover me.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoProperties.map((p) => (
            <Card key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-white/[0.06] py-12 mx-auto max-w-[1400px] px-6 md:px-14">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="font-display italic text-bone-50 text-2xl tracking-[-0.02em]"
                 style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100, 'WONK' 1'" }}>
              MaplotiKenya
            </div>
            <div className="font-mono-nn text-[10px] uppercase tracking-[0.2em] text-bone-600 mt-1">
              Nairobi Nocturne · v1
            </div>
          </div>
          <div className="font-mono-nn text-[10px] uppercase tracking-[0.2em] text-bone-600">
            /design preview
          </div>
        </div>
      </footer>
    </div>
  );
}
