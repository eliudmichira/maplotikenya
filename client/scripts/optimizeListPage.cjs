const fs = require('fs');

let code = fs.readFileSync('src/routes/listPage/listPage_fixed_useLocation.jsx', 'utf8');

// Replace the blocking async loadProperties loop with an instant synchronous mapper
const oldLoadProperties = `  // Load property data
  useEffect(() => {
    const loadProperties = async () => {
      if (!properties) {
        return;
      }
      setIsLoading(true);
      try {

        // Process properties to ensure they have required fields for maps; geocode when missing
        const processedProperties = await Promise.all(properties.map(async (property, index) => {
          // Highest priority: stored coordinates (support nested shapes)
          const rawLat = property.latitude ?? property.lat ?? property.location?.coordinates?.lat;
          const rawLng = property.longitude ?? property.lng ?? property.location?.coordinates?.lng;
          let lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
          let lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

          // Debug logging to see what coordinates we're working with
          console.log(\`Property \${property.id || index}:\`, {
            title: property.title,
            rawLat, rawLng,
            parsedLat: lat, parsedLng: lng,
            address: property.address,
            city: property.city,
            hasStoredCoords: !!(rawLat && rawLng && rawLat !== 0 && rawLng !== 0)
          });

          // Validate coordinate ranges (Kenya is roughly -4.7 to 4.6 lat, 33.9 to 41.9 lng)
          const isValidKenyanCoordinate = (lat, lng) => {
            return Number.isFinite(lat) && Number.isFinite(lng) &&
              lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42 &&
              lat !== 0 && lng !== 0; // Exclude 0,0 coordinates
          };

          // Only geocode if we don't have valid stored coordinates
          if (!isValidKenyanCoordinate(lat, lng)) {
            if (import.meta.env.DEV) console.log(\`Property \${property.id || index}: No valid stored coordinates, attempting geocoding...\`);

            // Try multiple geocoding strategies for better precision
            let geo = null;

            // Strategy 1: Try with full address
            const addrStr = buildAddressString(property);
            if (import.meta.env.DEV) console.log(\`Geocoding address: "\${addrStr}"\`);
            geo = await geocodeAddress(addrStr);

            // Strategy 2: If that fails, try with just city + Kenya for more general location
            if (!geo && property.city) {
              const cityStr = \`\${property.city}, Kenya\`;
              if (import.meta.env.DEV) console.log(\`Trying city-only geocoding: "\${cityStr}"\`);
              geo = await geocodeAddress(cityStr);
            }

            if (geo && isValidKenyanCoordinate(geo.lat, geo.lng)) {
              if (import.meta.env.DEV) console.log(\`Geocoding successful: \${geo.lat}, \${geo.lng}\`);
              lat = geo.lat;
              lng = geo.lng;
            } else {
              if (import.meta.env.DEV) console.log(\`Geocoding failed for property \${property.id || index}\`);
            }
          } else {
            if (import.meta.env.DEV) console.log(\`Property \${property.id || index}: Using stored coordinates \${lat}, \${lng}\`);
          }

          if (!isValidKenyanCoordinate(lat, lng)) {
            // Fallback near Nairobi with larger offset to avoid overlapping
            // Use a more spread out pattern to ensure visible separation
            const offsetLat = (index % 10) * 0.02; // 0.02 degrees ≈ 2.2km
            const offsetLng = Math.floor(index / 10) * 0.02;
            lat = -1.2921 + offsetLat;
            lng = 36.8219 + offsetLng;
          }

          return {
            ...property,
            latitude: lat,
            longitude: lng,
            // Ensure other required fields exist with real data or sensible defaults
            images: property.images || [],
            features: property.features || [],
            agent: property.agent || null,
            listing_agent: property.listing_agent || null,
            neighborhood: property.neighborhood || null,
            schools: property.schools || [],
            price_history: property.price_history || [],
            virtual_tour: property.virtual_tour || false,
            is_new: property.is_new || false,
            is_price_reduced: property.is_price_reduced || false,
            petFriendly: property.petFriendly || false,
            open_house: property.open_house || null,
            days_on_market: property.days_on_market || 0,
            // Kenyan-focused properties
            isRecentlyRenovated: property.isRecentlyRenovated || lower(property.condition) === 'renovated',
            isServicedApartment: property.isServicedApartment || false,
            isFurnished: property.isFurnished || false,
            isStudentFriendly: property.isStudentFriendly || false,
            isShortTermLease: property.isShortTermLease || false,
            // listing_type + the quick-filter flags, derived from the
            // amenities / utilities / condition / parking the data carries
            ...deriveListingFlags(property),
            // Location properties
            isNearCBD: property.isNearCBD || false,
            isNearUniversity: property.isNearUniversity || false,
            isNearMajorRoads: property.isNearMajorRoads || false,
            estate: property.estate || ''
          };
        }));

        // Handle duplicate coordinates by adding small offsets
        const coordinateMap = {}; // Use plain object instead of Map constructor
        const finalProperties = processedProperties.map((property, index) => {
          const lat = property.latitude;
          const lng = property.longitude;
          const coordKey = \`\${lat},\${lng}\`; // Use full precision for grouping

          if (coordinateMap[coordKey]) {
            // This coordinate already exists, add a small offset
            const existingCount = coordinateMap[coordKey];
            coordinateMap[coordKey] = existingCount + 1;

            // Create a small circular offset pattern
            const angle = (existingCount * 2 * Math.PI) / 8; // 8 positions around a circle
            const offsetDistance = 0.0005; // Very small offset (about 50 meters)
            const offsetLat = lat + (offsetDistance * Math.cos(angle));
            const offsetLng = lng + (offsetDistance * Math.sin(angle));

            return {
              ...property,
              latitude: offsetLat,
              longitude: offsetLng,
              originalLatitude: lat, // Keep original for reference
              originalLongitude: lng
            };
          } else {
            coordinateMap[coordKey] = 1;
            return property;
          }
        });

        // Log summary of coordinate sources
        const storedCoords = finalProperties.filter(p => !p.originalLatitude).length;
        const geocodedCoords = finalProperties.filter(p => p.originalLatitude).length;
        const fallbackCoords = finalProperties.filter(p =>
          p.latitude >= -1.3 && p.latitude <= -1.2 && p.longitude >= 36.8 && p.longitude <= 36.9
        ).length;

        if (import.meta.env.DEV) console.log('Coordinate Summary:', {
          total: finalProperties.length,
          storedCoordinates: storedCoords,
          geocodedCoordinates: geocodedCoords,
          fallbackCoordinates: fallbackCoords
        });

        if (import.meta.env.DEV) console.log('Processed properties:', finalProperties);
        setPropertyData(finalProperties);
      }
      catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [properties]);`;

