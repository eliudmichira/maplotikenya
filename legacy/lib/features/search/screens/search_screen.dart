import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../listings/models/listing.dart';
import '../../listings/providers/listing_provider.dart';
import '../../listings/screens/detail_screen.dart';
import '../../listings/widgets/property_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  final _scrollController = ScrollController();
  bool _searchFocused = false;
  String _textQuery = '';

  String? _activeListingType;   // 'rent' | 'sale' | null
  String? _activePropertyType;  // 'apartment' | 'house' | 'villa' | 'plot' | null
  int? _activeBedrooms;         // 1, 2, 3, 4 (means 4+) | null

  static const _popularAreas = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Thika'];

  late final AnimationController _headerAnim;
  late final Animation<double> _headerFade;

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(() {
      setState(() => _searchFocused = _searchFocusNode.hasFocus);
    });
    _headerAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _headerFade = CurvedAnimation(parent: _headerAnim, curve: Curves.easeOut);
    _headerAnim.forward();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _scrollController.dispose();
    _headerAnim.dispose();
    super.dispose();
  }

  // ── Feed queries (server-side type/listing filters + client-side text/beds) ─

  ListingServerQuery _serverQuery() {
    return ListingServerQuery(
      propertyType: _activePropertyType ?? '',
      listingType: _activeListingType ?? '',
    );
  }

  ListingClientQuery _clientQuery() {
    int? minBeds;
    int? maxBeds;
    final b = _activeBedrooms;
    if (b != null) {
      if (b >= 4) {
        minBeds = 4;
      } else {
        minBeds = b;
        maxBeds = b;
      }
    }
    return ListingClientQuery(
      text: _textQuery,
      minBedrooms: minBeds,
      maxBedrooms: maxBeds,
    );
  }

  /// Infinite-scroll trigger: fetch the next page as the user nears the end.
  void _onScroll() {
    final position = _scrollController.position;
    if (position.extentAfter < 600) {
      ref.read(listingFeedProvider(_serverQuery()).notifier).loadMore();
    }
  }

  bool get _hasAnyFilter =>
      _textQuery.trim().isNotEmpty ||
      _activeListingType != null ||
      _activePropertyType != null ||
      _activeBedrooms != null;

  void _clearAll() {
    _searchController.clear();
    setState(() {
      _textQuery = '';
      _activeListingType = null;
      _activePropertyType = null;
      _activeBedrooms = null;
    });
  }

  void _searchArea(String area) {
    HapticFeedback.selectionClick();
    _searchController.text = area;
    setState(() => _textQuery = area);
  }

  void _toggleFavorite(Listing listing) {
    final user = ref.read(authStateProvider).asData?.value;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sign in to save properties.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    // PropertyCard already plays the haptic on the heart tap.
    ref.read(authServiceProvider).toggleFavoriteProperty(listing.id);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final feed = ref.watch(listingFeedProvider(_serverQuery()));
    final favoriteIds = ref.watch(favoriteIdsProvider).asData?.value ?? const <String>{};
    final filtered = applyClientFilters(feed.items, _clientQuery());

    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final border = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E7EB);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        body: SafeArea(
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // ── Hero header (scrolls away; search stays pinned) ──────────
              SliverToBoxAdapter(
                child: FadeTransition(
                  opacity: _headerFade,
                  child: Stack(
                    // Let the glow bleed past the hero bounds instead of
                    // being clipped by the default Clip.hardEdge.
                    clipBehavior: Clip.none,
                    children: [
                      // Soft radial glow behind the hero — the brand moment.
                      Positioned(
                        right: -60,
                        top: -80,
                        child: IgnorePointer(
                          child: Container(
                            width: 240,
                            height: 240,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  AppColors.accent.withValues(alpha: isDark ? 0.16 : 0.12),
                                  AppColors.accent.withValues(alpha: 0.0),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 18, 16, 6),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Find Your',
                                    style: AppTypography.headingLg.copyWith(
                                      color: text,
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  ShaderMask(
                                    shaderCallback: (bounds) => const LinearGradient(
                                      colors: [Color(0xFFD4FF3D), Color(0xFF9BE500)],
                                    ).createShader(bounds),
                                    child: Text(
                                      'Dream Property',
                                      style: AppTypography.headingLg.copyWith(
                                        color: Colors.white,
                                        fontSize: 26,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: -1.0,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const CreativeThemeToggle(),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Pinned search bar + quick chips ───────────────────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _PinnedSearchDelegate(
                  background: theme.scaffoldBackgroundColor,
                  searchBar: _buildSearchBar(isDark, text, mute, border),
                  chips: _buildChipsRow(isDark, text),
                ),
              ),

              // ── Popular areas (only on a fresh, unfiltered state) ─────────
              if (!_hasAnyFilter)
                SliverToBoxAdapter(child: _buildPopularAreas(isDark, text, mute)),

              // ── Results count ─────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildCountRow(filtered.length, mute)),

              // ── States + results grid ─────────────────────────────────────
              if (feed.initialLoading)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(
                            color: AppColors.accent,
                            strokeWidth: 2.5,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Loading properties…',
                          style: AppTypography.bodySm.copyWith(color: mute),
                        ),
                      ],
                    ),
                  ),
                )
              else if (feed.error != null && feed.items.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildFeedError(feed.error!, isDark, text, mute),
                )
              else if (filtered.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildEmptyState(isDark, text, mute),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                  sliver: SliverGrid(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final listing = filtered[index];
                        return StaggeredFadeSlide(
                          index: index,
                          baseDelay: const Duration(milliseconds: 60),
                          stagger: const Duration(milliseconds: 50),
                          child: PropertyCard(
                            listing: listing,
                            owner: ref.watch(ownerProfileProvider(listing.ownerId)).valueOrNull,
                            isFavorited: favoriteIds.contains(listing.id),
                            onFavorite: () => _toggleFavorite(listing),
                            onTap: () {
                              FocusScope.of(context).unfocus();
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      PropertyDetailScreen(listing: listing),
                                ),
                              );
                            },
                          ),
                        );
                      },
                      childCount: filtered.length,
                    ),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.68,
                    ),
                  ),
                ),
                SliverToBoxAdapter(child: _buildFeedFooter(feed, mute)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ── Header pieces ─────────────────────────────────────────────────────────

  Widget _buildSearchBar(bool isDark, Color text, Color mute, Color border) {
    final bgSurface = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 52,
        decoration: BoxDecoration(
          color: bgSurface,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: _searchFocused
                ? AppColors.accent.withValues(alpha: 0.7)
                : border,
            width: _searchFocused ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: _searchFocused
                  ? AppColors.accent.withValues(alpha: 0.10)
                  : Colors.black.withValues(alpha: isDark ? 0.35 : 0.07),
              blurRadius: _searchFocused ? 20 : 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            const SizedBox(width: 16),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Icon(
                Icons.search_rounded,
                key: ValueKey(_searchFocused),
                color: _searchFocused ? AppColors.accent : mute,
                size: 22,
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
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  letterSpacing: -0.2,
                ),
                decoration: InputDecoration(
                  hintText: 'Area, title, property type…',
                  hintStyle: TextStyle(
                    fontFamily: 'Inter',
                    color: mute,
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  isDense: false,
                  contentPadding: const EdgeInsets.symmetric(vertical: 16),
                ),
                onChanged: (v) => setState(() => _textQuery = v),
                onSubmitted: (_) => FocusScope.of(context).unfocus(),
              ),
            ),
            if (_textQuery.isNotEmpty)
              GestureDetector(
                onTap: () {
                  _searchController.clear();
                  setState(() => _textQuery = '');
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Icon(Icons.cancel_rounded, color: mute, size: 20),
                ),
              ),
            GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                _showFilterSheet(context, isDark, text, mute, border);
              },
              child: Container(
                margin: const EdgeInsets.all(6),
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: (_activeListingType != null ||
                          _activePropertyType != null ||
                          _activeBedrooms != null)
                      ? AppColors.accent
                      : (isDark
                          ? const Color(0xFF2A2A2C)
                          : const Color(0xFFF3F4F6)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  Icons.tune_rounded,
                  size: 19,
                  color: (_activeListingType != null ||
                          _activePropertyType != null ||
                          _activeBedrooms != null)
                      ? Colors.black
                      : mute,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChipsRow(bool isDark, Color text) {
    return SizedBox(
      height: 36,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _chip('For Rent', _activeListingType == 'rent', isDark, text, () {
            HapticFeedback.selectionClick();
            setState(() =>
                _activeListingType = _activeListingType == 'rent' ? null : 'rent');
          }),
          _chip('For Sale', _activeListingType == 'sale', isDark, text, () {
            HapticFeedback.selectionClick();
            setState(() =>
                _activeListingType = _activeListingType == 'sale' ? null : 'sale');
          }),
          _chip('Apartment', _activePropertyType == 'apartment', isDark, text, () {
            HapticFeedback.selectionClick();
            setState(() => _activePropertyType =
                _activePropertyType == 'apartment' ? null : 'apartment');
          }),
          _chip('House', _activePropertyType == 'house', isDark, text, () {
            HapticFeedback.selectionClick();
            setState(() => _activePropertyType =
                _activePropertyType == 'house' ? null : 'house');
          }),
          _chip('Villa', _activePropertyType == 'villa', isDark, text, () {
            HapticFeedback.selectionClick();
            setState(() => _activePropertyType =
                _activePropertyType == 'villa' ? null : 'villa');
          }),
          _chip('Plot', _activePropertyType == 'plot', isDark, text, () {
            HapticFeedback.selectionClick();
            setState(() => _activePropertyType =
                _activePropertyType == 'plot' ? null : 'plot');
          }),
        ],
      ),
    );
  }

  Widget _buildPopularAreas(bool isDark, Color text, Color mute) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 16, 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'POPULAR AREAS',
            style: AppTypography.eyebrow.copyWith(color: mute, fontSize: 10),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _popularAreas.map((area) {
              return GestureDetector(
                onTap: () => _searchArea(area),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.accent.withValues(alpha: 0.10)
                        : AppColors.accentDark.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.accent.withValues(alpha: 0.35),
                      width: 1.0,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 13, color: AppColors.accentDark),
                      const SizedBox(width: 5),
                      Text(
                        area,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: text,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCountRow(int count, Color mute) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 16, 8),
      child: Row(
        children: [
          Text(
            _hasAnyFilter
                ? '$count result${count == 1 ? '' : 's'}'
                : '$count propert${count == 1 ? 'y' : 'ies'}',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: mute,
            ),
          ),
          const Spacer(),
          if (_hasAnyFilter)
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                _clearAll();
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.close_rounded, size: 13, color: AppColors.error),
                    const SizedBox(width: 4),
                    Text(
                      'Clear all',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFeedFooter(ListingFeedState feed, Color mute) {
    if (feed.error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Center(
          child: TextButton(
            onPressed: () {
              ref.read(listingFeedProvider(_serverQuery()).notifier).loadMore();
            },
            child: const Text('Could not load more — tap to retry'),
          ),
        ),
      );
    }
    if (feed.loadingMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.accent,
            ),
          ),
        ),
      );
    }
    if (!feed.hasMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Text(
            'You have seen everything',
            style: AppTypography.caption.copyWith(color: mute),
          ),
        ),
      );
    }
    return const SizedBox(height: 12);
  }

  Widget _buildFeedError(String message, bool isDark, Color text, Color mute) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 48, color: mute),
            const SizedBox(height: 16),
            Text(
              'Unable to load listings',
              style: AppTypography.headingSm.copyWith(color: text),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppTypography.bodySm.copyWith(color: mute),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                ref.read(listingFeedProvider(_serverQuery()).notifier).refresh();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark, Color text, Color mute) {
    return EmptyState(
      icon: Icons.search_off_rounded,
      title: 'No results found',
      message: _textQuery.isNotEmpty
          ? 'No properties match "$_textQuery". Try a different keyword or clear your filters.'
          : 'Try adjusting your filters to see more properties.',
      actionLabel: _hasAnyFilter ? 'CLEAR FILTERS' : null,
      onAction: _hasAnyFilter ? _clearAll : null,
    );
  }

  Widget _chip(
    String label,
    bool active,
    bool isDark,
    Color text,
    VoidCallback onTap,
  ) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: active
                ? AppColors.accent
                : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: active
                  ? Colors.transparent
                  : (isDark
                      ? const Color(0xFF2C2C2E)
                      : const Color(0xFFE5E7EB)),
              width: 1.0,
            ),
            boxShadow: [
              if (active)
                BoxShadow(
                  color: AppColors.accent.withValues(alpha: 0.28),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              else
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
            ],
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: active ? FontWeight.w800 : FontWeight.w600,
              color: active ? Colors.black : text,
              letterSpacing: -0.1,
            ),
          ),
        ),
      ),
    );
  }

  void _showFilterSheet(
    BuildContext context,
    bool isDark,
    Color text,
    Color mute,
    Color border,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Container(
              padding: EdgeInsets.fromLTRB(
                24, 20, 24,
                MediaQuery.of(ctx).viewInsets.bottom + 32,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(top: BorderSide(color: border, width: 1.0)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
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
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      Text(
                        'Filters',
                        style: AppTypography.headingMd.copyWith(color: text),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _activeListingType = null;
                            _activePropertyType = null;
                            _activeBedrooms = null;
                          });
                          setModalState(() {});
                        },
                        child: Text(
                          'Reset',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Listing Type
                  Text('LISTING TYPE',
                      style: AppTypography.eyebrow.copyWith(color: mute)),
                  const SizedBox(height: 10),
                  Row(
                    children: ['rent', 'sale'].map((type) {
                      final active = _activeListingType == type;
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() =>
                                _activeListingType = active ? null : type);
                            setModalState(() {});
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 10),
                            decoration: BoxDecoration(
                              color: active
                                  ? AppColors.accent
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: active ? AppColors.accent : border,
                                width: 1.2,
                              ),
                            ),
                            child: Text(
                              type == 'rent' ? 'For Rent' : 'For Sale',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: active ? Colors.black : text,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // Property Type
                  Text('PROPERTY TYPE',
                      style: AppTypography.eyebrow.copyWith(color: mute)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: ['apartment', 'house', 'villa', 'plot'].map((type) {
                      final active = _activePropertyType == type;
                      return GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() =>
                              _activePropertyType = active ? null : type);
                          setModalState(() {});
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 10),
                          decoration: BoxDecoration(
                            color: active
                                ? AppColors.accent
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: active ? AppColors.accent : border,
                              width: 1.2,
                            ),
                          ),
                          child: Text(
                            '${type[0].toUpperCase()}${type.substring(1)}',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: active ? Colors.black : text,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // Bedrooms
                  Text('BEDROOMS',
                      style: AppTypography.eyebrow.copyWith(color: mute)),
                  const SizedBox(height: 10),
                  Row(
                    children: [1, 2, 3, 4].map((beds) {
                      final active = _activeBedrooms == beds;
                      final label = beds == 4 ? '4+' : '$beds';
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() =>
                                _activeBedrooms = active ? null : beds);
                            setModalState(() {});
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            width: 52,
                            height: 48,
                            decoration: BoxDecoration(
                              color: active
                                  ? AppColors.accent
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: active ? AppColors.accent : border,
                                width: 1.2,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              label,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: active ? Colors.black : text,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 32),

                  // Apply button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        Navigator.pop(ctx);
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFFD4FF3D), Color(0xFF9BE500)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withValues(alpha: 0.30),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'Show Results',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF111111),
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

/// Pins the search bar + quick chips while the hero scrolls away.
class _PinnedSearchDelegate extends SliverPersistentHeaderDelegate {
  _PinnedSearchDelegate({
    required this.background,
    required this.searchBar,
    required this.chips,
  });

  final Color background;
  final Widget searchBar;
  final Widget chips;

  @override
  double get minExtent => 52 + 12 + 36 + 12;

  @override
  double get maxExtent => minExtent;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return ColoredBox(
      color: background,
      child: Column(
        children: [
          searchBar,
          const SizedBox(height: 12),
          chips,
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _PinnedSearchDelegate oldDelegate) {
    return oldDelegate.searchBar != searchBar ||
        oldDelegate.chips != chips ||
        oldDelegate.background != background;
  }
}
