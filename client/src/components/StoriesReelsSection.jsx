import React, { useState, useEffect } from 'react';
import { Play, Video, MessageCircle, X, ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

// Exclude test / dummy video IDs
const EXCLUDED_TIKTOK_IDS = new Set(['7106594312292453675']);

function formatPrice(val) {
  if (typeof val === 'number') {
    if (val <= 0) return 'Price on Request';
    if (val >= 1000000) {
      return `KES ${(val / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    if (val >= 1000) {
      return `KES ${val.toLocaleString()}`;
    }
    return `KES ${(val * 1000).toLocaleString()}`;
  }
  return val ? `KES ${val}` : 'Price on Request';
}

export default function StoriesReelsSection({ onClose, isSplitView = false, propertyData = [] }) {
  const { isDark } = useTheme();
  const [videoListings, setVideoListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch real listings with videos from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadRealVideoListings() {
      try {
        setLoading(true);

        // First take any from props that have real video IDs
        const propVideos = (propertyData || [])
          .filter(p => p && (p.hasVideo || p.tiktokId) && !EXCLUDED_TIKTOK_IDS.has(p.tiktokId))
          .map(p => ({
            id: p.id,
            title: p.title || 'Property Walkthrough',
            price: formatPrice(p.price),
            location: p.location?.area || p.location?.city || p.location?.address || 'Nairobi, Kenya',
            avatar: p.videoThumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop',
            videoId: p.tiktokId,
            tag: p.propertyType || p.listingType || 'Site Tour'
          }));

        // Fetch from Firestore collection 'listings' where hasVideo == true
        const q = query(
          collection(db, 'listings'),
          where('hasVideo', '==', true),
          limit(100)
        );
        const snap = await getDocs(q);

        const fetchedVideos = [];
        snap.forEach(docSnap => {
          const d = docSnap.data();
          if (d.tiktokId && !EXCLUDED_TIKTOK_IDS.has(d.tiktokId)) {
            fetchedVideos.push({
              id: docSnap.id,
              title: d.title || 'Property Walkthrough',
              price: formatPrice(d.price),
              location: d.location?.area || d.location?.city || d.location?.address || 'Nairobi, Kenya',
              avatar: d.videoThumbnail || d.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop',
              videoId: d.tiktokId,
              tag: d.propertyType || d.listingType || 'Site Tour'
            });
          }
        });

        // Merge and deduplicate by videoId
        const seen = new Set();
        const combined = [...propVideos, ...fetchedVideos].filter(item => {
          if (!item.videoId || seen.has(item.videoId)) return false;
          seen.add(item.videoId);
          return true;
        });

        if (isMounted) {
          setVideoListings(combined);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load video listings from Firestore:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadRealVideoListings();

    return () => {
      isMounted = false;
    };
  }, [propertyData]);

  const activeStory = videoListings[currentIndex] || videoListings[0];

  // Maploti Kenya Agent Phone from TikTok (@maploti.kenya)
  const waNumber = '254705906024';
  const waMessage = activeStory
    ? encodeURIComponent(
        `Hi Maploti Kenya, I'm watching the "${activeStory.title}" (${activeStory.price}) site tour on your website and would like to book a guided physical site visit.`
      )
    : '';

  return (
    <div className={`w-full ${isSplitView ? 'h-full flex flex-col p-4 bg-[#0a0a0a]' : 'py-4'}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          {/* Amber pulse dot - NO GREEN */}
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">
            Site Walkthroughs
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
            TikTok Tours ({videoListings.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.tiktok.com/@maploti.kenya"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>@maploti.kenya</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {isSplitView && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close stories view"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <span className="text-xs">Loading verified video walkthroughs...</span>
        </div>
      ) : videoListings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 p-8 text-center">
          <Video className="w-10 h-10 text-white/80" />
          <h4 className="text-sm font-semibold text-white">No Video Walkthroughs Found</h4>
          <p className="text-xs text-gray-500 max-w-xs">
            Videos from @maploti.kenya will appear here once loaded.
          </p>
        </div>
      ) : (
        /* Main Split Layout: Player on Left, Playlist & Details on Right */
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 overflow-hidden">
          {/* Left: 9:16 Vertical Video Player */}
          <div className="w-full md:w-[330px] lg:w-[340px] flex-shrink-0 h-[480px] md:h-full bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {activeStory?.videoId && (
              <iframe
                key={activeStory.videoId + currentIndex}
                src={`https://www.tiktok.com/player/v1/${activeStory.videoId}?autoplay=1&muted=0&description=0`}
                title={activeStory.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>

          {/* Right: Selected Property Info & Playlist */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
            {/* Current Selection Card */}
            {activeStory && (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                    {activeStory.tag}
                  </span>
                  <span className="text-white font-mono text-sm font-bold">
                    {activeStory.price}
                  </span>
                </div>

                <h4 className="text-white font-bold text-sm md:text-base truncate">
                  {activeStory.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {activeStory.location}
                </p>

                <a
                  href={`https://wa.me/${waNumber}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 w-full py-3 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Book Guided Site Visit on WhatsApp
                </a>
              </div>
            )}

            {/* Playlist Heading */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Available Video Tours ({videoListings.length})
              </span>
            </div>

            {/* Scrollable Playlist of Real Properties */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {videoListings.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={item.id + item.videoId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full p-2.5 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-white/10 border-white/20 shadow-sm'
                        : 'bg-[#0a0a0a]/60 hover:bg-[#0a0a0a] border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Thumbnail with gold/amber ring (NO GREEN) */}
                    <div className={`w-12 h-12 rounded-xl p-[1.5px] flex-shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-tr from-white via-zinc-400 to-zinc-600'
                        : 'bg-white/10'
                    }`}>
                      <img
                        src={item.avatar}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-[10px]"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop';
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-white'}`}>
                          {item.title}
                        </p>
                        {isActive && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-black bg-white px-1.5 py-0.2 rounded">
                            Playing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[11px] text-gray-400 truncate">{item.location}</span>
                        <span className="text-[11px] font-mono font-semibold text-white/80">{item.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
