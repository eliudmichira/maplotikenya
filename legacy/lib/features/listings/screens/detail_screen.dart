import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/accent_button.dart';
import '../../../core/widgets/app_property_image.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/eyebrow_label.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../../core/widgets/glassmorphic_card.dart';
import '../../auth/models/user_profile.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/services/realtime_db_service.dart';
import '../models/listing.dart';
import '../providers/listing_provider.dart';
import '../widgets/property_card.dart';

class PropertyDetailScreen extends ConsumerStatefulWidget {
  const PropertyDetailScreen({super.key, required this.listing});

  final Listing listing;

  @override
  ConsumerState<PropertyDetailScreen> createState() =>
      _PropertyDetailScreenState();
}

class _PropertyDetailScreenState
    extends ConsumerState<PropertyDetailScreen> {
  final _pageController = PageController();
  int _currentImageIndex = 0;
  UserProfile? _ownerProfile;
  bool _ownerLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (widget.listing.id.isNotEmpty) {
        ref
            .read(firestoreServiceProvider)
            .incrementViews(widget.listing.id)
            .catchError((_) {});
      }
      final profile = await ref
          .read(firestoreServiceProvider)
          .getOwnerProfile(widget.listing.ownerId);
      if (mounted) {
        setState(() {
          _ownerProfile = profile;
          _ownerLoading = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  // ── Contact actions ──────────────────────────────────────────────────────────

  Future<void> _callOwner() async {
    HapticFeedback.mediumImpact();
    final phone = _ownerProfile?.phone.trim() ?? '';
    if (phone.isEmpty) {
      _showNoContactSnackbar();
      return;
    }
    final normalized = phone.startsWith('+') ? phone : '+254${phone.replaceFirst(RegExp(r'^0'), '')}';
    final uri = Uri(scheme: 'tel', path: normalized);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
      _notifyOwnerInquiry();
    } else {
      _showNoContactSnackbar();
    }
  }

  Future<void> _whatsAppOwner() async {
    HapticFeedback.mediumImpact();
    final phone = _ownerProfile?.phone.trim() ?? '';
    if (phone.isEmpty) {
      _showNoContactSnackbar();
      return;
    }
    final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
    final wa = digits.startsWith('254') ? digits : '254${digits.replaceFirst(RegExp(r'^0'), '')}';
    final message = Uri.encodeComponent(
      'Hi, I\'m interested in "${widget.listing.title}" in ${widget.listing.location.displayName} listed on Maploti.',
    );
    final uri = Uri.parse('https://wa.me/$wa?text=$message');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      _notifyOwnerInquiry();
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('WhatsApp is not installed on this device.')),
      );
    }
  }

  /// Push a real-time "listing inquiry" event to the listing owner so they
  /// see it in their Notifications feed. Only fires for signed-in users who
  /// are not contacting their own listing.
  Future<void> _notifyOwnerInquiry() async {
    final ownerId = widget.listing.ownerId;
    if (ownerId.isEmpty) return;
    final me = ref.read(authServiceProvider).currentUser?.uid;
    if (me == null || me == ownerId) return;
    try {
      await RealtimeDbService().pushEvent(ownerId, {
        'type': 'listing_inquiry',
        'listingId': widget.listing.id,
        'listingTitle': widget.listing.title,
        'message':
            'A potential client contacted you about "${widget.listing.title}"',
      });
    } catch (_) {
      // Presence/event push is best-effort; never block the contact action.
    }
  }

  void _showNoContactSnackbar() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Contact details not available for this listing.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _toggleFavorite() {
    HapticFeedback.lightImpact();
    final user = ref.read(authStateProvider).asData?.value;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to save properties.')),
      );
      return;
    }
    ref.read(authServiceProvider).toggleFavoriteProperty(widget.listing.id);
  }

  /// Share this listing as a deep link to the public Maploti website
  /// (property.html?id=…), so anyone opening it sees the same live listing.
  Future<void> _shareListing() async {
    HapticFeedback.mediumImpact();
    final listing = widget.listing;
    final url = '$kWebBaseUrl/property.html?id=${Uri.encodeComponent(listing.id)}';
    final text =
        '${listing.title} — ${listing.formattedPrice} in ${listing.location.displayName} on Maploti';
    try {
      await SharePlus.instance.share(ShareParams(
        title: '${listing.title} on Maploti',
        text: '$text\n$url',
        subject: '${listing.title} on Maploti',
      ));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open the share sheet.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final listing = widget.listing;

    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final isFavorited =
        ref.watch(favoriteIdsProvider).asData?.value.contains(listing.id) ??
            false;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // ── Image Header ───────────────────────────────────────────
              _buildImageHeader(context, listing, isFavorited),
              // ── Details Body ───────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTitleAndPrice(listing, text, mute),
                      const SizedBox(height: 16),
                      _buildLocationRow(listing, text, mute),
                      const SizedBox(height: 24),
                      if (listing.propertyType != 'plot') _buildKeySpecs(listing, text, mute),
                      const SizedBox(height: 24),
                      _buildDescription(listing, text, mute),
                      const SizedBox(height: 24),
                      if (listing.amenities.isNotEmpty) _buildAmenities(listing, text, isDark),
                      const SizedBox(height: 24),
                      _buildOwnerCard(text, mute, isDark),
                      const SizedBox(height: 24),
                      _buildSimilarSection(listing, text, mute),
                      const SizedBox(height: 120),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // ── Sticky Contact Bar ─────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildStickyContactBar(context, isDark, mute),
          ),
        ],
      ),
    );
  }

  // ── Image Header with Carousel ───────────────────────────────────────────────

  Widget _buildImageHeader(
    BuildContext context,
    Listing listing,
    bool isFavorited,
  ) {
    final theme = Theme.of(context);
    final images = listing.images;

    return SliverAppBar(
      expandedHeight: 340,
      pinned: true,
      backgroundColor: theme.scaffoldBackgroundColor,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.black.withValues(alpha: 0.6),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      actions: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: CreativeThemeToggle(),
        ),
        // Share button
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: CircleAvatar(
            backgroundColor: Colors.black.withValues(alpha: 0.6),
            child: IconButton(
              icon: const Icon(Icons.share_outlined, color: Colors.white, size: 20),
              onPressed: _shareListing,
            ),
          ),
        ),
        // Favorite button
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: CircleAvatar(
            backgroundColor: Colors.black.withValues(alpha: 0.6),
            child: IconButton(
              icon: Icon(
                isFavorited ? Icons.favorite : Icons.favorite_border,
                color: isFavorited ? AppColors.error : Colors.white,
                size: 20,
              ),
              onPressed: _toggleFavorite,
            ),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // ── Image PageView carousel ──────────────────────────────────
            if (images.isNotEmpty)
              ScrollConfiguration(
                behavior: const MaterialScrollBehavior().copyWith(
                  dragDevices: {
                    PointerDeviceKind.touch,
                    PointerDeviceKind.mouse,
                    PointerDeviceKind.trackpad,
                    PointerDeviceKind.stylus,
                  },
                ),
                child: PageView.builder(
                  controller: _pageController,
                  physics: const BouncingScrollPhysics(),
                  itemCount: images.length,
                  onPageChanged: (i) => setState(() => _currentImageIndex = i),
                  itemBuilder: (_, i) => AppPropertyImage(
                    imageUrl: images[i],
                    fit: BoxFit.cover,
                  ),
                ),
              )
            else
              const AppPropertyImage(
                imageUrl: '',
                fit: BoxFit.cover,
              ),

            // ── Bottom gradient (Non-blocking IgnorePointer) ─────────────
            IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.3),
                      Colors.transparent,
                      theme.scaffoldBackgroundColor,
                    ],
                  ),
                ),
              ),
            ),

            // ── Carousel Navigation Arrows (Left / Right) ────────────────
            if (images.length > 1) ...[
              if (_currentImageIndex > 0)
                Positioned(
                  left: 16,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOutCubic,
                        );
                      },
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: const Icon(Icons.chevron_left, color: Colors.white, size: 24),
                      ),
                    ),
                  ),
                ),
              if (_currentImageIndex < images.length - 1)
                Positioned(
                  right: 16,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOutCubic,
                        );
                      },
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: const Icon(Icons.chevron_right, color: Colors.white, size: 24),
                      ),
                    ),
                  ),
                ),
            ],

            // ── Image counter dots (Clickable) ───────────────────────────
            if (images.length > 1)
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(images.length, (i) {
                    final isActive = i == _currentImageIndex;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        _pageController.animateToPage(
                          i,
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOutCubic,
                        );
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                        width: isActive ? 22 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isActive ? AppColors.accent : Colors.white.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: isActive
                              ? [
                                  BoxShadow(
                                    color: AppColors.accent.withValues(alpha: 0.6),
                                    blurRadius: 6,
                                  )
                                ]
                              : null,
                        ),
                      ),
                    );
                  }),
                ),
              ),

            // ── Image count badge ────────────────────────────────────────
            if (images.length > 1)
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_currentImageIndex + 1}/${images.length}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontFamily: 'Inter',
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ── Title & Price ────────────────────────────────────────────────────────────

  Widget _buildTitleAndPrice(Listing listing, Color text, Color mute) {
    return FadeSlideWidget(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  if (listing.verified) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: AppColors.success.withValues(alpha: 0.5),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, size: 12, color: AppColors.success),
                          SizedBox(width: 3),
                          Text(
                            'VERIFIED',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              Text(
                listing.formattedPrice,
                style: AppTypography.price.copyWith(fontSize: 22, color: AppColors.accent),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(listing.title, style: AppTypography.headingLg.copyWith(color: text)),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.visibility_outlined, size: 14, color: mute),
              const SizedBox(width: 4),
              Text('${listing.views} views', style: AppTypography.caption.copyWith(color: mute)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLocationRow(Listing listing, Color text, Color mute) {
    return FadeSlideWidget(
      delay: const Duration(milliseconds: 100),
      child: Row(
        children: [
          const Icon(Icons.location_on_outlined, color: AppColors.accent, size: 18),
          const SizedBox(width: 6),
          Text(
            listing.location.displayName,
            style: AppTypography.body.copyWith(color: text, fontWeight: FontWeight.w600),
          ),
          if (listing.location.address.isNotEmpty) ...[
            Text(' · ', style: TextStyle(color: mute)),
            Expanded(
              child: Text(
                listing.location.address,
                style: AppTypography.bodySm.copyWith(color: mute),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildKeySpecs(Listing listing, Color text, Color mute) {
    return FadeSlideWidget(
      delay: const Duration(milliseconds: 200),
      child: GlassmorphicCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildSpecItem(Icons.bed_outlined, '${listing.bedrooms}', 'Bedrooms', text, mute),
            _buildSpecItem(Icons.bathtub_outlined, '${listing.bathrooms}', 'Bathrooms', text, mute),
            if (listing.parking > 0)
              _buildSpecItem(Icons.local_parking, '${listing.parking}', 'Parking', text, mute),
            if (listing.sizeSqm > 0)
              _buildSpecItem(Icons.square_foot, '${listing.sizeSqm.toInt()} m²', 'Area', text, mute),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecItem(IconData icon, String value, String label, Color text, Color mute) {
    return Column(
      children: [
        Icon(icon, color: AppColors.accent, size: 24),
        const SizedBox(height: 6),
        Text(value, style: AppTypography.mono.copyWith(fontWeight: FontWeight.w700, color: text)),
        const SizedBox(height: 2),
        Text(label, style: AppTypography.caption.copyWith(color: mute)),
      ],
    );
  }

  Widget _buildDescription(Listing listing, Color text, Color mute) {
    return FadeSlideWidget(
      delay: const Duration(milliseconds: 300),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const EyebrowLabel('Description'),
          const SizedBox(height: 10),
          Text(
            listing.description.isNotEmpty
                ? listing.description
                : 'No description provided.',
            style: AppTypography.body.copyWith(color: text),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenities(Listing listing, Color text, bool isDark) {
    final chipBg = isDark ? AppColors.bgSoft : AppColors.lightBgSoft;
    final border = isDark ? AppColors.border : AppColors.lightBorder;

    return FadeSlideWidget(
      delay: const Duration(milliseconds: 400),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const EyebrowLabel('Amenities'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: listing.amenities.map((amenity) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: chipBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle_outline, size: 15, color: AppColors.accent),
                    const SizedBox(width: 6),
                    Text(
                      amenity.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: text,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ── Owner/Agent Card ─────────────────────────────────────────────────────────

  Widget _buildOwnerCard(Color text, Color mute, bool isDark) {
    return FadeSlideWidget(
      delay: const Duration(milliseconds: 500),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const EyebrowLabel('Listed By'),
          const SizedBox(height: 12),
          GlassmorphicCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.accent,
                  backgroundImage: _ownerProfile?.photoUrl.isNotEmpty == true
                      ? NetworkImage(_ownerProfile!.photoUrl)
                      : null,
                  child: _ownerProfile?.photoUrl.isEmpty != false
                      ? Text(
                          (_ownerProfile?.displayName ?? 'A')[0].toUpperCase(),
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                            fontSize: 18,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _ownerLoading
                      ? Shimmer.fromColors(
                          baseColor: isDark ? AppColors.bgElev : AppColors.lightBgSoft,
                          highlightColor: isDark ? AppColors.bgSoft : AppColors.lightBgElev,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(height: 14, width: 120, color: AppColors.bgElev),
                              const SizedBox(height: 6),
                              Container(height: 11, width: 80, color: AppColors.bgElev),
                            ],
                          ),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _ownerProfile?.displayName ?? 'Agent',
                              style: AppTypography.headingSm.copyWith(color: text),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              (_ownerProfile?.role ?? 'user').toUpperCase(),
                              style: AppTypography.caption.copyWith(color: AppColors.accent, fontWeight: FontWeight.bold),
                            ),
                            if (_ownerProfile?.phone.isNotEmpty == true) ...[
                              const SizedBox(height: 2),
                              Text(
                                _ownerProfile!.phone,
                                style: AppTypography.caption.copyWith(color: mute),
                              ),
                            ],
                          ],
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Similar Properties rail ───────────────────────────────────────────────────

  Widget _buildSimilarSection(Listing listing, Color text, Color mute) {
    final similarFeed = ref.watch(
      listingFeedProvider(ListingServerQuery(propertyType: listing.propertyType)),
    );
    if (similarFeed.initialLoading) return const SizedBox.shrink();
    final similar = similarFeed.items
        .where((l) => l.id != listing.id)
        .take(8)
        .toList();
    if (similar.isEmpty) return const SizedBox.shrink();

    return FadeSlideWidget(
      delay: const Duration(milliseconds: 600),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const EyebrowLabel('Similar Properties'),
              Text(
                'Same type',
                style: AppTypography.caption.copyWith(color: mute),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 250,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: similar.length,
              separatorBuilder: (_, _i) => const SizedBox(width: 12),
              itemBuilder: (_, index) {
                final item = similar[index];
                return SizedBox(
                  width: 210,
                  child: PropertyCard(
                    listing: item,
                    owner: ref.watch(ownerProfileProvider(item.ownerId)).valueOrNull,
                    aspectRatio: 5 / 4,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PropertyDetailScreen(listing: item),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Sticky Contact Bar ───────────────────────────────────────────────────────

  Widget _buildStickyContactBar(BuildContext context, bool isDark, Color mute) {
    final hasContact = _ownerProfile?.phone.isNotEmpty == true;
    final cardBg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final border = isDark ? AppColors.border : AppColors.lightBorder;

    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        color: cardBg,
        border: Border(top: BorderSide(color: border)),
        boxShadow: isDark
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
      ),
      child: _ownerLoading
          ? Row(
              children: [
                Expanded(
                  child: Shimmer.fromColors(
                    baseColor: isDark ? AppColors.bgElev : AppColors.lightBgSoft,
                    highlightColor: isDark ? AppColors.bgSoft : AppColors.lightBgElev,
                    child: Container(
                      height: 50,
                      decoration: BoxDecoration(
                        color: AppColors.bgElev,
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
              ],
            )
          : Row(
              children: [
                // WhatsApp button
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: hasContact ? _whatsAppOwner : null,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: hasContact ? const Color(0xFF25D366) : border,
                      ),
                      foregroundColor: hasContact ? const Color(0xFF25D366) : mute,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: const Icon(Icons.chat_outlined, size: 18),
                    label: const Text(
                      'WhatsApp',
                      style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Call button
                Expanded(
                  child: AccentButton(
                    label: hasContact ? 'Call Agent' : 'No Contact',
                    icon: hasContact ? Icons.phone : Icons.phone_disabled_outlined,
                    onPressed: hasContact ? _callOwner : null,
                  ),
                ),
              ],
            ),
    );
  }
}
