import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/accent_button.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/profile_image.dart';
import '../../../core/widgets/eyebrow_label.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/login_screen.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../notifications/screens/notification_screen.dart';
import '../models/listing.dart';
import '../providers/listing_provider.dart';
import '../screens/add_property_screen.dart';
import '../widgets/property_card.dart';
import 'detail_screen.dart';

/// The main home screen — wired to Firestore + sample fallback with live search & filters.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _searchQuery = '';
  String _selectedCategory = 'All';

  // Filters state
  String _filterCounty = 'All';
  String _filterListingType = 'All'; // All, rent, sale
  double _filterMaxPrice = 500000;
  int _filterMinBedrooms = 0;

  final _categories = const [
    {'icon': Icons.apps, 'label': 'All'},
    {'icon': Icons.apartment, 'label': 'Apartments'},
    {'icon': Icons.house, 'label': 'Houses'},
    {'icon': Icons.landscape, 'label': 'Plots'},
    {'icon': Icons.villa, 'label': 'Villas'},
    {'icon': Icons.store, 'label': 'Commercial'},
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim().toLowerCase();
      });
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    ref.invalidate(featuredListingsProvider);
    await ref.read(listingFeedProvider(_serverQuery()).notifier).refresh();
  }

  // ── Feed Queries ─────────────────────────────────────────────────────────────

  /// Index-friendly filters that go into the Firestore query (and therefore
  /// drive the provider family key — changing them starts a fresh feed).
  ListingServerQuery _serverQuery() {
    return ListingServerQuery(
      county: _filterCounty == 'All' ? '' : _filterCounty,
      propertyType: _propertyTypeForCategory(_selectedCategory),
      listingType: _filterListingType == 'All' ? '' : _filterListingType,
    );
  }

  String _propertyTypeForCategory(String category) {
    switch (category) {
      case 'Apartments':
        return 'apartment';
      case 'Houses':
        return 'house';
      case 'Plots':
        return 'plot';
      case 'Villas':
        return 'villa';
      case 'Commercial':
        return 'commercial';
      default:
        return '';
    }
  }

  /// Free-text / price / bedrooms are applied client-side on loaded pages so
  /// typing never triggers a Firestore refetch.
  ListingClientQuery _clientQuery() {
    return ListingClientQuery(
      text: _searchQuery,
      maxPrice: _filterMaxPrice >= 500000 ? null : _filterMaxPrice,
      minBedrooms: _filterMinBedrooms > 0 ? _filterMinBedrooms : null,
    );
  }

  /// Infinite-scroll trigger: fetch the next page as the user nears the end.
  void _onScroll() {
    final position = _scrollController.position;
    if (position.extentAfter < 600) {
      ref.read(listingFeedProvider(_serverQuery()).notifier).loadMore();
    }
  }

  void _openDetail(Listing listing) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => PropertyDetailScreen(listing: listing)),
    );
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

  /// Featured section content: real featured listings when they exist,
  /// otherwise a curated fallback (most-viewed actives) so the section
  /// always has something premium to show.
  List<Listing> _featuredItems(List<Listing> featured, List<Listing> active) {
    if (featured.isNotEmpty) return featured;
    final byViews = [...active]..sort((a, b) => b.views.compareTo(a.views));
    return byViews.take(10).toList();
  }

  // ── Feed Footer & Error ──────────────────────────────────────────────────────

  Widget _buildFeedFooter(ListingFeedState feed) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    if (feed.error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
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
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.accent,
              ),
            ),
            const SizedBox(width: 10),
            Text('Loading more…', style: AppTypography.caption.copyWith(color: mute)),
          ],
        ),
      );
    }
    if (!feed.hasMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: Text(
            'You have seen everything',
            style: AppTypography.caption.copyWith(color: mute),
          ),
        ),
      );
    }
    return const SizedBox(height: 24);
  }

  Widget _buildFeedError(String message) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 40),
      child: Column(
        children: [
          Icon(Icons.wifi_off_rounded, size: 56, color: mute),
          const SizedBox(height: 14),
          Text('Unable to load listings', style: AppTypography.headingSm.copyWith(color: text)),
          const SizedBox(height: 6),
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
    );
  }

  // ── Show Filter Bottom Sheet ─────────────────────────────────────────────────
  void _showFilterBottomSheet() {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final theme = Theme.of(context);
            final isDark = theme.brightness == Brightness.dark;
            final bgCard = isDark ? AppColors.bgElev : AppColors.lightBgElev;
            final border = isDark ? AppColors.border : AppColors.lightBorder;
            final text = isDark ? AppColors.text : AppColors.lightText;
            final mute = isDark ? AppColors.mute : AppColors.lightMute;

            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: bgCard,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: border),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Filter Listings', style: AppTypography.headingSm.copyWith(color: text)),
                        IconButton(
                          icon: Icon(Icons.close, color: mute),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const Divider(),
                    const SizedBox(height: 16),

                    // County Dropdown
                    Text('Location / County', style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600, color: text)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _filterCounty,
                      dropdownColor: bgCard,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'All', child: Text('All Counties')),
                        DropdownMenuItem(value: 'Nairobi', child: Text('Nairobi')),
                        DropdownMenuItem(value: 'Kiambu', child: Text('Kiambu')),
                        DropdownMenuItem(value: 'Mombasa', child: Text('Mombasa')),
                        DropdownMenuItem(value: 'Nakuru', child: Text('Nakuru')),
                      ],
                      onChanged: (val) => setModalState(() => _filterCounty = val!),
                    ),
                    const SizedBox(height: 20),

                    // Listing Type Toggle
                    Text('Listing Type', style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600, color: text)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildFilterChip('All', _filterListingType == 'All', () => setModalState(() => _filterListingType = 'All'), text, mute, border),
                        const SizedBox(width: 8),
                        _buildFilterChip('For Rent', _filterListingType == 'rent', () => setModalState(() => _filterListingType = 'rent'), text, mute, border),
                        const SizedBox(width: 8),
                        _buildFilterChip('For Sale', _filterListingType == 'sale', () => setModalState(() => _filterListingType = 'sale'), text, mute, border),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Price Slider
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Max Price (KES)', style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600, color: text)),
                        Text(
                          _filterMaxPrice >= 500000 ? 'Any Price' : 'Up to ${_filterMaxPrice.toInt()} KES',
                          style: AppTypography.caption.copyWith(color: AppColors.accent, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Slider(
                      value: _filterMaxPrice,
                      min: 10000,
                      max: 500000,
                      divisions: 49,
                      activeColor: AppColors.accent,
                      onChanged: (val) => setModalState(() => _filterMaxPrice = val),
                    ),
                    const SizedBox(height: 20),

                    // Min Bedrooms
                    Text('Minimum Bedrooms', style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600, color: text)),
                    const SizedBox(height: 8),
                    Row(
                      children: List.generate(5, (i) {
                        final label = i == 0 ? 'Any' : '$i+';
                        final isSel = _filterMinBedrooms == i;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _buildFilterChip(label, isSel, () => setModalState(() => _filterMinBedrooms = i), text, mute, border),
                        );
                      }),
                    ),
                    const SizedBox(height: 28),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: border),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () {
                              setModalState(() {
                                _filterCounty = 'All';
                                _filterListingType = 'All';
                                _filterMaxPrice = 500000;
                                _filterMinBedrooms = 0;
                              });
                            },
                            child: Text('Reset', style: TextStyle(color: text)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AccentButton(
                            label: 'Apply Filters',
                            onPressed: () {
                              setState(() {});
                              Navigator.pop(ctx);
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap, Color text, Color mute, Color border) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.accent : border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.black : text,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authStateProvider);
    final featuredAsync = ref.watch(featuredListingsProvider);
    final feed = ref.watch(listingFeedProvider(_serverQuery()));
    final favoriteIds = ref.watch(favoriteIdsProvider).asData?.value ?? const <String>{};
    final filtered = applyClientFilters(feed.items, _clientQuery());

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: FloatingActionButton.extended(
          heroTag: 'fab_post_property',
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.black,
          elevation: 4,
          icon: const Icon(Icons.add_location_alt_outlined, size: 20),
          label: const Text(
            'POST PROPERTY',
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              fontSize: 13,
            ),
          ),
          onPressed: () {
            HapticFeedback.mediumImpact();
            final user = ref.read(authServiceProvider).currentUser;
            if (user == null) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            } else {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddPropertyScreen()),
              );
            }
          },
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: _onRefresh,
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── App Bar ────────────────────────────────────────────────────
            _buildAppBar(context, authState),

            // ── Interactive Search Bar ─────────────────────────────────────
            SliverToBoxAdapter(child: _buildSearchBar(context)),

            // ── Category Chips ──────────────────────────────────────────────
            SliverToBoxAdapter(child: _buildCategoryChips()),

            // ── Featured Section ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: featuredAsync.when(
                data: (featured) {
                  final items = _featuredItems(featured, feed.items);
                  return _buildFeaturedSection(items, favoriteIds);
                },
                loading: () => _buildFeaturedShimmer(),
                error: (err, stack) {
                  debugPrint('⚠️ Error streaming featured listings: $err');
                  return const SizedBox.shrink();
                },
              ),
            ),

            // ── Recent Header ───────────────────────────────────────────────
            SliverToBoxAdapter(child: _buildRecentHeader()),

            // ── Recent Grid (paginated feed) ───────────────────────────────
            if (feed.initialLoading)
              SliverToBoxAdapter(child: _buildGridShimmer())
            else if (feed.error != null && feed.items.isEmpty)
              SliverToBoxAdapter(child: _buildFeedError(feed.error!))
            else if (filtered.isEmpty)
              SliverToBoxAdapter(child: _buildEmptyState())
            else ...[
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final listing = filtered[index];
                      return StaggeredFadeSlide(
                        index: index,
                        baseDelay: const Duration(milliseconds: 60),
                        child: PropertyCard(
                          listing: listing,
                          owner: ref.watch(ownerProfileProvider(listing.ownerId)).valueOrNull,
                          isFavorited: favoriteIds.contains(listing.id),
                          onFavorite: () => _toggleFavorite(listing),
                          onTap: () => _openDetail(listing),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.68,
                  ),
                ),
              ),
              SliverToBoxAdapter(child: _buildFeedFooter(feed)),
            ],
            const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
    );
  }

  // ── App Bar ─────────────────────────────────────────────────────────────────
  Widget _buildAppBar(BuildContext context, AsyncValue authState) {
    // Profile photo for the nav avatar (synced from Firestore photoUrl)
    final profilePhotoUrl = ref.watch(userProfileProvider).valueOrNull?.photoUrl ?? '';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.bg : AppColors.lightBg;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final elev = isDark ? AppColors.bgElev : AppColors.lightBgElev;

    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: bg.withValues(alpha: 0.95),
      surfaceTintColor: Colors.transparent,
      title: FadeSlideWidget(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'M',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w900,
                    fontSize: 19,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                'MAPLOTI',
                overflow: TextOverflow.ellipsis,
                style: AppTypography.headingSm.copyWith(
                  letterSpacing: 2.0,
                  fontWeight: FontWeight.w900,
                  color: text,
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: CreativeThemeToggle(),
        ),
        Consumer(
          builder: (context, ref, _) {
            final unreadCount = ref.watch(unreadNotificationCountProvider);
            return Stack(
              children: [
                IconButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NotificationScreen()),
                    );
                  },
                  icon: Icon(Icons.notifications_outlined, color: text),
                ),
                if (unreadCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$unreadCount',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            final user = authState.asData?.value;
            if (user == null) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            }
          },
          child: Padding(
            padding: const EdgeInsets.only(right: 16, left: 4),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: elev,
              foregroundImage: authState.asData?.value != null
                  ? profileImageProvider(profilePhotoUrl)
                  : null,
              child: authState.when(
                data: (user) => user != null
                    ? Text(
                        (user.displayName ?? user.email ?? 'U')[0].toUpperCase(),
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accent,
                        ),
                      )
                    : Icon(Icons.person_outline, size: 18, color: text),
                loading: () => const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.accent)),
                error: (_, _e) => Icon(Icons.person_outline, size: 18, color: text),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Search Bar ──────────────────────────────────────────────────────────────
  Widget _buildSearchBar(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgSoft = isDark ? AppColors.bgSoft : AppColors.lightBgSoft;
    final border = isDark ? AppColors.border : AppColors.lightBorder;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return FadeSlideWidget(
      delay: const Duration(milliseconds: 100),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        child: Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: bgSoft,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: border),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, color: mute, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: TextStyle(fontFamily: 'Inter', color: text, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search location, title, area...',
                          hintStyle: TextStyle(fontFamily: 'Inter', color: mute, fontSize: 14),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    if (_searchQuery.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          _searchController.clear();
                        },
                        child: Icon(Icons.cancel, color: mute, size: 18),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),

            // Filter button
            GestureDetector(
              onTap: () {
                HapticFeedback.mediumImpact();
                _showFilterBottomSheet();
              },
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: (_filterCounty != 'All' || _filterListingType != 'All' || _filterMinBedrooms > 0)
                        ? AppColors.accent
                        : border,
                    width: 1.0,
                  ),
                ),
                child: const Center(
                  child: Icon(Icons.tune, color: AppColors.accent, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Category Chips ──────────────────────────────────────────────────────────
  Widget _buildCategoryChips() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final border = isDark ? const Color(0xFF3A3A3C) : const Color(0xFFE5E7EB);

    return FadeSlideWidget(
      delay: const Duration(milliseconds: 150),
      child: Padding(
        padding: const EdgeInsets.only(top: 16),
        child: SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _categories.length,
            separatorBuilder: (_, _i) => const SizedBox(width: 8),
            itemBuilder: (_, index) {
              final cat = _categories[index];
              final label = cat['label'] as String;
              final isSelected = _selectedCategory == label;

              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedCategory = label);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.accent
                        : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isSelected ? AppColors.accent : border,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        cat['icon'] as IconData,
                        size: 15,
                        color: isSelected ? Colors.black : mute,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        label,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.black : text,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  // ── Featured Section ─────────────────────────────────────────────────────────
  Widget _buildFeaturedSection(List<Listing> featured, Set<String> favoriteIds) {
    if (featured.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FadeSlideWidget(
          delay: const Duration(milliseconds: 200),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const EyebrowLabel('Featured'),
                Text(
                  'See all',
                  style: AppTypography.bodySm.copyWith(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(
          height: 270,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: featured.length,
            separatorBuilder: (_, _i) => const SizedBox(width: 14),
            itemBuilder: (_, index) {
              return StaggeredFadeSlide(
                index: index,
                baseDelay: const Duration(milliseconds: 250),
                child: SizedBox(
                  width: 240,
                  child: PropertyCard(
                    listing: featured[index],
                    owner: ref.watch(ownerProfileProvider(featured[index].ownerId)).valueOrNull,
                    aspectRatio: 5 / 4,
                    isFavorited: favoriteIds.contains(featured[index].id),
                    onFavorite: () => _toggleFavorite(featured[index]),
                    onTap: () => _openDetail(featured[index]),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRecentHeader() {
    return FadeSlideWidget(
      delay: const Duration(milliseconds: 300),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const EyebrowLabel('Recent Listings'),
            Text(
              'See all',
              style: AppTypography.bodySm.copyWith(
                color: AppColors.accent,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Shimmers & Empty States ──────────────────────────────────────────────────
  Widget _buildFeaturedShimmer() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _shimmerBox(100, 16),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 270,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: 3,
              separatorBuilder: (_, _i) => const SizedBox(width: 14),
              itemBuilder: (_, _j) => _shimmerBox(240, 270),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGridShimmer() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 14,
          crossAxisSpacing: 14,
          childAspectRatio: 0.68,
        ),
        itemCount: 4,
        itemBuilder: (_, _j) => _shimmerBox(double.infinity, double.infinity),
      ),
    );
  }

  Widget _shimmerBox(double width, double height) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? AppColors.bgElev : AppColors.lightBgSoft,
      highlightColor: isDark ? AppColors.bgSoft : AppColors.lightBgElev,
      child: Container(
        width: width == double.infinity ? null : width,
        height: height == double.infinity ? null : height,
        decoration: BoxDecoration(
          color: AppColors.bgElev,
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 40),
      child: Column(
        children: [
          Icon(Icons.search_off_outlined, size: 56, color: mute),
          const SizedBox(height: 14),
          Text('No matching listings', style: AppTypography.headingSm.copyWith(color: text)),
          const SizedBox(height: 6),
          Text(
            'Try clearing your search term or resetting your filter criteria.',
            style: AppTypography.bodySm.copyWith(color: mute),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () {
              setState(() {
                _searchController.clear();
                _selectedCategory = 'All';
                _filterCounty = 'All';
                _filterListingType = 'All';
                _filterMaxPrice = 500000;
                _filterMinBedrooms = 0;
              });
            },
            child: const Text('Reset All Filters'),
          ),
        ],
      ),
    );
  }
}
