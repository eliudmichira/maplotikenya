import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../utils/map_filters.dart';
import '../utils/marker_clustering.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/accent_button.dart';
import '../../../core/widgets/app_property_image.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../models/listing.dart';
import '../providers/listing_provider.dart';
import 'detail_screen.dart';

/// Interactive property map featuring live GPS user location tracking,
/// top search bar header with embedded green search pill button,
/// quick filter chips, and interactive price tag pin markers on OpenStreetMap.
class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  final _mapController = MapController();
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  bool _searchFocused = false;

  // Default center: Nairobi CBD
  static const _nairobiCenter = LatLng(-1.2921, 36.8219);
  static const _defaultZoom = 11.5;

  Listing? _selectedListing;
  String _selectedFilter = 'All'; // 'All', '1 Bed', '2 Bed', '3 Bed', '4+ Bed', 'Rent', 'Sale'
  String _searchQuery = '';

  // ── Price range + sort (map_filters.dart) ─────────────────────────────
  double? _minPrice;
  double? _maxPrice;
  PriceSort _priceSort = PriceSort.none;

  LatLng? _userLocation;
  bool _isLocating = false;

  // ── Clustered markers ────────────────────────────────────────────────────
  List<Marker> _markers = const [];
  MapCamera? _camera;
  List<Listing> _geoListings = const [];
  String _listingsKey = '';



  @override
  void initState() {
    super.initState();
    _requestAndShowUserLocation(moveCamera: false);
    _searchFocusNode.addListener(() {
      setState(() => _searchFocused = _searchFocusNode.hasFocus);
    });
  }

  Future<void> _requestAndShowUserLocation({bool moveCamera = true}) async {
    if (_isLocating) return;
    setState(() => _isLocating = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted && moveCamera) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('GPS Location services are turned off on your device.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted && moveCamera) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Location permission denied.'),
                backgroundColor: AppColors.error,
              ),
            );
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted && moveCamera) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location permissions are permanently denied in Settings.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );

      final userLoc = LatLng(pos.latitude, pos.longitude);
      if (mounted) {
        setState(() {
          _userLocation = userLoc;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _recomputeMarkers();
        });
        if (moveCamera) {
          _mapController.move(userLoc, 14.5);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Centered to your live location 📍'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (_) {
      // Fallback gracefully
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  List<Listing> _filterListings(List<Listing> raw) {
    var res = raw;
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      res = res.where((l) =>
        l.title.toLowerCase().contains(q) ||
        l.location.displayName.toLowerCase().contains(q)
      ).toList();
    }

    // Each quick chip narrows the set; the price range filter + sort are
    // applied last so every combination (bed chips, rent/sale, search)
    // composes with the budget filters.
    if (_selectedFilter == '1 Bed') {
      res = res.where((l) => l.bedrooms == 1).toList();
    } else if (_selectedFilter == '2 Bed') {
      res = res.where((l) => l.bedrooms == 2).toList();
    } else if (_selectedFilter == '3 Bed') {
      res = res.where((l) => l.bedrooms == 3).toList();
    } else if (_selectedFilter == '4+ Bed') {
      res = res.where((l) => l.bedrooms >= 4).toList();
    } else if (_selectedFilter == 'Rent') {
      res = res.where((l) => l.listingType == 'rent').toList();
    } else if (_selectedFilter == 'Sale') {
      res = res.where((l) => l.listingType == 'sale').toList();
    }

    return applyMapPriceFilter(
      res,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      sort: _priceSort,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final listingsAsync = ref.watch(activeListingsProvider);
    // Live count of listings that match the current filters (drives the
    // animated pill and updates as search / chips / price range change).
    final allListings = listingsAsync.asData?.value ?? const <Listing>[];
    final matchCount = _filterListings(allListings).length;

    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final elev = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final border = isDark ? AppColors.border : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Stack(
        children: [
          // ── Edge-to-Edge Map ─────────────────────────────────────────────
          listingsAsync.when(
            data: (listings) => _buildMap(_filterListings(listings), isDark),
            loading: () => _buildMap([], isDark),
            error: (_, _e) => _buildMap([], isDark),
          ),

          // ── Top Header Search Row
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 12,
            right: 12,
            child: Row(
              children: [
                // Left Circular Filter Button
                GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    _showFilterSheet();
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E7EB),
                        width: 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.10),
                          blurRadius: 14,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        const Icon(
                          Icons.tune_rounded,
                          color: AppColors.accent,
                          size: 20,
                        ),
                        // Active-filter badge
                        if (_hasActiveFilters())
                          Positioned(
                            top: 9,
                            right: 9,
                            child: Container(
                              width: 9,
                              height: 9,
                              decoration: BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Search Bar
                Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 48,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: _searchFocused
                            ? AppColors.accent.withValues(alpha: 0.7)
                            : (isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E7EB)),
                        width: _searchFocused ? 1.5 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: _searchFocused
                              ? AppColors.accent.withValues(alpha: 0.12)
                              : Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
                          blurRadius: _searchFocused ? 18 : 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 14),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          child: Icon(
                            Icons.search_rounded,
                            key: ValueKey(_searchFocused),
                            color: _searchFocused ? AppColors.accent : mute,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            focusNode: _searchFocusNode,
                            style: TextStyle(
                              fontFamily: 'Inter',
                              color: text,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              letterSpacing: -0.1,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Search area, title...',
                              hintStyle: TextStyle(
                                fontFamily: 'Inter',
                                color: mute,
                                fontSize: 14,
                                fontWeight: FontWeight.w400,
                              ),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              isDense: false,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            onChanged: (v) => setState(() => _searchQuery = v),
                            onSubmitted: (_) => FocusScope.of(context).unfocus(),
                          ),
                        ),
                        if (_searchQuery.isNotEmpty)
                          GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Icon(
                                Icons.cancel_rounded,
                                color: mute,
                                size: 18,
                              ),
                            ),
                          ),
                        // Search pill button
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            FocusScope.of(context).unfocus();
                          },
                          child: Container(
                            margin: const EdgeInsets.all(5),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                            height: 38,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFFD4FF3D), Color(0xFF9BE500)],
                              ),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accent.withValues(alpha: 0.30),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              'Search',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF111111),
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Right Theme Toggle
                const CreativeThemeToggle(),
              ],
            ),
          ),

          // ── Horizontal Floating Quick Filter Pills
          Positioned(
            top: MediaQuery.of(context).padding.top + 64,
            left: 0,
            right: 0,
            child: SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _buildPriceSortChip(isDark, text),
                  _buildQuickFilterChip('1 Bed', Icons.single_bed, isDark, text),
                  _buildQuickFilterChip('2 Bed', Icons.king_bed, isDark, text),
                  _buildQuickFilterChip('3 Bed', Icons.bed, isDark, text),
                  _buildQuickFilterChip('4+ Bed', Icons.bedroom_parent, isDark, text),
                  _buildQuickFilterChip('Rent', Icons.key, isDark, text),
                  _buildQuickFilterChip('Sale', Icons.sell_outlined, isDark, text),
                ],
              ),
            ),
          ),

          // ── Animated matching-count pill (hidden while the loading
          // overlay occupies the same spot) ─────────────────────────────────
          if (!listingsAsync.isLoading)
            Positioned(
            top: MediaQuery.of(context).padding.top + 108,
            left: 0,
            right: 0,
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, anim) =>
                    FadeTransition(opacity: anim, child: child),
                child: Container(
                  key: ValueKey('$matchCount|$_hasActiveFilters()'),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: elev,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _hasActiveFilters() ? AppColors.accent : border,
                      width: 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.place_outlined,
                        size: 14,
                        color: AppColors.accent,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '$matchCount propert${matchCount == 1 ? 'y' : 'ies'} on map',
                        style: AppTypography.caption.copyWith(
                          color: text,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Loading overlay ──────────────────────────────────────────────
          if (listingsAsync.isLoading)
            Positioned(
              top: MediaQuery.of(context).padding.top + 114,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: elev,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 1.5,
                          color: AppColors.accent,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('Loading listings...', style: AppTypography.caption.copyWith(color: mute)),
                    ],
                  ),
                ),
              ),
            ),

          // ── Floating GPS Recenter FAB Button ─────────────────────────────
          Positioned(
            right: 16,
            bottom: _selectedListing != null ? 240 : 30,
            child: FloatingActionButton.small(
              heroTag: 'fab_gps_recenter',
              backgroundColor: isDark ? const Color(0xFF1E1E20) : Colors.white,
              elevation: 6,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isDark ? const Color(0xFF38383B) : const Color(0xFFE2E4E8),
                  width: 1.2,
                ),
              ),
              onPressed: () {
                HapticFeedback.mediumImpact();
                _requestAndShowUserLocation(moveCamera: true);
              },
              child: _isLocating
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
                    )
                  : const Icon(Icons.my_location, color: AppColors.accent, size: 20),
            ),
          ),

          // ── Bottom property sheet ────────────────────────────────────────
          if (_selectedListing != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: _buildPropertySheet(_selectedListing!, text, mute, elev, border, isDark),
            ),
        ],
      ),
    );
  }

  bool _hasActiveFilters() {
    return _selectedFilter != 'All' ||
        _searchQuery.trim().isNotEmpty ||
        hasActivePriceFilter(minPrice: _minPrice, maxPrice: _maxPrice, sort: _priceSort);
  }

  /// The 'Price' pill cycles the sort direction: off → cheapest first →
  /// priciest first → off.
  Widget _buildPriceSortChip(bool isDark, Color text) {
    final label = switch (_priceSort) {
      PriceSort.none => 'Price',
      PriceSort.lowToHigh => 'Price ↑',
      PriceSort.highToLow => 'Price ↓',
    };
    final isSel = _priceSort != PriceSort.none;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() {
            _priceSort = switch (_priceSort) {
              PriceSort.none => PriceSort.lowToHigh,
              PriceSort.lowToHigh => PriceSort.highToLow,
              PriceSort.highToLow => PriceSort.none,
            };
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: isSel
                ? AppColors.accent
                : (isDark ? const Color(0xFF1E1E20).withValues(alpha: 0.95) : Colors.white.withValues(alpha: 0.95)),
            border: Border.all(
              color: isSel ? Colors.black : (isDark ? const Color(0xFF38383B) : const Color(0xFFE2E4E8)),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: isSel ? AppColors.accent.withValues(alpha: 0.3) : Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.attach_money,
                size: 14,
                color: isSel ? Colors.black : (isDark ? AppColors.accent : const Color(0xFF374151)),
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: isSel ? FontWeight.w900 : FontWeight.w700,
                  color: isSel ? Colors.black : text,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickFilterChip(String label, IconData iconData, bool isDark, Color text) {
    final isSel = _selectedFilter == label;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() {
            _selectedFilter = isSel ? 'All' : label;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: isSel
                ? AppColors.accent
                : (isDark ? const Color(0xFF1E1E20).withValues(alpha: 0.95) : Colors.white.withValues(alpha: 0.95)),
            border: Border.all(
              color: isSel ? Colors.black : (isDark ? const Color(0xFF38383B) : const Color(0xFFE2E4E8)),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: isSel ? AppColors.accent.withValues(alpha: 0.3) : Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                iconData,
                size: 14,
                color: isSel ? Colors.black : (isDark ? AppColors.accent : const Color(0xFF374151)),
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: isSel ? FontWeight.w900 : FontWeight.w700,
                  color: isSel ? Colors.black : text,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMap(List<Listing> listings, bool isDark) {
    final geoListings =
        listings.where((l) => l.location.geoPoint != null).toList();

    // Re-cluster whenever the filtered set changes (filters / feed updates).
    final key = geoListings.map((l) => l.id).join('|');
    if (key != _listingsKey) {
      _listingsKey = key;
      _geoListings = geoListings;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _recomputeMarkers();
      });
    }

    // Theme-aware map basemap tiles URL (CartoDB Dark vs CartoDB Voyager Light)
    final mapUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _userLocation ?? _nairobiCenter,
        initialZoom: _defaultZoom,
        minZoom: 5,
        maxZoom: 18,
        onMapReady: () {
          _camera = _mapController.camera;
          _recomputeMarkers();
        },
        onTap: (_, _p) {
          setState(() => _selectedListing = null);
          _recomputeMarkers();
        },
        onMapEvent: (event) {
          // Only re-cluster when the camera settles — not on every drag frame.
          // Covers pan (MoveEnd), fling, double-tap zoom (DoubleTapZoomEnd),
          // scroll-wheel zoom and rotation. Clustering is cheap, so
          // recomputing on each scroll-wheel tick is fine.
          if (event is MapEventMoveEnd ||
              event is MapEventFlingAnimationEnd ||
              event is MapEventDoubleTapZoomEnd ||
              event is MapEventScrollWheelZoom ||
              event is MapEventRotateEnd) {
            _camera = event.camera;
            _recomputeMarkers();
          }
        },
      ),
      children: [
        TileLayer(
          urlTemplate: mapUrl,
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'ke.maploti.maploti',
          retinaMode: true,
        ),
        MarkerLayer(markers: _markers),
      ],
    );
  }

  // ── Clustered marker building ─────────────────────────────────────────────

  void _recomputeMarkers() {
    final camera = _camera;
    if (camera == null) return;

    final clusters = clusterListings(
      listings: _geoListings,
      zoom: camera.zoom,
    );

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final markers = <Marker>[];
    if (_userLocation != null) {
      markers.add(_buildUserMarker());
    }
    for (final cluster in clusters) {
      markers.add(cluster.listings.length == 1
          ? _buildPriceMarker(cluster.listings.first, isDark)
          : _buildClusterMarker(cluster));
    }
    if (mounted) setState(() => _markers = markers);
  }

  Marker _buildUserMarker() {
    return Marker(
      point: _userLocation!,
      width: 44,
      height: 44,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.accent.withValues(alpha: 0.25),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: AppColors.accent.withValues(alpha: 0.8),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// A count badge over the group centroid; tapping it zooms in so the
  /// cluster splits apart.
  Marker _buildClusterMarker(ListingCluster cluster) {
    return Marker(
      point: cluster.centroid,
      width: 46,
      height: 46,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.mediumImpact();
          final cam = _camera;
          if (cam == null) return;
          _mapController.move(cluster.centroid, math.min(cam.zoom + 2, 18));
        },
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.accent,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.black, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: Text(
            '${cluster.listings.length}',
            style: const TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w900,
              fontSize: 14,
              color: Colors.black,
            ),
          ),
        ),
      ),
    );
  }

  Marker _buildPriceMarker(Listing listing, bool isDark) {
    final gp = listing.location.geoPoint!;
    final isSelected = _selectedListing?.id == listing.id;

    return Marker(
      point: LatLng(gp.latitude, gp.longitude),
      width: isSelected ? 110 : 92,
      height: isSelected ? 42 : 34,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.mediumImpact();
          setState(() => _selectedListing = listing);
          // Rebuild markers so the selected price tag expands/highlights
          // (markers are stored state now, not rebuilt per frame).
          _recomputeMarkers();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.accent
                : (isDark ? const Color(0xFF1E1E20) : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? Colors.black : AppColors.accent,
              width: isSelected ? 2.0 : 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: isSelected
                    ? AppColors.accent.withValues(alpha: 0.6)
                    : Colors.black.withValues(alpha: isDark ? 0.5 : 0.15),
                blurRadius: isSelected ? 12 : 6,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                listing.listingType == 'sale'
                    ? Icons.sell_outlined
                    : Icons.home_work_outlined,
                size: isSelected ? 16 : 14,
                color: isSelected ? Colors.black : AppColors.accent,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  listing.formattedPrice,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w900,
                    fontSize: isSelected ? 12 : 11,
                    color: isSelected
                        ? Colors.black
                        : (isDark ? AppColors.text : AppColors.lightText),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _MapFilterSheet(
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        sort: _priceSort,
        onCenterLocation: () {
          Navigator.pop(ctx);
          _requestAndShowUserLocation(moveCamera: true);
        },
        onApply: (min, max, sort) {
          Navigator.pop(ctx);
          setState(() {
            _minPrice = min;
            _maxPrice = max;
            _priceSort = sort;
          });
        },
        onReset: () {
          Navigator.pop(ctx);
          setState(() {
            _selectedFilter = 'All';
            _searchQuery = '';
            _searchController.clear();
            _minPrice = null;
            _maxPrice = null;
            _priceSort = PriceSort.none;
          });
        },
      ),
    );
  }

  Widget _buildPropertySheet(Listing listing, Color text, Color mute, Color elev, Color border, bool isDark) {
    return Material(
      color: Colors.transparent,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          color: elev,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: border),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.55)
                  : Colors.black.withValues(alpha: 0.15),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppPropertyImage(
                    imageUrl: listing.images.isNotEmpty ? listing.images.first : '',
                    width: 84,
                    height: 84,
                    fit: BoxFit.cover,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  const SizedBox(width: 14),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: listing.listingType == 'sale'
                                ? AppColors.accent2
                                : AppColors.accent,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            listing.listingType == 'sale' ? 'FOR SALE' : 'FOR RENT',
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(listing.title, style: AppTypography.headingSm.copyWith(color: text), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.location_on_outlined, size: 13, color: mute),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(listing.location.displayName, style: AppTypography.caption.copyWith(color: mute), overflow: TextOverflow.ellipsis),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          listing.formattedPrice,
                          style: AppTypography.price.copyWith(fontSize: 16, color: AppColors.accent),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(color: border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      onPressed: () => setState(() => _selectedListing = null),
                      child: Text('Close', style: TextStyle(color: mute, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: AccentButton(
                      label: 'View Details',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PropertyDetailScreen(listing: listing),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Modal filter sheet for the map: price range (KES) + price sort direction.
class _MapFilterSheet extends StatefulWidget {
  const _MapFilterSheet({
    required this.minPrice,
    required this.maxPrice,
    required this.sort,
    required this.onCenterLocation,
    required this.onApply,
    required this.onReset,
  });

  final double? minPrice;
  final double? maxPrice;
  final PriceSort sort;
  final VoidCallback onCenterLocation;
  final void Function(double? min, double? max, PriceSort sort) onApply;
  final VoidCallback onReset;

  @override
  State<_MapFilterSheet> createState() => _MapFilterSheetState();
}

class _MapFilterSheetState extends State<_MapFilterSheet> {
  late final TextEditingController _minController;
  late final TextEditingController _maxController;
  late PriceSort _sort;

  @override
  void initState() {
    super.initState();
    _minController = TextEditingController(
      text: widget.minPrice != null ? widget.minPrice!.toStringAsFixed(0) : '',
    );
    _maxController = TextEditingController(
      text: widget.maxPrice != null ? widget.maxPrice!.toStringAsFixed(0) : '',
    );
    _sort = widget.sort;
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  void _apply() {
    final min = double.tryParse(_minController.text.trim());
    final max = double.tryParse(_maxController.text.trim());
    if (min != null && max != null && min > max) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Min price can\'t be greater than max price.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    widget.onApply(min, max, _sort);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final border = isDark ? AppColors.border : AppColors.lightBorder;
    final fieldBg = isDark ? AppColors.bgSoft : AppColors.lightBgSoft;

    final sortOptions = [
      (PriceSort.none, 'Any'),
      (PriceSort.lowToHigh, 'Cheapest first'),
      (PriceSort.highToLow, 'Priciest first'),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.bgElev : AppColors.lightBgElev,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Map Filters', style: AppTypography.headingMd),
            const SizedBox(height: 4),
            Text(
              'Narrow markers by budget',
              style: AppTypography.caption.copyWith(color: mute),
            ),
            const SizedBox(height: 18),

            // ── Price range ────────────────────────────────────────────
            Text(
              'Price range (KES)',
              style: AppTypography.caption.copyWith(
                color: text,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildPriceField(
                    controller: _minController,
                    hint: 'Min',
                    fieldBg: fieldBg,
                    border: border,
                    text: text,
                    mute: mute,
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('—', style: TextStyle(color: AppColors.mute)),
                ),
                Expanded(
                  child: _buildPriceField(
                    controller: _maxController,
                    hint: 'Max',
                    fieldBg: fieldBg,
                    border: border,
                    text: text,
                    mute: mute,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // ── Sort ───────────────────────────────────────────────────
            Text(
              'Sort by price',
              style: AppTypography.caption.copyWith(
                color: text,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: sortOptions.map((opt) {
                final (value, label) = opt;
                final isSel = _sort == value;
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _sort = value);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      color: isSel ? AppColors.accent : fieldBg,
                      border: Border.all(
                        color: isSel ? Colors.black : border,
                        width: 1.2,
                      ),
                    ),
                    child: Text(
                      label,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: isSel ? FontWeight.w900 : FontWeight.w600,
                        color: isSel ? Colors.black : text,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // ── Actions ────────────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(color: border),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    onPressed: widget.onReset,
                    child: Text(
                      'Reset',
                      style: TextStyle(color: mute, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AccentButton(
                    label: 'Apply Filters',
                    onPressed: _apply,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.my_location, color: AppColors.accent),
              title: const Text('Center to My Live Location'),
              onTap: widget.onCenterLocation,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceField({
    required TextEditingController controller,
    required String hint,
    required Color fieldBg,
    required Color border,
    required Color text,
    required Color mute,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: fieldBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: TextStyle(
          fontFamily: 'Inter',
          color: text,
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontFamily: 'Inter',
            color: mute,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon: const Icon(
            Icons.attach_money,
            size: 18,
            color: AppColors.accent,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
        ),
      ),
    );
  }
}
