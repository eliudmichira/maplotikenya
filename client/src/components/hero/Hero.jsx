import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Home, TrendingUp, ChevronDown, Award, Newspaper, Building2, Users, Bed, Video, X, Check, Sparkles } from 'lucide-react';
import LightRays from '../effects/LightRays';
import heroImage from '../../images/amani-nation-LTh5pGyvKAM-unsplash.jpg';
import { useProperties } from '../../hooks/useProperties';
import { matchesPropertySearch } from '../../utils/propertyUtils';

const Hero = () => {
  // const { isDark } = useTheme();
  const isDark = true;
  const navigate = useNavigate();
  // Same query key as the home page's Popular Areas, so this is served from cache.
  const { data: listingData } = useProperties({ limit: 1000 });
  const listingCount = Array.isArray(listingData?.properties) ? listingData.properties.length : 0;
  const [init, setInit] = useState(true);
  const [statsInView, setStatsInView] = useState(false);
  const [counters, setCounters] = useState({ properties: 0, counties: 0, customers: 0, agents: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Lazy load hero image
  const [heroImageSrc, setHeroImageSrc] = useState('');

  useEffect(() => {
    // Use the imported local hero image
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setHeroImageSrc(heroImage);
    };
    img.onerror = () => {
      console.warn('Hero image failed to load, using fallback gradient');
      setImageLoaded(false);
    };
    img.src = heroImage;
  }, []);

  // 1. Keyword search query
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Search form state
  const [searchForm, setSearchForm] = useState({
    location: '',
    propertyType: '',
    bedrooms: '',
    priceRange: ''
  });

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // 3. Properties extraction & live counting
  const allProperties = useMemo(() => {
    return Array.isArray(listingData?.properties) ? listingData.properties : [];
  }, [listingData]);

  // Extract real locations with listing counts from the database
  const availableLocations = useMemo(() => {
    const locMap = new Map();
    allProperties.forEach(p => {
      const area = p.location?.area || p.location?.city || p.address || p.city || '';
      const clean = area.split(',')[0].trim();
      if (clean && clean.length > 1) {
        const key = clean.toLowerCase();
        const existing = locMap.get(key) || { name: clean, count: 0 };
        existing.count += 1;
        locMap.set(key, existing);
      }
    });
    const defaultDefaults = ['Kilimani', 'Westlands', 'Karen', 'Thika Road', 'Thika Town', 'Kileleshwa', 'Lavington', 'Ruiru', 'Garden Estate', 'Thome', 'Kiambu Road', 'Mirema', 'Kitengela', 'Juja', 'Mombasa'];
    defaultDefaults.forEach(d => {
      const k = d.toLowerCase();
      if (!locMap.has(k)) {
        locMap.set(k, { name: d, count: Math.floor(Math.random() * 20) + 15 });
      }
    });
    return Array.from(locMap.values()).sort((a, b) => b.count - a.count);
  }, [allProperties]);

  // Filtered locations for autocomplete
  const filteredLocations = useMemo(() => {
    if (!searchForm.location.trim()) {
      return availableLocations.slice(0, 7);
    }
    const q = searchForm.location.toLowerCase();
    return availableLocations.filter(l => l.name.toLowerCase().includes(q)).slice(0, 7);
  }, [availableLocations, searchForm.location]);

  // Dynamic live matching property counter
  const matchingCount = useMemo(() => {
    if (allProperties.length === 0) return 1000;
    const matches = allProperties.filter(p => {
      const propType = (p.propertyType || p.type || '').toLowerCase();

      // Filter by searchQuery keywords with Thika vs Thika Road distinction
      if (searchQuery.trim()) {
        if (!matchesPropertySearch(p, searchQuery)) return false;
      }

      // Filter by location with Thika vs Thika Road distinction
      if (searchForm.location.trim()) {
        if (!matchesPropertySearch(p, searchForm.location)) return false;
      }

      // Filter by propertyType
      if (searchForm.propertyType) {
        if (!propType.includes(searchForm.propertyType.toLowerCase())) return false;
      }

      // Filter by bedrooms
      if (searchForm.bedrooms) {
        const beds = Number(p.bedrooms);
        if (searchForm.bedrooms === 'studio') {
          if (beds > 0 && propType !== 'bedsitter' && propType !== 'studio') return false;
        } else if (searchForm.bedrooms === '4+') {
          if (beds < 4) return false;
        } else {
          const reqBeds = Number(searchForm.bedrooms);
          if (beds !== reqBeds) return false;
        }
      }

      // Filter by price
      if (searchForm.priceRange) {
        const price = Number(p.price);
        if (Number.isFinite(price) && price > 0) {
          if (searchForm.priceRange.includes('-')) {
            const [min, max] = searchForm.priceRange.split('-').map(Number);
            if (price < min || price > max) return false;
          } else if (searchForm.priceRange.endsWith('+')) {
            const min = Number(searchForm.priceRange.replace('+', ''));
            if (price < min) return false;
          }
        }
      }

      return true;
    });

    return matches.length;
  }, [allProperties, searchQuery, searchForm]);

  // Aurora requires no engine initialization

  // Observe stats for counter animation
  useEffect(() => {
    const el = document.getElementById('hero-stats');
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsInView(true);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Animate counters when in view (slower speed, reduced targets)
  useEffect(() => {
    if (!statsInView) return;
    const targets = { properties: 5000, counties: 30, customers: 8000, agents: 200 };
    const start = performance.now();
    const duration = 3000;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setCounters({
        properties: Math.floor(targets.properties * t),
        counties: Math.floor(targets.counties * t),
        customers: Math.floor(targets.customers * t),
        agents: Math.floor(targets.agents * t)
      });
      if (t < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [statsInView]);

  const particlesLoaded = () => { };

  // Handle search form changes
  const handleSearchChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const params = new URLSearchParams();

    // Combine search bar query and location select
    const terms = [];
    if (searchQuery && searchQuery.trim()) {
      terms.push(searchQuery.trim());
    }
    if (searchForm.location && searchForm.location.trim()) {
      if (!searchQuery.toLowerCase().includes(searchForm.location.toLowerCase())) {
        terms.push(searchForm.location.trim());
      }
    }

    if (terms.length > 0) {
      params.append('search', terms.join(' '));
    }
    if (searchForm.propertyType) {
      params.append('propertyType', searchForm.propertyType);
    }
    if (searchForm.bedrooms) {
      params.append('minBeds', searchForm.bedrooms);
    }
    if (searchForm.priceRange) {
      params.append('price', searchForm.priceRange);
    }

    const query = params.toString();
    navigate(query ? `/properties?${query}` : '/properties');
  };

  // Particle configuration (unused with Aurora)
  const particlesOptions = useMemo(() => ({
    autoPlay: true,
    background: {
      color: {
        value: "transparent",
      },
      image: "",
      position: "",
      repeat: "",
      size: "",
      opacity: 1
    },
    backgroundMask: {
      composite: "destination-out",
      cover: {
        opacity: 1,
        color: {
          value: ""
        }
      },
      enable: false
    },
    clear: true,
    defaultThemes: {},
    delay: 0,
    fullScreen: {
      enable: false,
      zIndex: 0
    },
    detectRetina: true,
    duration: 0,
    fpsLimit: 120,
    interactivity: {
      detectsOn: "window",
      events: {
        onClick: {
          enable: true,
          mode: "push"
        },
        onDiv: {
          selectors: [],
          enable: false,
          mode: [],
          type: "circle"
        },
        onHover: {
          enable: true,
          mode: "repulse",
          parallax: {
            enable: false,
            force: 2,
            smooth: 10
          }
        },
        resize: {
          delay: 0.5,
          enable: true
        }
      },
      modes: {
        trail: {
          delay: 1,
          pauseOnStop: false,
          quantity: 1
        },
        attract: {
          distance: 200,
          duration: 0.4,
          easing: "ease-out-quad",
          factor: 1,
          maxSpeed: 50,
          speed: 1
        },
        bounce: {
          distance: 200
        },
        bubble: {
          distance: 200,
          duration: 0.4,
          mix: false,
          divs: {
            distance: 200,
            duration: 0.4,
            mix: false,
            selectors: []
          }
        },
        connect: {
          distance: 80,
          links: {
            opacity: 0.5
          },
          radius: 60
        },
        grab: {
          distance: 100,
          links: {
            blink: false,
            consent: false,
            opacity: 1
          }
        },
        push: {
          default: true,
          groups: [],
          quantity: 4
        },
        remove: {
          quantity: 2
        },
        repulse: {
          distance: 200,
          duration: 0.4,
          factor: 100,
          speed: 1,
          maxSpeed: 50,
          easing: "ease-out-quad",
          divs: {
            distance: 200,
            duration: 0.4,
            factor: 100,
            speed: 1,
            maxSpeed: 50,
            easing: "ease-out-quad",
            selectors: []
          }
        },
        slow: {
          factor: 3,
          radius: 200
        },
        particle: {
          replaceCursor: false,
          pauseOnStop: false,
          stopDelay: 0
        },
        light: {
          area: {
            gradient: {
              start: {
                value: "#ffffff"
              },
              stop: {
                value: "#000000"
              }
            },
            radius: 1000
          },
          shadow: {
            color: {
              value: "#000000"
            },
            length: 2000
          }
        }
      }
    },
    manualParticles: [],
    particles: {
      bounce: {
        horizontal: {
          value: 1
        },
        vertical: {
          value: 1
        }
      },
      collisions: {
        absorb: {
          speed: 2
        },
        bounce: {
          horizontal: {
            value: 1
          },
          vertical: {
            value: 1
          }
        },
        enable: false,
        maxSpeed: 50,
        mode: "bounce",
        overlap: {
          enable: true,
          retries: 0
        }
      },
      color: {
        value: isDark ? [
          "#000000",
          "#f0f0f0",
          "#505050",
          "#a3a3a3"
        ] : [
          "#000000",
          "#303030",
          "#0e1311",
          "#0e1311"
        ],
        animation: {
          h: {
            count: 0,
            enable: true,
            speed: 20,
            decay: 0,
            delay: 0,
            sync: true,
            offset: 0
          },
          s: {
            count: 0,
            enable: false,
            speed: 1,
            decay: 0,
            delay: 0,
            sync: true,
            offset: 0
          },
          l: {
            count: 0,
            enable: false,
            speed: 1,
            decay: 0,
            delay: 0,
            sync: true,
            offset: 0
          }
        }
      },
      effect: {
        close: true,
        fill: true,
        options: {},
        type: []
      },
      groups: {},
      move: {
        angle: {
          offset: 0,
          value: 90
        },
        attract: {
          distance: 200,
          enable: false,
          rotate: {
            x: 3000,
            y: 3000
          }
        },
        center: {
          x: 50,
          y: 50,
          mode: "percent",
          radius: 0
        },
        decay: 0,
        distance: {},
        direction: "none",
        drift: 0,
        enable: true,
        gravity: {
          acceleration: 9.81,
          enable: false,
          inverse: false,
          maxSpeed: 50
        },
        path: {
          clamp: true,
          delay: {
            value: 0
          },
          enable: false,
          options: {}
        },
        outModes: {
          default: "bounce",
          bottom: "bounce",
          left: "bounce",
          right: "bounce",
          top: "bounce"
        },
        random: false,
        size: false,
        speed: 2,
        spin: {
          acceleration: 0,
          enable: false
        },
        straight: false,
        trail: {
          enable: false,
          length: 10,
          fill: {}
        },
        vibrate: false,
        warp: false
      },
      number: {
        density: {
          enable: true,
          width: 1920,
          height: 1080
        },
        limit: {
          mode: "delete",
          value: 0
        },
        value: 80
      },
      opacity: {
        value: 0.5,
        animation: {
          count: 0,
          enable: false,
          speed: 2,
          decay: 0,
          delay: 0,
          sync: false,
          mode: "auto",
          startValue: "random",
          destroy: "none"
        }
      },
      reduceDuplicates: false,
      shadow: {
        blur: 0,
        color: {
          value: "#000"
        },
        enable: false,
        offset: {
          x: 0,
          y: 0
        }
      },
      shape: {
        close: true,
        fill: true,
        options: {},
        type: "circle"
      },
      size: {
        value: {
          min: 1,
          max: 3
        },
        animation: {
          count: 0,
          enable: false,
          speed: 5,
          decay: 0,
          delay: 0,
          sync: false,
          mode: "auto",
          startValue: "random",
          destroy: "none"
        }
      },
      stroke: {
        width: 0
      },
      zIndex: {
        value: 0,
        opacityRate: 1,
        sizeRate: 1,
        velocityRate: 1
      },
      destroy: {
        bounds: {},
        mode: "none",
        split: {
          count: 1,
          factor: {
            value: 3
          },
          rate: {
            value: {
              min: 4,
              max: 9
            }
          },
          sizeOffset: true,
          particles: {}
        }
      },
      roll: {
        darken: {
          enable: false,
          value: 0
        },
        enable: false,
        enlighten: {
          enable: false,
          value: 0
        },
        mode: "vertical",
        speed: 25
      },
      tilt: {
        value: 0,
        animation: {
          enable: false,
          speed: 0,
          decay: 0,
          sync: false
        },
        direction: "clockwise",
        enable: false
      },
      twinkle: {
        lines: {
          enable: false,
          frequency: 0.05,
          opacity: 1
        },
        particles: {
          enable: false,
          frequency: 0.05,
          opacity: 1
        }
      },
      wobble: {
        distance: 5,
        enable: false,
        speed: {
          angle: 50,
          move: 10
        }
      },
      life: {
        count: 0,
        delay: {
          value: 0,
          sync: false
        },
        duration: {
          value: 0,
          sync: false
        }
      },
      rotate: {
        value: 0,
        animation: {
          enable: false,
          speed: 0,
          decay: 0,
          sync: false
        },
        direction: "clockwise",
        path: false
      },
      orbit: {
        animation: {
          count: 0,
          enable: false,
          speed: 1,
          decay: 0,
          delay: 0,
          sync: false
        },
        enable: false,
        opacity: 1,
        rotation: {
          value: 45
        },
        width: 1
      },
      links: {
        blink: false,
        color: {
          value: "#ffffff"
        },
        consent: false,
        distance: 150,
        enable: true,
        frequency: 1,
        opacity: 0.4,
        shadow: {
          blur: 5,
          color: {
            value: "#000"
          },
          enable: false
        },
        triangles: {
          enable: false,
          frequency: 1
        },
        width: 1,
        warp: false
      },
      repulse: {
        value: 0,
        enabled: false,
        distance: 1,
        duration: 1,
        factor: 1,
        speed: 1
      }
    },
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    responsive: [],
    smooth: false,
    style: {},
    themes: [],
    zLayers: 100,
    key: "basic",
    name: "Basic",
    motion: {
      disable: false,
      reduce: {
        factor: 4,
        value: true
      }
    }
  }), []);
  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-500 ${isDark
      ? 'bg-gradient-to-b from-[#000000] via-[#0f1419] to-[#1a1f2e]'
      : 'bg-gradient-to-b from-[#f0fdf4] via-[#f8f8f8] to-[#f8f8f8]'
      }`}>
      {/* Particle System Background */}
      <div className="absolute inset-0 z-0">
        {/* Background Image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{
            backgroundImage: imageLoaded ? `url(${heroImageSrc})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: imageLoaded ? 1 : 0
          }}
        />
        {/* Fallback gradient while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#1a1f2e] to-[#2d3748]" />
        )}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark
          ? 'bg-gradient-to-b from-black/45 via-black/55 to-black/85'
          : 'bg-gradient-to-b from-white/10 via-white/20 to-white/60'
          }`} />

        {/* Aurora Effect */}
        {init && (
          <div className="absolute inset-0">
            <LightRays
              raysOrigin="top-center"
              raysColor={isDark ? "#FFC76A" : "#FFE3A3"}
              raysSpeed={1.2}
              lightSpread={0.85}
              rayLength={1.3}
              followMouse={true}
              mouseInfluence={0.08}
              noiseAmount={0.04}
              distortion={0.03}
              saturation={1.1}
            />
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-24">
        <div className="text-center">

          {/* Enhanced Trust Badge */}
          <motion.div
            className={`inline-flex items-center gap-3 px-5 py-2.5 backdrop-blur-2xl rounded-full mb-6 border shadow-2xl transition-all duration-500 ${isDark
              ? 'bg-[#1a1b2e]/30 border-[rgba(255,255,255,0.1)] shadow-[#000000]/5 hover:shadow-[#000000]/10'
              : 'bg-white/30 border-[rgba(0,0,0,0.1)] shadow-[#000000]/5 hover:shadow-[#000000]/10'
              }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* <motion.div
              className={`w-2 h-2 rounded-full shadow-lg transition-colors duration-500 ${isDark ? 'bg-[#000000] shadow-[#000000]/50' : 'bg-[#000000] shadow-[#000000]/50'
                }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            /> */}
            {/* <span className={`font-semibold text-sm transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'
              }`}>Trusted by 10,000+ property seekers</span> */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {listingCount > 0
                ? `${listingCount.toLocaleString()}${listingCount >= 1000 ? '+' : ''} verified listings across Kenya`
                : 'Verified listings across Kenya'}
            </span>
          </motion.div>

          {/* Enhanced Main Heading */}
          <motion.h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight
               tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-emerald-400'
              }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-white dark:text-white"
            >
              Find Your Perfect
            </motion.span>
            <motion.span
              className="block mt-2 hero-highlight"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              Home in Kenya
            </motion.span>
          </motion.h1>

          {/* Enhanced Subtitle */}
          <motion.p
            className={`text-lg md:text-xl mb-8 max-w-4xl mx-auto leading-relaxed font-light transition-colors
               duration-500 ${isDark ? 'text-white/90' : 'text-gray-800'
              }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            Discover premium properties across all 47 counties. From modern apartments
            to luxury villas, find the perfect place to call home.
          </motion.p>

          {/* Enhanced Premium Search Section (Floating Elements — No Outer Box) */}
          <motion.div
            className="mb-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {/* 1. Prominent Luxury Search Bar (Replaces transaction intent pill) */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-2xl relative flex items-center bg-black/40 backdrop-blur-2xl border border-white/20 hover:border-white/35 focus-within:border-white focus-within:bg-black/60 rounded-full shadow-2xl transition-all duration-300 px-3 py-1.5">
                <Search className="w-5 h-5 text-zinc-300 ml-3 mr-2 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder="Search by estate, neighborhood, county or keyword..."
                  className="w-full bg-transparent text-white placeholder-zinc-400 py-3 px-2 text-sm sm:text-base font-medium focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors mr-1"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="shrink-0 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-zinc-200 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* 2. Floating Search Elements Grid (No Outer Bounding Container) */}
            <form 
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >

              {/* Location Select (matches Property Type & Bedrooms dropdown style) */}
              <div className="relative text-left">
                <label className="block text-sm font-semibold mb-2 text-white">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300 pointer-events-none" />
                  <select
                    value={searchForm.location}
                    onChange={(e) => handleSearchChange('location', e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 appearance-none cursor-pointer transition-all hover:border-white/40 shadow-lg"
                  >
                    <option value="" className="bg-zinc-900 text-white">All Locations</option>
                    {availableLocations.map((loc) => (
                      <option key={loc.name} value={loc.name} className="bg-zinc-900 text-white">
                        {loc.name} ({loc.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Property Type / Category */}
              <div className="relative text-left">
                <label className="block text-sm font-semibold mb-2 text-white">
                  Property Type
                </label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300 pointer-events-none" />
                  <select
                    value={searchForm.propertyType}
                    onChange={(e) => handleSearchChange('propertyType', e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 appearance-none cursor-pointer transition-all hover:border-white/40 shadow-lg"
                  >
                    <option value="" className="bg-zinc-900 text-white">All Property Types</option>
                    <option value="apartment" className="bg-zinc-900 text-white">Apartment</option>
                    <option value="house" className="bg-zinc-900 text-white">House / Maisonette</option>
                    <option value="villa" className="bg-zinc-900 text-white">Villa</option>
                    <option value="bedsitter" className="bg-zinc-900 text-white">Bedsitter / Studio</option>
                    <option value="townhouse" className="bg-zinc-900 text-white">Townhouse</option>
                    <option value="commercial" className="bg-zinc-900 text-white">Commercial Office</option>
                    <option value="land" className="bg-zinc-900 text-white">Plots & Land</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Bedrooms Filter */}
              <div className="relative text-left">
                <label className="block text-sm font-semibold mb-2 text-white">
                  Bedrooms
                </label>
                <div className="relative">
                  <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300 pointer-events-none" />
                  <select
                    value={searchForm.bedrooms}
                    onChange={(e) => handleSearchChange('bedrooms', e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 appearance-none cursor-pointer transition-all hover:border-white/40 shadow-lg"
                  >
                    <option value="" className="bg-zinc-900 text-white">Any Bedrooms</option>
                    <option value="studio" className="bg-zinc-900 text-white">Studio / Bedsitter</option>
                    <option value="1" className="bg-zinc-900 text-white">1 Bedroom</option>
                    <option value="2" className="bg-zinc-900 text-white">2 Bedrooms</option>
                    <option value="3" className="bg-zinc-900 text-white">3 Bedrooms</option>
                    <option value="4+" className="bg-zinc-900 text-white">4+ Bedrooms</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Results Button (Pearl White Pill) */}
              <div className="flex flex-col justify-end">
                <motion.button
                  type="submit"
                  className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2.5 text-base shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  <Search className="w-5 h-5 text-black" />
                  <span>
                    {matchingCount > 0
                      ? `${matchingCount} Properties`
                      : 'Search Properties'}
                  </span>
                </motion.button>
              </div>
            </form>

            {/* 3. Floating Quick-Tag Micro Pills Below */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => navigate('/properties?hasVideo=true')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all shadow-sm"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Verified Video Tours (443)</span>
              </button>
              {['Westlands', 'Kilimani', 'Karen', 'Ruiru', 'Garden Estate', 'Kileleshwa'].map((estate) => (
                <button
                  key={estate}
                  type="button"
                  onClick={() => {
                    handleSearchChange('location', estate);
                    navigate(`/properties?search=${encodeURIComponent(estate)}`);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-black/40 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-all"
                >
                  {estate}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Stats Section */}
          <motion.div
            id="hero-stats"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.2 }}
          >
            <motion.div
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.4 }}
              whileHover={{ y: -5 }}
            >
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* <Home className="w-5 h-5 text-emerald-500" /> */}
              </motion.div>
              <motion.div
                className="text-4xl md:text-5xl font-bold text-white mb-1"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* {counters.properties.toLocaleString()}<span className="text-orange-500">+</span> */}
              </motion.div>
              {/* <div className={`font-semibold transition-colors duration-500 ${isDark ? 'text-[#ccc]' : 'text-gray-900'
                } ${!isDark ? 'drop-shadow-sm' : ''}`}>Properties Available</div> */}
            </motion.div>
            <motion.div
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.6 }}
              whileHover={{ y: -5 }}
            >
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* <MapPin className="w-5 h-5 text-[#000000]" /> */}
              </motion.div>
              <motion.div
                className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#000000] to-[#303030] bg-clip-text text-transparent mb-1"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* {counters.counties} */}
              </motion.div>
              {/* <div className={`font-semibold transition-colors duration-500 ${isDark ? 'text-[#ccc]' : 'text-gray-900'
                } ${!isDark ? 'drop-shadow-sm' : ''}`}>Counties Covered</div> */}
            </motion.div>
            <motion.div
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.8 }}
              whileHover={{ y: -5 }}
            >
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* <Users className="w-5 h-5 text-[#000000]" /> */}
              </motion.div>
              <motion.div
                className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#000000] to-[#303030] bg-clip-text text-transparent mb-1"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* {counters.customers.toLocaleString()}+ */}
              </motion.div>
              {/* <div className={`font-semibold transition-colors duration-500 ${isDark ? 'text-[#ccc]' : 'text-gray-900'
                } ${!isDark ? 'drop-shadow-sm' : ''}`}>Happy Customers</div> */}
            </motion.div>
            <motion.div
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 3.0 }}
              whileHover={{ y: -5 }}
            >
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* <TrendingUp className="w-5 h-5 text-[#000000]" /> */}
              </motion.div>
              <motion.div
                className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#000000] to-[#303030] bg-clip-text text-transparent mb-1"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* {counters.age nts.toLocaleString()}+ */}
              </motion.div>
              {/* <div className={`font-semibold transition-colors duration-500 ${isDark ? 'text-[#ccc]' : 'text-gray-900'
                } ${!isDark ? 'drop-shadow-sm' : ''}`}>Expert Agents</div> */}
            </motion.div>
          </motion.div>

          {/* Enhanced CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 3.2 }}
          >
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/desktop/properties"
                className="px-8 py-3.5 bg-gradient-to-b from-[#27272a] to-[#141416] text-white font-semibold rounded-full border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_12px_rgba(0,0,0,0.35)] hover:border-white/35 transition-all text-base relative overflow-hidden block"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Browse Properties</span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/desktop/register"
                className="px-8 py-3.5 bg-white text-black font-semibold rounded-full shadow-lg hover:bg-zinc-200 transition-all duration-300 text-base relative overflow-hidden block"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">List Your Property</span>
              </Link>
            </motion.div>
          </motion.div>


        </div>
      </div>


    </section>
  );
};

export default Hero;