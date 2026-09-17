import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowRight, Building2, MapPin, X, SlidersHorizontal, ChevronDown, Eye } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useProperties } from '../../hooks/useProperties';
import { getAreasFromProperties } from '../../utils/popularAreas';
import {
  LISTING_TYPES, PROPERTY_TYPES, BEDROOM_OPTIONS, PRICE_PRESETS, SORT_OPTIONS, DEFAULT_FILTERS,
  matchesAreaFilters, countActiveFilters, filtersFromParams, paramsFromFilters, listingsUrlFor, formatKshShort,
} from '../../utils/areaFilters';
import AreaImageCarousel from '../../components/AreaImageCarousel';
import { Sheet, SheetContent, SheetTitle } from '../../components/ui/sheet';

const PAGE_SIZE = 24;

// Average for the intent being browsed. With "All" selected we quote the
// sale average (rents and prices must never be blended) and list the split.
const avgPriceOf = (a, listingType) => {
  if (listingType === 'rent') return a.rentPricedCount ? a.rentPriceSum / a.rentPricedCount : null;
  if (a.salePricedCount) return a.salePriceSum / a.salePricedCount;
  if (listingType === 'sale') return null;
  return a.rentPricedCount ? a.rentPriceSum / a.rentPricedCount : null;
};

// ── Small controls ────────────────────────────────────────────────────────
const Segmented = ({ options, value, onChange, isDark, className = '' }) => (
  <div className={`flex rounded-xl p-1 text-xs font-semibold border ${isDark ? 'bg-[#0e1311] border-gray-700/60' : 'bg-white border-gray-200'} ${className}`}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        aria-pressed={value === opt.value}
        className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 transition-all ${
          value === opt.value
            ? 'bg-black text-white shadow dark:bg-white dark:text-black'
            : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Chips = ({ options, value, onChange, isDark }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value || 'any'}
          type="button"
          onClick={() => onChange(active && opt.value !== '' ? '' : opt.value)}
          aria-pressed={active}
          className={`min-h-[40px] rounded-full border px-3.5 text-sm font-medium transition-colors ${
            active
              ? 'border-[#fbbf24] bg-[#fbbf24] text-[#111]'
              : isDark ? 'border-gray-700/60 bg-[#0e1311] text-gray-200 hover:border-gray-500' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// Native select styled to match the page; native pickers are the best UI on
// phones and need no JS.
const NativeSelect = ({ label, value, onChange, options, isDark, className = '' }) => (
  <label className={`relative inline-flex items-center ${className}`}>
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 w-full appearance-none rounded-xl border pl-3 pr-9 text-sm font-medium outline-none transition-colors focus:border-[#fbbf24]/60 ${
        isDark ? 'bg-[#0e1311] border-gray-700/60 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {options.map((opt) => (
        <option key={opt.value || 'any'} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400" />
  </label>
);

const FilterField = ({ label, children }) => (
  <div>
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p>
    {children}
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────
const AreaDirectory = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Same query key as the home page so the directory and Popular Areas agree.
  const { data, isLoading } = useProperties({ limit: 1000 });

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const [queryInput, setQueryInput] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [navHeight, setNavHeight] = useState(0);

  const setFilters = useCallback((next) => {
    setSearchParams(paramsFromFilters({ ...DEFAULT_FILTERS, ...next }), { replace: true });
  }, [setSearchParams]);
  const update = (patch) => setFilters({ ...filters, ...patch });

  // Debounce the search box into the URL.
  useEffect(() => {
    const id = setTimeout(() => { if (queryInput !== filters.q) update({ q: queryInput }); }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);
  useEffect(() => { setQueryInput(filters.q); }, [filters.q]);
  useEffect(() => { setShown(PAGE_SIZE); }, [filters]);

  // The site header is fixed; measure it so the filter bar sticks below it.
  useEffect(() => {
    const measure = () => setNavHeight(document.querySelector('header')?.offsetHeight || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const properties = data?.properties || [];
  const allAreas = useMemo(() => getAreasFromProperties(properties), [properties]);
  const matching = useMemo(() => properties.filter((p) => matchesAreaFilters(p, filters)), [properties, filters]);
  const filteredAreas = useMemo(() => getAreasFromProperties(matching), [matching]);

  const visibleAreas = useMemo(() => {
    let list = filteredAreas;
    const q = filters.q.trim().toLowerCase();
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
    const avg = (a) => { const v = avgPriceOf(a, filters.listingType); return v ?? Infinity; };
    switch (filters.sort) {
      case 'az': return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case 'cheapest': return [...list].sort((a, b) => avg(a) - avg(b) || b.count - a.count);
      case 'priciest': return [...list].sort((a, b) => (avg(b) === Infinity ? -1 : avg(b)) - (avg(a) === Infinity ? -1 : avg(a)) || b.count - a.count);
      case 'views': return [...list].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0) || b.count - a.count);
      default: return list; // already sorted by count
    }
  }, [filteredAreas, filters.q, filters.sort]);

  const activeCount = countActiveFilters(filters);
  const priceOptions = PRICE_PRESETS[filters.listingType === 'rent' ? 'rent' : 'sale'];
  const priceLabel = filters.listingType === 'rent' ? 'Monthly rent' : filters.listingType === 'sale' ? 'Price' : 'Price (sale)';

  const openSheet = () => { setDraft(filters); setSheetOpen(true); };
  const applyDraft = () => { setFilters(draft); setSheetOpen(false); };
  const clearAll = () => { setQueryInput(''); setFilters({ ...DEFAULT_FILTERS, sort: filters.sort }); };

  const activeChips = [
    filters.listingType !== 'all' && { key: 'listingType', label: LISTING_TYPES.find((t) => t.value === filters.listingType)?.label },
    filters.propertyType && { key: 'propertyType', label: PROPERTY_TYPES.find((t) => t.value === filters.propertyType)?.label },
    filters.minBeds && { key: 'minBeds', label: `${filters.minBeds}+ beds` },
    filters.price && { key: 'price', label: priceOptions.find((p) => p.value === filters.price)?.label || 'Price' },
  ].filter(Boolean);

  const avgFor = (a) => formatKshShort(avgPriceOf(a, filters.listingType));
  const priceNoun = filters.listingType === 'rent' ? 'avg rent' : 'avg price';

  const surface = isDark ? 'bg-[#0e1311] border-gray-700/60' : 'bg-white border-gray-200';
  const ink = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-white/60' : 'text-gray-600';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#000000]' : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 md:pt-28 lg:px-8" style={navHeight ? { paddingTop: navHeight + 24 } : undefined}>
        {/* Header */}
        <div className="mb-6 text-center md:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#fbbf24]/20 bg-black/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-black dark:bg-white/10 dark:text-white">
            <MapPin className="h-3.5 w-3.5" />
            Area Directory
          </div>
          <h1 className={`mb-2 text-3xl font-bold md:mb-4 md:text-5xl ${ink}`}>
            Explore{' '}
            <span className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">Every Area</span>
          </h1>
          <p className={`mx-auto max-w-2xl text-sm md:text-lg ${muted}`}>
            {isLoading
              ? 'Loading neighborhoods…'
              : activeCount > 0 || filters.q
                ? `${visibleAreas.length} of ${allAreas.length} areas · ${visibleAreas.reduce((s, a) => s + a.count, 0).toLocaleString()} matching listings`
                : `${allAreas.length} neighborhoods across Kenya · ${properties.length.toLocaleString()} listings`}
          </p>
        </div>

        {/* Sticky controls */}
        <div
          className={`sticky z-20 -mx-4 mb-5 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${isDark ? 'bg-black/85' : 'bg-gray-50/90'}`}
          style={{ top: navHeight }}
        >
          <div className="flex flex-col gap-3">
            {/* Row 1: search, listing type, mobile filters button */}
            <div className="flex items-center gap-2">
              <div className={`relative min-w-0 flex-1 ${ink}`}>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search areas, e.g. Westlands"
                  aria-label="Search areas"
                  className={`h-11 w-full rounded-xl border pl-10 pr-9 text-sm outline-none transition-colors focus:border-[#fbbf24]/60 ${surface}`}
                />
                {queryInput && (
                  <button type="button" onClick={() => setQueryInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Segmented options={LISTING_TYPES} value={filters.listingType} onChange={(v) => update({ listingType: v, price: '' })} isDark={isDark} className="hidden sm:flex" />
              <button
                type="button"
                onClick={openSheet}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold lg:hidden ${surface} ${ink}`}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeCount > 0 && <span className="rounded-full bg-[#fbbf24] px-1.5 text-[11px] font-bold text-[#111]">{activeCount}</span>}
              </button>
            </div>

            {/* Row 2 (desktop): inline filters */}
            <div className="hidden items-center gap-2 lg:flex">
              <NativeSelect label="Property type" value={filters.propertyType} onChange={(v) => update({ propertyType: v })} options={[{ value: '', label: 'Any type' }, ...PROPERTY_TYPES]} isDark={isDark} className="w-40" />
              <NativeSelect label="Bedrooms" value={filters.minBeds} onChange={(v) => update({ minBeds: v })} options={BEDROOM_OPTIONS.map((b) => ({ ...b, label: b.value ? `${b.label} beds` : 'Any beds' }))} isDark={isDark} className="w-36" />
              <NativeSelect label={priceLabel} value={filters.price} onChange={(v) => update({ price: v })} options={priceOptions} isDark={isDark} className="w-44" />
              <div className="ml-auto flex items-center gap-2">
                <span className={`text-xs ${muted}`}>Sort</span>
                <NativeSelect label="Sort areas" value={filters.sort} onChange={(v) => update({ sort: v })} options={SORT_OPTIONS} isDark={isDark} className="w-48" />
              </div>
            </div>

            {/* Row 2 (mobile): listing type + sort */}
            <div className="flex items-center gap-2 lg:hidden">
              <Segmented options={LISTING_TYPES} value={filters.listingType} onChange={(v) => update({ listingType: v, price: '' })} isDark={isDark} className="flex-1 sm:hidden" />
              <NativeSelect label="Sort areas" value={filters.sort} onChange={(v) => update({ sort: v })} options={SORT_OPTIONS} isDark={isDark} className="w-44 shrink-0 sm:ml-auto" />
            </div>

            {/* Active filter chips */}
            {(activeChips.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => update({ [chip.key]: chip.key === 'listingType' ? 'all' : '', ...(chip.key === 'listingType' ? { price: '' } : {}) })}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fbbf24]' : 'border-[#f59e0b]/40 bg-[#fbbf24]/15 text-[#7a4b00]'}`}
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className={`text-xs underline-offset-2 hover:underline ${muted}`}>Clear all</button>
              </div>
            )}
          </div>
        </div>

        {/* Areas grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : visibleAreas.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {visibleAreas.slice(0, shown).map((area) => {
                const avg = avgFor(area);
                return (
                  <a
                    key={area.name}
                    href={listingsUrlFor(area.name, filters)}
                    onClick={(e) => { e.preventDefault(); navigate(listingsUrlFor(area.name, filters)); }}
                    className={`group overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/60 ${isDark ? 'bg-[#0e1311]' : 'bg-white'}`}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '260px' }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-800">
                      <AreaImageCarousel images={area.images} name={area.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        {area.count} listing{area.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className={`px-3 pb-3.5 pt-3 ${ink}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold md:text-base">{area.name}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-[#fbbf24] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                      <p className={`mt-0.5 flex items-center gap-2 text-xs ${muted}`}>
                        {filters.listingType === 'all' ? (
                          <span className="truncate tabular-nums">
                            {area.saleCount ? `${area.saleCount} for sale` : ''}
                            {area.saleCount && area.rentCount ? ' · ' : ''}
                            {area.rentCount ? `${area.rentCount} to rent` : ''}
                            {!area.saleCount && !area.rentCount ? 'Mixed listings' : ''}
                          </span>
                        ) : avg ? (
                          <span className="tabular-nums">{avg} {priceNoun}</span>
                        ) : (
                          <span>Price on request</span>
                        )}
                        {filters.sort === 'views' && area.totalViews ? (
                          <span className="ml-auto inline-flex items-center gap-1 tabular-nums"><Eye className="h-3 w-3" />{area.totalViews.toLocaleString()}</span>
                        ) : null}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
            {visibleAreas.length > shown && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className={`min-h-[44px] rounded-full border px-6 text-sm font-semibold transition-colors ${surface} ${ink} hover:border-[#fbbf24]/60`}
                >
                  Show more areas ({visibleAreas.length - shown} left)
                </button>
              </div>
            )}
          </>
        ) : properties.length === 0 ? (
          <div className={`py-20 text-center ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">Listings are unavailable right now</p>
            <p className="mt-1 text-sm">Check your connection and try again in a moment.</p>
          </div>
        ) : (
          <div className={`py-20 text-center ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">{filters.q ? `No areas match "${filters.q}"` : 'No areas match these filters'}</p>
            <p className="mt-1 text-sm">Try widening the price range or bedrooms.</p>
            <button type="button" onClick={clearAll} className="mt-5 rounded-full bg-[#fbbf24] px-5 py-2.5 text-sm font-semibold text-[#111]">Clear filters</button>
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className={`max-h-[85vh] overflow-y-auto rounded-t-2xl p-5 ${isDark ? 'dark' : ''}`}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          <SheetTitle className={`mb-4 text-base font-semibold ${ink}`}>Filter areas</SheetTitle>
          <div className="space-y-5">
            <FilterField label="Looking to">
              <Segmented options={LISTING_TYPES} value={draft.listingType} onChange={(v) => setDraft({ ...draft, listingType: v, price: '' })} isDark={isDark} />
            </FilterField>
            <FilterField label="Property type">
              <Chips options={[{ value: '', label: 'Any' }, ...PROPERTY_TYPES]} value={draft.propertyType} onChange={(v) => setDraft({ ...draft, propertyType: v })} isDark={isDark} />
            </FilterField>
            <FilterField label="Bedrooms">
              <Chips options={BEDROOM_OPTIONS} value={draft.minBeds} onChange={(v) => setDraft({ ...draft, minBeds: v })} isDark={isDark} />
            </FilterField>
            <FilterField label={draft.listingType === 'rent' ? 'Monthly rent' : 'Price'}>
              <Chips options={PRICE_PRESETS[draft.listingType === 'rent' ? 'rent' : 'sale']} value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} isDark={isDark} />
            </FilterField>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={() => setDraft({ ...DEFAULT_FILTERS, q: draft.q, sort: draft.sort })} className={`min-h-[44px] flex-1 rounded-full border text-sm font-semibold ${surface} ${ink}`}>
              Reset
            </button>
            <button type="button" onClick={applyDraft} className="min-h-[44px] flex-1 rounded-full bg-[#fbbf24] text-sm font-semibold text-[#111]">
              Show {properties.filter((p) => matchesAreaFilters(p, draft)).length.toLocaleString()} listings
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AreaDirectory;
