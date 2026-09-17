import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Bed, Bath, Ruler, MapPin, Eye, ZoomIn, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPropertyImages, handleImageError } from '../../utils/imageUtils';
import { cn } from '@/lib/utils';

// The one listing card for the whole site: the browse grid, the map list
// and the user's saved homes. Price is the hero, the title is one line,
// meta sits on one row, and the photo carries a rent/sale badge and the
// save button. Arrows show on hover; dots do the job otherwise.

const listingKind = (p) => {
  const raw = String(p?.listingType || p?.listing_type || p?.purpose || p?.type || '').toLowerCase();
  if (/rent|let/.test(raw)) return 'rent';
  if (/sale|sell|buy/.test(raw)) return 'sale';
  const title = String(p?.title || '').toLowerCase();
  if (/to let|for rent|rental/.test(title)) return 'rent';
  if (/for sale/.test(title)) return 'sale';
  return '';
};

const formatKsh = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `Ksh ${n.toLocaleString()}` : 'Price on request';
};

export const listingArea = (p) => {
  const loc = p?.location;
  if (typeof loc === 'string') return loc;
  const part1 = loc?.area || loc?.neighbourhood || loc?.address || p?.address || '';
  const part2 = loc?.city || loc?.county || p?.city || '';
  if (part1 && part2 && part1.toLowerCase().trim() !== part2.toLowerCase().trim()) return `${part1}, ${part2}`;
  return part1 || part2 || 'Kenya';
};

// Skeleton that matches the card's proportions.
export function ListingCardSkeleton({ viewMode = 'grid' }) {
  const row = viewMode === 'list';
  return (
    <div className={cn('animate-pulse overflow-hidden rounded-lg border border-border bg-card', row ? 'flex' : '')}>
      <div className={cn('bg-muted', row ? 'h-32 w-44 shrink-0' : 'aspect-[3/2]')} />
      <div className="flex-1 space-y-2 p-3">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ListingCard({
  property,
  viewMode = 'grid',
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  onMarkerHover,
  onQuickView,
  className,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, toggleFavorite, isFavorite } = useAuth();
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const images = getPropertyImages(property);
  const hasMultiple = images.length > 1;
  const kind = listingKind(property);
  const saved = !!(isFavorite && property?.id && isFavorite(property.id));
  const verified = !!(property?.agent?.verified || property?.agentVerified || property?.verified);
  const views = Number(property?.views || property?.viewsCount || 0);
  const sqm = Number(property?.sizeSqm || property?.area_sqm || 0);
  const href = `/property/${property.id}`;
  const row = viewMode === 'list';

  const go = (e) => {
    e.preventDefault();
    navigate(href, { state: { property } });
  };
  const step = (dir) => setCurrent((i) => (i + dir + images.length) % images.length);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  const onSave = async (e) => {
    stop(e);
    if (!currentUser) { navigate('/auth', { state: { from: location } }); return; }
    if (!toggleFavorite || busy) return;
    setBusy(true);
    try { await toggleFavorite(property); } finally { setBusy(false); }
  };

  const onTouchEnd = () => {
    const d = touchStart.current - touchEnd.current;
    if (!hasMultiple || Math.abs(d) < 50) return;
    step(d > 0 ? 1 : -1);
  };

  return (
    <a
      href={href}
      onClick={go}
      onMouseEnter={() => { onMouseEnter?.(property.id); onMarkerHover?.(property.id); }}
      onMouseLeave={() => { onMouseLeave?.(); onMarkerHover?.(null); }}
      className={cn(
        'group block overflow-hidden rounded-lg border bg-card text-card-foreground transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isHighlighted ? 'border-primary shadow-lg' : 'border-border hover:shadow-md',
        row && 'flex',
        className
      )}
    >
      {/* Photo */}
      <div
        className={cn('relative shrink-0 overflow-hidden bg-muted', row ? 'h-32 w-44 sm:h-36 sm:w-52' : 'aspect-[3/2]')}
        onTouchStart={(e) => { touchStart.current = e.targetTouches[0].clientX; touchEnd.current = touchStart.current; }}
        onTouchMove={(e) => { touchEnd.current = e.targetTouches[0].clientX; }}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {images.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={i === 0 ? property.title || '' : ''}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={(e) => handleImageError(e, null, property)}
              className="h-full w-full shrink-0 object-cover"
            />
          ))}
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {kind && (
            <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              {kind === 'rent' ? 'For rent' : 'For sale'}
            </span>
          )}
          {(property.featured || property.is_featured) && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">Featured</span>
          )}
        </div>

        {/* Save + quick view */}
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => { stop(e); onQuickView(property); }}
              aria-label="Quick view"
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white sm:flex"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            aria-label={saved ? 'Remove from saved homes' : 'Save this home'}
            aria-pressed={saved}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors',
              saved ? 'bg-white text-red-500' : 'bg-white/90 text-gray-800 hover:bg-white hover:text-red-500'
            )}
          >
            <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Carousel controls */}
        {hasMultiple && (
          <>
            <button type="button" onClick={(e) => { stop(e); step(-1); }} aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={(e) => { stop(e); step(1); }} aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.slice(0, 6).map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full bg-white transition-all', i === current ? 'w-4' : 'w-1.5 opacity-60')} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Body */}
      <div className={cn('min-w-0 p-3', row && 'flex flex-1 flex-col justify-center')}>
        <p className="flex items-baseline gap-1 text-base font-semibold tabular-nums leading-tight text-foreground">
          {formatKsh(property.price)}
          {kind === 'rent' && Number(property.price) > 0 && <span className="text-xs font-normal text-muted-foreground">/month</span>}
        </p>
        <p className="mt-1 truncate text-sm text-foreground/90">{property.title || 'Untitled listing'}</p>
        <p className="mt-1.5 flex min-w-0 items-center gap-x-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" />{listingArea(property)}</span>
          {Number(property.bedrooms) > 0 && <span className="flex shrink-0 items-center gap-1 tabular-nums"><Bed className="h-3.5 w-3.5" />{property.bedrooms}</span>}
          {Number(property.bathrooms) > 0 && <span className="flex shrink-0 items-center gap-1 tabular-nums"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>}
          {sqm > 0 && <span className="hidden shrink-0 items-center gap-1 tabular-nums sm:flex"><Ruler className="h-3.5 w-3.5" />{sqm.toLocaleString()} m²</span>}
        </p>
        {(views > 0 || verified) && (
          <p className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 tabular-nums">{views > 0 && <><Eye className="h-3 w-3" />{views.toLocaleString()} views</>}</span>
            {verified && <span className="flex items-center gap-1 text-foreground/80"><BadgeCheck className="h-3.5 w-3.5 text-primary" />Verified agent</span>}
          </p>
        )}
      </div>
    </a>
  );
}
