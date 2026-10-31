
function PropertyDetailsSkeleton({ isDark }) {
  return (
    <div className={`min-h-screen pt-28 pb-16 ${isDark ? 'bg-[#000000]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className={`h-8 w-32 rounded-lg ${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}`}></div>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}`}></div>
            <div className={`h-9 w-9 rounded-lg ${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}`}></div>
            <div className={`h-9 w-9 rounded-full ${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {/* Two-column layout matching the real page */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Photo Gallery skeleton */}
            <div className={`relative rounded-2xl overflow-hidden h-96 md:h-[500px] border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-gray-200 border-gray-300'}`}>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              {/* Center Brand Spinner */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center mb-3">
                  <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-white animate-spin"></div>
                  <div className="absolute w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Loading Property Details...
                  </span>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Fetching verified listing & tour media</div>
                </div>
              </div>
              {/* Badges placeholder */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className={`h-6 w-20 rounded-md ${isDark ? 'bg-zinc-800/90' : 'bg-white/80'}`}></div>
                <div className={`h-6 w-16 rounded-md ${isDark ? 'bg-zinc-800/90' : 'bg-white/80'}`}></div>
              </div>
            </div>

            {/* Thumbnail strip skeleton */}
            <div className="flex gap-2.5 overflow-hidden animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-16 w-20 rounded-xl flex-shrink-0 ${isDark ? 'bg-zinc-800/60' : 'bg-gray-200'}`}></div>
              ))}
            </div>

            {/* Title & Price Card skeleton */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-4 animate-pulse`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className={`h-7 w-3/4 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
                  <div className={`h-4 w-1/3 rounded-md ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}`}></div>
                </div>
                <div className={`h-8 w-36 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
              </div>

              {/* 4 Feature stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-20 rounded-xl ${isDark ? 'bg-zinc-900/60' : 'bg-gray-100'}`}></div>
                ))}
              </div>
            </div>

            {/* Description Card skeleton */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-3 animate-pulse`}>
              <div className={`h-5 w-28 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
              <div className={`h-4 w-full rounded ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}`}></div>
              <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}`}></div>
              <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}`}></div>
            </div>
          </div>

          {/* Right column: Sticky Agent Card skeleton */}
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-4 text-center animate-pulse`}>
              <div className={`w-20 h-20 rounded-full mx-auto ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
              <div className={`h-5 w-32 rounded mx-auto ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
              <div className={`h-3 w-40 rounded mx-auto ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}`}></div>
              <div className="space-y-2.5 pt-2">
                <div className={`h-11 w-full rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
                <div className={`h-11 w-full rounded-full ${isDark ? 'bg-zinc-800/60' : 'bg-gray-200'}`}></div>
                <div className={`h-11 w-full rounded-full ${isDark ? 'bg-zinc-800/60' : 'bg-gray-200'}`}></div>
              </div>
            </div>

            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-3 animate-pulse`}>
              <div className={`h-5 w-32 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <div className={`h-3.5 w-20 rounded ${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}`}></div>
                  <div className={`h-3.5 w-16 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import './propertyDetails.scss';
import useAnalytics from '../../hooks/useAnalytics';
import {
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  Mail,
  MapPin,
  Bed,
  Bath,
  Building2,
  Car,
  Star,
  Calendar,
  DollarSign,
  Users,
  Home,
  School,
  TrendingUp,
  Clock,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Star as StarIcon,
  X,
  MessageCircle,
  CheckCircle,
  Check,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getPropertyCoords } from '../../utils/imageUtils';
import { getProperty } from '../../utils/api';
import { cleanAndDeduplicateProperties } from '../../utils/propertyUtils';
import { useProperty } from '../../hooks/useProperties';
import { messagesAPI } from '../../lib/firebaseAPI';
import { incrementPropertyView } from '../../lib/propertyViews';
import { getPropertyImages, handleImageError } from '../../utils/imageUtils';
import ApartmentVacancyDisplay from '../../components/ApartmentVacancyDisplay';
import { vacancyService } from '../../services/vacancyService';
import BookingModal from '../../components/modals/BookingModal';
import PropertyMediaTabs from '../../components/PropertyStreetView';

// Toast notification system
const showToast = (options) => {
  const toast = document.createElement('div');
  toast.className = `fixed top-6 right-6 z-[9999] transform transition-all duration-500 ease-out`;

  toast.innerHTML = `
    <div class="relative overflow-hidden rounded-2xl p-5 min-w-[300px] max-w-[400px] ${options.type === 'error'
      ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
      : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600'
    } text-white shadow-2xl backdrop-blur-xl border border-white/20">
      <!-- Animated background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]"></div>
      </div>
      
      <!-- Content -->
      <div class="relative flex items-start gap-4">
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm tracking-wide mb-1">${options.title}</div>
          <div class="text-xs opacity-90 leading-relaxed">${options.message}</div>
        </div>
      </div>
      
      <!-- Progress bar -->
      <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div class="h-full bg-white/60 animate-[progress_4s_linear]"></div>
      </div>
    </div>
  `;

  // Add custom CSS for progress animation
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes progress {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  // Initial position (off-screen)
  toast.style.transform = 'translateX(120%) scale(0.8)';
  toast.style.opacity = '0';

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0) scale(1)';
    toast.style.opacity = '1';
  }, 50);

  // Animate out
  setTimeout(() => {
    toast.style.transform = 'translateX(120%) scale(0.8)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 500);
  }, 4000);
};

// Full-screen photo viewer. Rendered into <body> so it sits above the fixed
// navbar. Shares the gallery's index, so it opens on the photo you were
// looking at and the page shows the photo you closed on.
function Lightbox({ images, index, onIndex, onClose, title }) {
  const railRef = useRef(null);
  const touchX = useRef(null);
  const count = images.length;
  const go = (d) => onIndex((index + d + count) % count);

  // Keyboard, and freeze the page behind (the body is the scroll container).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  });

  // Keep the active thumbnail in view.
  useEffect(() => {
    railRef.current?.children?.[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [index]);

  const ctrl = 'flex items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/80';

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex flex-col"
      style={{ backgroundColor: '#000' }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const d = touchX.current - e.changedTouches[0].clientX;
        touchX.current = null;
        if (Math.abs(d) > 50) go(d > 0 ? 1 : -1);
      }}
    >
      {/* Top bar: counter and close, on their own contrast pills */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <span className="rounded-full bg-black/60 px-3 py-1 text-sm tabular-nums text-white ring-1 ring-white/20">
          {index + 1} / {count}
        </span>
        <button type="button" onClick={onClose} aria-label="Close photos" className={`${ctrl} h-11 w-11`}>
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Photo: whole image, letterboxed, never cropped */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={onClose}>
        <img
          key={images[index]}
          src={images[index]}
          alt={`${title} - photo ${index + 1} of ${count}`}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />
        {count > 1 && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo"
              className={`${ctrl} absolute left-2 top-1/2 h-12 w-12 -translate-y-1/2 sm:left-4`}>
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo"
              className={`${ctrl} absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 sm:right-4`}>
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail rail for jumping straight to any photo */}
      {count > 1 && (
        <div ref={railRef} className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition ${i === index ? 'ring-white opacity-100' : 'ring-transparent opacity-50 hover:opacity-90'}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// Photo Gallery Component
function PhotoGallery({ images = [], title, property }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const thumbsRef = useRef(null);

  // Keep the selected thumbnail visible in the strip (19 photos overflow it).
  useEffect(() => {
    const el = thumbsRef.current?.children?.[currentImage];
    if (!el || !thumbsRef.current) return;
    const strip = thumbsRef.current;
    const left = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
    strip.scrollTo({ left, behavior: 'smooth' });
  }, [currentImage]);
  const { isDark } = useTheme();

  // Get properly formatted images using utility function — pass full property so
  // Street View fallback can read latitude/longitude when images is empty.
  const propertyImages = getPropertyImages(property ? { ...property, images } : { images });

  // Handle image loading errors
  const handleImageLoadError = (imageIndex) => {
    setImageErrors(prev => new Set(prev).add(imageIndex));
  };

  // Filter out images that failed to load
  const validImages = propertyImages.filter((_, index) => !imageErrors.has(index));

  // Reset current image when valid images change
  useEffect(() => {
    if (currentImage >= validImages.length && validImages.length > 0) {
      setCurrentImage(0);
    }
  }, [validImages.length, currentImage]);

  const nextImage = () => {
    if (validImages.length > 1) {
      setCurrentImage((prev) => (prev + 1) % validImages.length);
    }
  };

  const prevImage = () => {
    if (validImages.length > 1) {
      setCurrentImage((prev) => (prev - 1 + validImages.length) % validImages.length);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // If no valid images, show placeholder
  if (validImages.length === 0) {
    return (
      <div className="relative h-96 md:h-[500px] overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {propertyImages.length === 0 ? 'No images available' : 'Images failed to load'}
          </p>
          {propertyImages.length > 0 && (
            <button
              onClick={() => setImageErrors(new Set())}
              className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Retry Loading Images
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Image (wrapped in Photos / Street View tabs) */}
      <PropertyMediaTabs
        property={property}
        heightClass="h-96 md:h-[500px]"
        variant="desktop"
      >
      <div className="relative w-full h-full overflow-hidden rounded-2xl">
        <img
          src={validImages[currentImage]}
          alt={`${title} - Image ${currentImage + 1}`}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          onClick={() => setIsFullscreen(true)}
          className="w-full h-full object-cover cursor-zoom-in"
          onError={(e) => handleImageError(e, null, property)}
        />

        {/* Navigation Arrows - only show if multiple images */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${isDark ? 'bg-[#000000]/70 hover:bg-[#000000]/90 text-white' : 'bg-white/80 hover:bg-white text-gray-900'
                }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${isDark ? 'bg-[#000000]/70 hover:bg-[#000000]/90 text-white' : 'bg-white/80 hover:bg-white text-gray-900'
                }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Counter */}
            <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm backdrop-blur-sm ${isDark ? 'bg-[#000000]/70 text-white' : 'bg-black/50 text-white'
              }`}>
              {currentImage + 1} of {validImages.length}
            </div>
          </>
        )}

        {/* Fullscreen Button */}
        <button
          type="button"
          aria-label="View photos full screen"
          onClick={() => setIsFullscreen(true)}
          className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${isDark ? 'bg-[#000000]/70 hover:bg-[#000000]/90 text-white' : 'bg-black/50 hover:bg-black/70 text-white'
            }`}
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
      </PropertyMediaTabs>

      {/* Thumbnail Gallery */}
      {validImages.length > 1 && (
        <div ref={thumbsRef} className="mt-4 flex gap-2 overflow-x-auto">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImage === index
                ? 'border-white/30'
                : 'border-gray-200 dark:border-gray-600'
                }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen viewer */}
      {isFullscreen && (
        <Lightbox
          images={validImages}
          index={currentImage}
          onIndex={setCurrentImage}
          onClose={() => setIsFullscreen(false)}
          title={title}
        />
      )}
    </div>
  );
}

// Owner Fallback for Eric Kamau (Site Owner & Principal)
const OWNER_FALLBACK = {
  id: 'mZDSsIrn9DgnFfDYymRgyUPlwem1',
  name: 'Eric Kamau',
  email: 'kamaueric711@gmail.com',
  phone: '+254705906024',
  company: 'Maploti Real Estate',
  avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIi53wSeH2LJ-9clfTiFfJZHDqj2QsSU41UDf25W-XmA7-kzw=s96-c'
};

// Agent Contact Card Component
function AgentContactCard({ agent = {}, propertyId, propertyTitle, propertyImage, propertyPrice }) {
  const { isDark } = useTheme();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Fallback mechanisms: prioritize agent's specific info, defaulting to Eric Kamau
  const agentName = (agent?.name && !/contact agent|no_agent/i.test(agent.name.trim()))
    ? (agent.name.trim().toLowerCase() === 'maploti real estate' ? OWNER_FALLBACK.name : agent.name.trim())
    : OWNER_FALLBACK.name;

  const agentEmail = (agent?.email && agent.email.trim())
    ? agent.email.trim()
    : OWNER_FALLBACK.email;

  const agentPhone = (agent?.phone || agent?.phoneNumber || '').trim()
    ? (agent.phone || agent.phoneNumber).trim()
    : OWNER_FALLBACK.phone;

  const agentAvatar = agent?.image || agent?.photo || agent?.avatar || OWNER_FALLBACK.avatar;
  const agentId = agent?.id || agent?.userId || agent?.agentId || OWNER_FALLBACK.id;

  const handleSendMessage = async () => {
    console.log('handleSendMessage called with propertyId:', propertyId, 'propertyTitle:', propertyTitle);

    if (!currentUser) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to send a message to the agent.'
      });
      navigate('/desktop/login', { state: { from: window.location.pathname } });
      return;
    }

    const effectiveAgentId = agentId || OWNER_FALLBACK.id;

    setIsSending(true);

    try {
      // Check if conversation already exists
      const existingConversations = await messagesAPI.getConversations(currentUser.id);
      let conversationId = null;

      // Look for existing conversation with this agent
      for (const conv of existingConversations.conversations) {
        if (conv.participants && conv.participants.includes(effectiveAgentId)) {
          conversationId = conv.id;
          break;
        }
      }

      // Create new conversation if none exists
      if (!conversationId) {
        console.log('Creating conversation with participants:', [currentUser.id, effectiveAgentId], 'propertyId:', propertyId);
        conversationId = await messagesAPI.createConversation([currentUser.id, effectiveAgentId], propertyId);
        console.log('Created conversation with ID:', conversationId);
      }

      // Send initial message
      const initialMessage = {
        senderId: currentUser.id,
        text: `Hi! I'm interested in the property "${propertyTitle}". Could you please provide more information?`,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      await messagesAPI.sendMessage(conversationId, initialMessage);

      showToast({
        type: 'success',
        title: 'Message Sent Successfully!',
        message: `Your message has been sent to ${agentName}. You can view your conversations in the Messages section.`
      });

      // Navigate to messages page after a short delay
      setTimeout(() => {
        navigate('/messages');
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      showToast({
        type: 'error',
        title: 'Failed to Send Message',
        message: 'There was an error sending your message. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCallAgent = () => {
    window.location.href = `tel:${agentPhone}`;
  };

  const handleEmailAgent = () => {
    window.location.href = `mailto:${agentEmail}?subject=Inquiry about ${propertyTitle}`;
  };

  return (
    <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl p-6 border transition-colors duration-300`}>
      <div className="text-center mb-4">
        <img
          src={agentAvatar}
          alt={agentName}
          className="w-20 h-20 rounded-full mx-auto mb-3 object-cover shadow-sm border border-white/10"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = OWNER_FALLBACK.avatar;
          }}
        />
        <h3 className={`text-lg font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>
          {agentName}
        </h3>
        <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
          {agentEmail}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {agent?.company || 'Maploti Real Estate'}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleCallAgent}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-outfit font-bold transition-all duration-200 ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'} shadow-md`}
        >
          <Phone className="w-4 h-4" />
          {agentPhone}
        </button>

        <button
          onClick={handleSendMessage}
          disabled={isSending}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-outfit font-semibold transition-all duration-200 ${isSending
            ? 'opacity-50 cursor-not-allowed'
            : isDark ? 'border border-white/20 text-white hover:bg-white/10' : 'border border-zinc-300 text-zinc-900 hover:bg-zinc-100'
            }`}
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>

        <button
          onClick={handleEmailAgent}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-outfit font-semibold transition-all duration-200 ${isDark ? 'border border-white/20 text-white hover:bg-white/10' : 'border border-zinc-300 text-zinc-900 hover:bg-zinc-100'
            }`}
        >
          <Mail className="w-4 h-4" />
          Send Email
        </button>

        <button
          onClick={() => setIsBookingOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-outfit font-bold transition-all duration-200 bg-white text-black font-bold shadow-md hover:bg-zinc-200 hover:-translate-y-0.5"
        >
          <Calendar className="w-4 h-4" />
          Book Viewing
        </button>
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        property={{ 
          id: propertyId, 
          title: propertyTitle, 
          images: propertyImage ? [propertyImage] : [],
          price: propertyPrice
        }}
        agent={{
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          avatar: agentAvatar
        }}
      />
    </div>
  );
}

// School Ratings Component
function SchoolRatings({ schools = [] }) {
  const { isDark } = useTheme();

  // If no schools data, show placeholder
  if (!Array.isArray(schools) || schools.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className={`text-lg font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Nearby Schools</h3>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-emerald-50'}`}>
          <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
            School information not available for this property.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Nearby Schools</h3>
      {schools.map((school, index) => (
        <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-emerald-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{school.name}</h4>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className={`text-sm font-medium ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{school.rating}</span>
            </div>
          </div>
          <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{school.distance} miles away</p>
        </div>
      ))}
    </div>
  );
}

// Neighborhood Info Component
function NeighborhoodInfo({ neighborhood = {} }) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Neighborhood</h3>
      <div className={`p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-emerald-50'}`}>
        <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
          {neighborhood.description || "Neighborhood information not available for this property."}
        </p>
      </div>
    </div>
  );
}

// Property History Component
function PropertyHistory({ history = [] }) {
  const { isDark } = useTheme();

  // If no history data, show placeholder
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className={`text-lg font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Property History</h3>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-emerald-50'}`}>
          <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
            Property history not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Property History</h3>
      {history.map((event, index) => (
        <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-emerald-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{event.type}</h4>
            <span className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{event.date}</span>
          </div>
          <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{event.description}</p>
        </div>
      ))}
    </div>
  );
}

// Similar Properties Component
function SimilarProperties({ properties = [] }) {
  const { isDark } = useTheme();

  // If no similar properties, don't render
  if (!Array.isArray(properties) || properties.length === 0) {
    return null;
  }

  return (
    <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl p-6 border transition-colors duration-300`}>
      <h3 className={`text-lg font-outfit font-semibold mb-4 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Similar Properties</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {properties.map((property, index) => (
          <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-gray-50'}`}>
            <h4 className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{property.title}</h4>
            <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{property.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Location Card Component
function LocationCard({ latitude, longitude, address, city }) {
  const { isDark } = useTheme();

  // Create embeddable map URL (no API key required)
  const hasCoords = Number.isFinite(parseFloat(latitude)) && Number.isFinite(parseFloat(longitude));
  const qParam = hasCoords
    ? `${parseFloat(latitude)},${parseFloat(longitude)}`
    : encodeURIComponent([address, city].filter(Boolean).join(', ') + ', Kenya');
  const mapEmbedSrc = hasCoords
    ? `https://www.google.com/maps?q=${qParam}&z=14&output=embed`
    : `https://www.google.com/maps?q=${qParam}&z=14&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${qParam}`;

  return (
    <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl border transition-colors duration-300`}>
      <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-outfit font-semibold mb-2 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Location</h3>
        <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{address || 'Address not available'}</p>
      </div>

      {/* Map */}
      <div className="w-full h-56 sm:h-64">
        <iframe
          title="Property Location"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={mapEmbedSrc}
        />
      </div>

      {/* Clickable Link */}
      <div className={`px-6 py-3 border-t text-center ${isDark
        ? 'bg-[#000000] border-white/10'
        : 'bg-gray-50 border-gray-200'
        }`}>
        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-outfit font-semibold hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          View on Google Maps
        </a>
      </div>
    </div>
  );
}


// ── Display helpers ────────────────────────────────────────────────────
// Listing descriptions are stored with lightweight markdown (**bold**).
// Render the bold runs and keep paragraph breaks instead of showing the
// raw asterisks.
const renderDescription = (text) => {
  const paragraphs = String(text || '').split(/\n{2,}/).filter(Boolean);
  return paragraphs.map((para, pi) => (
    <p key={pi} className={pi > 0 ? 'mt-3' : undefined}>
      {para.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </p>
  ));
};

// Amenity keys arrive as snake_case identifiers (water_municipal, cctv).
const humanizeLabel = (value) => {
  const text = String(value || '').replace(/[_-]+/g, ' ').trim();
  if (!text) return '';
  const upper = { cctv: 'CCTV', wifi: 'WiFi', dsq: 'DSQ', tv: 'TV', ac: 'AC' };
  return text
    .split(' ')
    .map((w, i) => upper[w.toLowerCase()] || (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
};

// Firestore stores createdAt as a Timestamp; older imports use ISO strings.
const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const computeDaysOnMarket = (property) => {
  if (Number.isFinite(Number(property?.days_on_market)) && Number(property.days_on_market) > 0) {
    return Number(property.days_on_market);
  }
  const listed = toDate(property?.listedAt || property?.createdAt || property?.created_at);
  if (!listed) return null;
  return Math.max(0, Math.floor((Date.now() - listed.getTime()) / 86400000));
};

// Many listings have no explicit property type; infer it from the title.
const inferPropertyType = (property) => {
  const explicit = property?.propertyType || property?.property_type || property?.type;
  if (explicit && !['rent', 'sale', 'for rent', 'for sale', 'rental'].includes(String(explicit).toLowerCase())) {
    return humanizeLabel(explicit);
  }
  const title = String(property?.title || '').toLowerCase();
  const kinds = ['apartment', 'maisonette', 'bungalow', 'townhouse', 'penthouse', 'villa', 'bedsitter', 'studio', 'office', 'shop', 'warehouse', 'plot', 'land', 'house'];
  const hit = kinds.find((k) => title.includes(k));
  return hit ? humanizeLabel(hit) : 'Property';
};

const listingLabel = (property) => {
  const raw = String(property?.listing_type || property?.listingType || property?.status || property?.type || '').toLowerCase();
  if (raw.includes('rent')) return 'For Rent';
  if (raw.includes('sale')) return 'For Sale';
  if (/to let|for rent|rental/.test(String(property?.title || '').toLowerCase())) return 'For Rent';
  if (/for sale/.test(String(property?.title || '').toLowerCase())) return 'For Sale';
  return null;
};

// Main Property Details Component
function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);

  // Initialize immediately from router state if available to prevent any stale flicker or redirect issues
  const initialProp = useMemo(() => {
    if (location.state?.property && (location.state.property.id === id || location.state.property.code === id || String(location.state.property.id).includes(id))) {
      const [cleaned] = cleanAndDeduplicateProperties([location.state.property]);
      return cleaned || location.state.property;
    }
    return null;
  }, [id, location.state]);

  const [property, setProperty] = useState(initialProp);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  // When id changes, reset property or adopt fresh router state
  useEffect(() => {
    if (initialProp) {
      setProperty(initialProp);
    } else {
      setProperty(null);
    }
  }, [id, initialProp]);

  const handleShare = async () => {
    const url = window.location.href;
    const shareTitle = property?.title || safeProperty?.title || 'Property on Maploti';
    const shareText = `Check out ${shareTitle} on Maploti: ${url}`;

    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast({
        type: 'success',
        title: 'Link Copied!',
        message: 'Property link copied to clipboard.'
      });
    } catch (_) {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        showToast({
          type: 'success',
          title: 'Link Copied!',
          message: 'Property link copied to clipboard.'
        });
      } catch (err) {
        prompt('Copy property link:', url);
      }
      document.body.removeChild(el);
    }
  };

  const { isDark, toggleTheme } = useTheme();
  const { trackPropertyView } = useAnalytics();

  let { data, isLoading, isError } = useProperty(id)

  // Handle vacancy updates for apartment complexes
  const handleVacancyUpdate = async (propertyId, vacancyData) => {
    try {
      // Call the actual API to update vacancy data
      await vacancyService.updateVacancyData(propertyId, vacancyData);

      showToast({
        type: 'success',
        title: 'Vacancy Updated',
        message: 'Apartment vacancy information has been updated successfully.'
      });
    } catch (error) {
      console.error('Error updating vacancy data:', error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update vacancy information. Please try again.'
      });
    }
  };

  useEffect(() => {
    if (data) {
      const [cleaned] = cleanAndDeduplicateProperties([data]);
      const finalProp = cleaned || data;
      setProperty(finalProp);
      // Track property view for analytics
      trackPropertyView(cleaned || data);
      // Increment view count in database
      incrementPropertyView(id);
    }

  }, [data, id, trackPropertyView]);

  // Missing or deleted listing: getById throws, so React Query reports
  // isError once its retries are exhausted. Show a way out instead of
  // spinning forever.
  if (!property && (isError || (!isLoading && !data))) {
    return (
      <div className={`min-h-screen pt-32 pb-8 ${isDark ? 'bg-[#000000]' : 'bg-gray-50'}`}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Listing not found</h1>
          <p className={`mb-8 ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
            This property may have been removed or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className={`inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-full font-semibold border border-white/20 text-white hover:bg-white hover:text-black transition-all ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Go back
            </button>
            <a
              href="/properties"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-full font-semibold bg-white text-black font-semibold hover:shadow-lg transition-all"
            >
              Browse properties
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return <PropertyDetailsSkeleton isDark={isDark} />;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Safe property data with fallbacks
  const safeProperty = {
    ...property,
    tiktokId: property?.tiktokId || null,
    videoUrl: property?.videoUrl || null,
    hasVideo: property?.hasVideo || false,
    embedUrl: property?.embedUrl || null,
    videoThumbnail: property?.videoThumbnail || null,
    title: property.title || 'Property Title Not Available',
    description: property.description || 'No description available.',
    price: property.price || 0,
    address: property.location?.address || property.address || 'Address not available',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    area: property.area || 0,
    lotSize: property.lotSize || null,
    type: inferPropertyType(property),
    listingLabel: listingLabel(property),
    status: property.status || 'For Sale',
    images: getPropertyImages(property),
    features: Array.isArray(property.features) ? property.features : [],
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    agent: property.agent || {},
    days_on_market: computeDaysOnMarket(property),
    pricePerSqft: (property.area && Number.isFinite(Number(property.area)) && property.area > 0) ? Math.round((Number(property.price) || 0) / Number(property.area)) : 0,
    // No CBD fallback: without real coordinates the map searches the
    // address instead of pinning every listing to City Square.
    latitude: getPropertyCoords(property)?.[0] ?? null,
    longitude: getPropertyCoords(property)?.[1] ?? null,
    city: property.city || property.location?.city || property.county || '',
    schools: property.schools || [],
    neighborhood: property.neighborhood || {},
    property_history: property.property_history || [],
    similar_properties: property.similar_properties || [],
    listing_type: listingLabel(property) || 'Residential',
    yearBuilt: property.yearBuilt || null,
    parkingSpaces: property.parking != null ? parseInt(property.parking) : null,
    // Vacancy tracking fields for apartment complexes
    totalUnits: property.totalUnits || 0,
    availableUnits: property.availableUnits || 0,
    unitTypes: property.unitTypes || [],
    nextVacancyDate: property.nextVacancyDate || null,
    waitlistCount: property.waitlistCount || 0,
    averageRent: property.averageRent || 0,
    lastVacancyUpdate: property.lastVacancyUpdate || null,
    vacancyNotes: property.vacancyNotes || '',
  };

  return (
    <div className={`${isDark ? 'bg-[#000000]' : 'bg-gray-50'}`}>

      {/* Header */}
      <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 transition-colors duration-300`}
        style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-2 transition-colors font-outfit ${isDark ? 'text-[#ccc] hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Search</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className={`p-2 rounded-lg transition-colors ${isDark
                  ? 'text-white hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleShare}
                title={copied ? 'Link Copied!' : 'Share listing'}
                aria-label="Share listing"
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${isDark
                  ? 'text-[#ccc] hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full transition-all duration-200 ${isFavorite
                  ? 'bg-red-500 text-white'
                  : isDark
                    ? 'text-[#ccc] hover:text-red-500 hover:bg-red-500/10'
                    : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                  }`}
              >
                <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6"
        style={{ paddingBottom: 'max(9rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            <PhotoGallery images={safeProperty.images} title={safeProperty.title} property={safeProperty} />

            {/* Property Info */}
            <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl p-6 border transition-colors duration-300`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div className="min-w-0">
                  <h1 className={`text-3xl font-outfit font-bold mb-2 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.title}</h1>
                  <p className={`text-xl mb-4 ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{safeProperty.address}</p>
                  <div className={`text-3xl font-outfit font-bold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{formatPrice(safeProperty.price)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-1 sm:text-right sm:flex-shrink-0">
                  {safeProperty.listingLabel && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900 border border-zinc-200'}`}>
                      {safeProperty.listingLabel}
                    </span>
                  )}
                  <div className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-500'}`}>
                    {safeProperty.days_on_market == null ? 'Recently listed' : safeProperty.days_on_market === 0 ? 'Listed today' : `${safeProperty.days_on_market} day${safeProperty.days_on_market === 1 ? '' : 's'} on market`}
                  </div>
                  {(String(safeProperty.type).toLowerCase() !== 'apartment' && safeProperty.pricePerSqft > 0) && (
                    <div className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>{formatPrice(safeProperty.pricePerSqft)}/sqft</div>
                  )}
                </div>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-emerald-50'}`}>
                  <Bed className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-white' : 'text-emerald-600'}`} />
                  <div className={`text-xl font-outfit font-bold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.bedrooms}</div>
                  <div className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>Bedrooms</div>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-green-50'}`}>
                  <Bath className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-white' : 'text-green-600'}`} />
                  <div className={`text-xl font-outfit font-bold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.bathrooms}</div>
                  <div className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>Bathrooms</div>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-purple-50'}`}>
                  <Building2 className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-white' : 'text-purple-600'}`} />
                  <div className={`text-xl font-outfit font-bold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.area > 0 ? safeProperty.area.toLocaleString() : '—'}</div>
                  <div className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>Sq Ft</div>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-[rgba(251,191,36,0.1)]' : 'bg-orange-50'}`}>
                  <Car className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-white' : 'text-orange-600'}`} />
                  <div className={`text-xl font-outfit font-bold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.parkingSpaces ? safeProperty.parkingSpaces : '—'}</div>
                  <div className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>Parking</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className={`text-lg font-outfit font-semibold mb-3 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Description</h3>
                <div className={`leading-relaxed ${isDark ? 'text-[#ccc]' : 'text-gray-700'}`}>{renderDescription(safeProperty.description)}</div>
              </div>

              {/* Features */}
              {safeProperty.features.length > 0 && (
                <div>
                  <h3 className={`text-lg font-outfit font-semibold mb-3 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {safeProperty.features.map((feature, index) => (
                      <div key={index} className={`flex items-center gap-2 ${isDark ? 'text-[#ccc]' : 'text-gray-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`}></div>
                        {humanizeLabel(feature)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {safeProperty.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className={`text-lg font-outfit font-semibold mb-3 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {safeProperty.amenities.map((amenity, index) => (
                      <div key={index} className={`flex items-center gap-2 ${isDark ? 'text-[#ccc]' : 'text-gray-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`}></div>
                        {humanizeLabel(amenity)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Apartment Vacancy Display */}
            {(property?.type?.toLowerCase() === 'apartment' || safeProperty.listing_type?.toLowerCase() === 'apartment' || safeProperty.type?.toLowerCase() === 'apartment' || 'apartment' === 'apartment') ? (
              <ApartmentVacancyDisplay
                property={safeProperty}
                onVacancyUpdate={handleVacancyUpdate}
                isEditable={true}
              />
            ) : (
              <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl p-6 border transition-colors duration-300`}>
                <div className="text-center">
                  <h3 className={`text-lg font-outfit font-semibold mb-2 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Vacancy Information</h3>
                  <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
                    Property type: {safeProperty.type} | Listing type: {safeProperty.listing_type}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
                    Vacancy display requires property type or listing type to be "apartment"
                  </p>
                  <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
                    Raw property.type: {property?.type || 'undefined'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-[#ccc]' : 'text-gray-600'}`}>
                    Condition result: {(property?.type?.toLowerCase() === 'apartment' || safeProperty.listing_type?.toLowerCase() === 'apartment' || safeProperty.type?.toLowerCase() === 'apartment') ? 'TRUE' : 'FALSE'}
                  </p>
                </div>
              </div>
            )}



            {/* Tabs */}
            <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl border transition-colors duration-300`}>
              <div className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <nav
                  className="flex gap-4 sm:gap-8 px-4 sm:px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {[
                    { id: 'overview', label: 'Overview', icon: Home },
                    { id: 'schools', label: 'Schools', icon: School },
                    { id: 'neighborhood', label: 'Neighborhood', icon: MapPin },
                    { id: 'history', label: 'History', icon: TrendingUp }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-outfit font-medium text-sm whitespace-nowrap flex-shrink-0 transition-colors ${activeTab === tab.id
                        ? `border-white/30 ${isDark ? 'text-white' : 'text-gray-900'}`
                        : isDark
                          ? 'border-transparent text-[#ccc] hover:text-white hover:border-[rgba(251,191,36,0.3)]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg font-outfit font-semibold mb-3 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Property Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Type:</span>
                          <span className={`ml-2 font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.type}</span>
                        </div>
                        {safeProperty.listingLabel && (
                          <div>
                            <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Listing:</span>
                            <span className={`ml-2 font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.listingLabel}</span>
                          </div>
                        )}
                        {safeProperty.yearBuilt && (
                          <div>
                            <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Year Built:</span>
                            <span className={`ml-2 font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.yearBuilt}</span>
                          </div>
                        )}
                        {safeProperty.lotSize && (
                          <div>
                            <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Lot Size:</span>
                            <span className={`ml-2 font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{(!isNaN(Number(safeProperty.lotSize)) && safeProperty.lotSize !== null) ? Number(safeProperty.lotSize).toLocaleString() : '—'} sqft</span>
                          </div>
                        )}
                        {safeProperty.parkingSpaces > 0 && (
                          <div>
                            <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Parking:</span>
                            <span className={`ml-2 font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.parkingSpaces} {safeProperty.parkingSpaces === 1 ? 'space' : 'spaces'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schools' && <SchoolRatings schools={safeProperty.schools} />}
                {activeTab === 'neighborhood' && <NeighborhoodInfo neighborhood={safeProperty.neighborhood} />}
                {activeTab === 'history' && <PropertyHistory history={safeProperty.property_history} />}
              </div>
            </div>

            {/* Similar Properties */}
            <SimilarProperties properties={safeProperty.similar_properties} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Contact */}
            <AgentContactCard
              agent={safeProperty.agent}
              propertyId={property.id || id}
              propertyTitle={safeProperty.title}
              propertyImage={safeProperty.images?.[0]}
              propertyPrice={safeProperty.price}
            />


            {/* Quick Stats */}
            <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-lg'} rounded-2xl p-6 border transition-colors duration-300`}>
              <h3 className={`text-lg font-outfit font-semibold mb-4 ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>Property Stats</h3>
              <div className="space-y-3">
                {(String(safeProperty.type).toLowerCase() !== 'apartment' && safeProperty.pricePerSqft > 0) && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Price per sqft:</span>
                    <span className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{formatPrice(safeProperty.pricePerSqft)}</span>
                  </div>
                )}
                {safeProperty.days_on_market != null && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Days on market:</span>
                    <span className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.days_on_market === 0 ? 'Listed today' : safeProperty.days_on_market}</span>
                  </div>
                )}
                {safeProperty.listingLabel && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Listing:</span>
                    <span className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.listingLabel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Property type:</span>
                  <span className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{safeProperty.type}</span>
                </div>
                {(safeProperty.yearBuilt && !isNaN(Number(safeProperty.yearBuilt)) && Number(safeProperty.yearBuilt) > 1800) && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#ccc]' : 'text-gray-600'}>Year built:</span>
                    <span className={`font-outfit font-semibold ${isDark ? 'text-[#feffff]' : 'text-gray-900'}`}>{Number(safeProperty.yearBuilt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <LocationCard
              latitude={safeProperty.latitude}
              longitude={safeProperty.longitude}
              address={safeProperty.address}
              city={safeProperty.city}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails; 