const newLoadProperties = `  // Instant non-blocking property data processing
  useEffect(() => {
    if (!properties || properties.length === 0) {
      if (!propertiesLoading) setIsLoading(false);
      return;
    }

    // Fast synchronous normalization without blocking HTTP network calls
    const isValidKenyanCoordinate = (lat, lng) => {
      return Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42 &&
        lat !== 0 && lng !== 0;
    };

    const finalProperties = properties.map((property, index) => {
      const rawLat = property.latitude ?? property.lat ?? property.location?.coordinates?.lat;
      const rawLng = property.longitude ?? property.lng ?? property.location?.coordinates?.lng;
      let lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
      let lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

      if (!isValidKenyanCoordinate(lat, lng)) {
        // Deterministic spread around Nairobi center to display markers immediately
        const offsetLat = ((index % 12) - 6) * 0.015;
        const offsetLng = (Math.floor(index / 12) % 12 - 6) * 0.015;
        lat = -1.2921 + offsetLat;
        lng = 36.8219 + offsetLng;
      }

      return {
        ...property,
        latitude: lat,
        longitude: lng,
        images: property.images || [],
        features: property.features || [],
        agent: property.agent || null,
        listing_agent: property.listing_agent || null,
        neighborhood: property.neighborhood || null,
        schools: property.schools || [],
        price_history: property.price_history || [],
        virtual_tour: property.virtual_tour || false,
        is_new: property.is_new || false,
        is_price_reduced: property.is_price_reduced || false,
        petFriendly: property.petFriendly || false,
        open_house: property.open_house || null,
        days_on_market: property.days_on_market || 0,
        isRecentlyRenovated: property.isRecentlyRenovated || lower(property.condition) === 'renovated',
        isServicedApartment: property.isServicedApartment || false,
        isFurnished: property.isFurnished || false,
        isStudentFriendly: property.isStudentFriendly || false,
        isShortTermLease: property.isShortTermLease || false,
        ...deriveListingFlags(property),
        isNearCBD: property.isNearCBD || false,
        isNearUniversity: property.isNearUniversity || false,
        isNearMajorRoads: property.isNearMajorRoads || false,
        estate: property.estate || ''
      };
    });

    setPropertyData(finalProperties);
    setIsLoading(false);
  }, [properties, propertiesLoading]);`;

// Replace normalizing line endings for CRLF/LF compatibility
const normalize = s => s.replace(/\r\n/g, '\n');
const normalizedCode = normalize(code);
const normalizedOld = normalize(oldLoadProperties);

if (normalizedCode.includes(normalizedOld)) {
  const updatedCode = normalizedCode.replace(normalizedOld, normalize(newLoadProperties));
  fs.writeFileSync('src/routes/listPage/listPage_fixed_useLocation.jsx', updatedCode, 'utf8');
  console.log('Successfully optimized loadProperties in listPage_fixed_useLocation.jsx!');
} else {
  console.error('Target loadProperties block not found in exact format. Checking diff...');
}
