import React, { useState } from 'react';
import { Camera, Play, Video, MessageCircle, ExternalLink, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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

/**
 * PropertyMediaTabs
 * Segmented control: "Photos" (renders children) / "Video Tour".
 * Street View is permanently disabled to protect the agent's exact beacon pins from being leaked.
 *
 * Props:
 *  - property: current listing object from Firestore
 *  - heightClass: tailwind height classes
 *  - children: photo gallery content
 *  - variant: 'desktop' | 'mobile'
 */
export default function PropertyMediaTabs({ property, heightClass, children, variant = 'desktop' }) {
  const { isDark } = useTheme();
  const [tab, setTab] = useState('photos');

  // Check if this specific property has a real matched video from Firestore
  const rawVideoUrl = property?.videoUrl || property?.tiktokUrl || property?.reelUrl || '';
  const tiktokMatch = String(rawVideoUrl).match(/video\/(\d+)/);
  const matchedTiktokId = property?.tiktokId || (tiktokMatch ? tiktokMatch[1] : null);
  
  // Exclude dummy placeholder IDs
  const hasSpecificVideo = Boolean(matchedTiktokId && matchedTiktokId !== '7106594312292453675');
  const tiktokId = hasSpecificVideo ? matchedTiktokId : null;

  const embedUrl = tiktokId
    ? (property?.embedUrl || `https://www.tiktok.com/player/v1/${tiktokId}?autoplay=1&muted=0&description=0`)
    : null;

  const agentPhone = property?.agentPhone || property?.contactPhone || property?.agent?.phone || '254705906024';
  
  // Real property info from Firestore
  const propertyTitle = property?.title || 'This Property';
  const propertyPrice = formatPrice(property?.price);
  const propertyLocation = property?.location?.area || property?.location?.city || property?.location?.address || 'Nairobi, Kenya';

  const waMessage = encodeURIComponent(
    hasSpecificVideo
      ? `Hi Maploti Kenya, I'm watching the video walkthrough for "${propertyTitle}" (${propertyPrice}) in ${propertyLocation} on your website and would like to book a site visit.`
      : `Hi Maploti Kenya, I'm viewing "${propertyTitle}" (${propertyPrice}) in ${propertyLocation} on your website. Please send me the video walkthrough and details.`
  );

  const radius = 'rounded-2xl';
  const pillBase = 'inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer';
  const activeCls = 'bg-white text-black font-bold shadow-md';
  const inactiveCls = isDark
    ? 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-black/5';

  const containerHeight = tab === 'video' ? 'h-[520px] sm:h-[560px]' : heightClass;

  return (
    <div className="w-full">
      {/* Segmented Control Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className={`inline-flex items-center gap-1 p-1 rounded-full border shadow-sm backdrop-blur-md ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setTab('photos')}
            className={`${pillBase} ${tab === 'photos' ? activeCls : inactiveCls}`}
            aria-pressed={tab === 'photos'}
          >
            <Camera className="w-4 h-4" />
            Photos
          </button>
          <button
            type="button"
            onClick={() => setTab('video')}
            className={`${pillBase} ${tab === 'video' ? activeCls : inactiveCls}`}
            aria-pressed={tab === 'video'}
          >
            <Play className="w-4 h-4 fill-current" />
            Video Tour
            {hasSpecificVideo && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {tab === 'video' && hasSpecificVideo && (
          <a
            href={property?.videoUrl || `https://www.tiktok.com/@maploti.kenya/video/${tiktokId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all shadow-sm"
          >
            <span>Watch on TikTok</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Media container */}
      <div className={`relative w-full ${containerHeight} ${radius} overflow-hidden bg-black transition-[height] duration-300`}>
        {/* Photos layer */}
        <div className={`${tab === 'photos' ? 'block' : 'hidden'} w-full h-full`}>
          {children}
        </div>

        {/* Video Tour layer */}
        <div className={`${tab === 'video' ? 'flex' : 'hidden'} w-full h-full items-center justify-center bg-[#0a0a0a] relative`}>
          {tab === 'video' && (
            hasSpecificVideo ? (
              /* Case 1: Property has its own matching verified TikTok video */
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <div className="w-full h-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-6">
                  {/* Vertical TikTok Embed (Centered, No Clipping on Mobile) */}
                  <div className="h-full w-full max-w-[340px] flex items-center justify-center shrink-0">
                    <iframe
                      src={embedUrl}
                      title={`${propertyTitle} Video Walkthrough`}
                      className="w-full h-full rounded-2xl border border-white/10 shadow-2xl bg-black"
                      allow="accelerometer; autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  </div>

                  {/* Desktop Only: Verified Tour Companion Panel */}
                  <div className="hidden lg:flex flex-1 max-w-md w-full flex-col justify-between p-6 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl text-white max-h-[92%] shadow-2xl">
                    <div>
                      {/* Header tags */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 shadow-sm">
                          <Video className="w-3.5 h-3.5" />
                          Verified Ground Walkthrough
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                          4K Tour
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                        Virtual On-Site Experience
                      </h3>
                      
                      <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                        Recorded on location by our field verification team. Preview actual natural lighting, room proportions, finishing quality, and external access roads before scheduling your physical viewing.
                      </p>

                      {/* Verified Tour Highlights */}
                      <div className="space-y-2.5 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Walkthrough Highlights
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Complete internal layout & bedroom finishes</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Compound security, parking & perimeter review</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Water pressure, power & infrastructure check</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2.5 pt-4 border-t border-white/10">
                      <a
                        href={`https://wa.me/${agentPhone}?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Book Guided Site Visit on WhatsApp</span>
                      </a>

                      <a
                        href={property?.videoUrl || `https://www.tiktok.com/@maploti.kenya/video/${tiktokId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Open on TikTok App</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Case 2: Property does not have a video yet */
              <div className="w-full max-w-md p-6 m-4 rounded-2xl bg-[#0a0a0a] border border-white/10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-1">
                  <Video className="w-7 h-7" />
                </div>
                
                <h4 className="text-base font-bold text-white">
                  No Video Uploaded Yet for this Listing
                </h4>
                
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                  We haven't attached a ground video walkthrough for <span className="text-white font-medium">"{propertyTitle}"</span> yet. 
                  Our agent is on site regularly and can record or send you a direct video walkthrough.
                </p>

                <div className="p-3 w-full rounded-xl bg-black/40 border border-white/5 text-left text-xs text-gray-300">
                  <div className="font-semibold text-white mb-0.5 truncate">{propertyTitle}</div>
                  <div className="text-white font-mono font-bold mb-1">{propertyPrice}</div>
                  <div className="text-gray-400 text-[11px] truncate">📍 {propertyLocation}</div>
                </div>

                <a
                  href={`https://wa.me/${agentPhone}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-1"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Request Video Tour from Agent
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
