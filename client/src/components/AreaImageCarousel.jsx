import React, { useState, useEffect, useRef } from 'react';
import { handleImageError } from '../utils/imageUtils';

// Auto-cycling photo carousel for area cards. It only mounts its extra
// photos, cycles and animates while the card is on screen, so a directory of
// fifty cards does not run fifty timers and load a hundred and fifty images
// on a phone. The `areaKenburns` keyframes live in src/index.css.
const AreaImageCarousel = ({ images, name }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || images.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [visible, paused, images.length]);

  const shown = visible ? images : images.slice(0, 1);

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {shown.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? name : ''}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          style={visible && i === index ? { animation: 'areaKenburns 10s ease-in-out infinite alternate' } : undefined}
          onError={handleImageError}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setIndex(i); } }}
              className={`cursor-pointer rounded-full transition-all duration-300 ${i === index ? 'h-1.5 w-4 bg-white' : 'h-1.5 w-1.5 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AreaImageCarousel;
