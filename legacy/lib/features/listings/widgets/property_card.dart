import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_property_image.dart';
import '../../../core/widgets/profile_image.dart';
import '../../auth/models/user_profile.dart';
import '../models/listing.dart';

/// A premium property listing card. The price is the hero number (large,
/// tabular mono over the image) — title, location and stats follow in quiet
/// hierarchy. Dynamically adapts to Light and Dark mode.
class PropertyCard extends StatelessWidget {
  const PropertyCard({
    super.key,
    required this.listing,
    this.owner,
    this.onTap,
    this.onFavorite,
    this.isFavorited = false,
    this.aspectRatio = 4 / 3,
  });

  final Listing listing;

  /// Owner/agent profile (resolved by the screens from [ownerProfileProvider]).
  final UserProfile? owner;
  final VoidCallback? onTap;
  final VoidCallback? onFavorite;
  final bool isFavorited;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardBg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final borderColor = isDark ? AppColors.border : AppColors.lightBorder;
    final textColor = isDark ? AppColors.text : AppColors.lightText;
    final muteColor = isDark ? AppColors.mute : AppColors.lightMute;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap?.call();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
          boxShadow: isDark
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image with price hero + overlays ─────
            Expanded(child: _buildImageSection(isDark)),
            // ── Details section ──────────────────────
            _buildDetailsSection(textColor, muteColor, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(bool isDark) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Property image
        if (listing.images.isNotEmpty)
          AppPropertyImage(
            imageUrl: listing.images.first,
            fit: BoxFit.cover,
          )
        else
          _buildPlaceholder(isDark),

        // Gradient overlay for text readability
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.78),
                ],
              ),
            ),
          ),
        ),

        // Top row: verified badge (left) + type badge (right)
        Positioned(
          top: 10,
          left: 10,
          right: 10,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (listing.verified) _buildVerifiedBadge(),
              const SizedBox(width: 6),
              _buildTypeBadge(),
            ],
          ),
        ),

        // ── Price — the hero number ─────────────────
        Positioned(
          left: 12,
          right: 46,
          bottom: 14,
          child: Text(
            listing.formattedPrice,
            style: AppTypography.price.copyWith(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              shadows: const [
                Shadow(color: Colors.black54, blurRadius: 8, offset: Offset(0, 1)),
              ],
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),

        // Favorite button
        Positioned(
          bottom: 12,
          right: 12,
          child: GestureDetector(
            onTap: () {
              HapticFeedback.mediumImpact();
              onFavorite?.call();
            },
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isFavorited ? Icons.favorite : Icons.favorite_border,
                size: 18,
                color: isFavorited ? AppColors.error : Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVerifiedBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.verified, size: 11, color: AppColors.success),
          const SizedBox(width: 3),
          Text(
            'Verified',
            style: AppTypography.caption.copyWith(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeBadge() {
    final isSale = listing.listingType == 'sale';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: isSale ? AppColors.accent2 : AppColors.accent,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isSale ? 'FOR SALE' : 'FOR RENT',
        style: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
          color: Colors.black,
        ),
      ),
    );
  }

  /// Small "listed by" chip: owner photo (or initial) + first name.
  Widget _buildOwnerRow(Color muteColor, bool isDark) {
    final owner = this.owner;
    if (owner == null) return const SizedBox.shrink();

    final photo = profileImageProvider(owner.photoUrl);
    final name = owner.displayName.isNotEmpty
        ? owner.displayName.split(' ').first
        : 'Agent';
    final initial = owner.displayName.isNotEmpty
        ? owner.displayName[0].toUpperCase()
        : 'A';
    final accent = AppColors.accent;

    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 9,
            backgroundColor: accent.withValues(alpha: 0.14),
            foregroundImage: photo,
            child: photo == null
                ? Text(
                    initial,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: accent,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'by $name',
              style: AppTypography.caption.copyWith(
                fontSize: 11,
                color: muteColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsSection(Color textColor, Color muteColor, bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Text(
            listing.title,
            style: AppTypography.headingSm.copyWith(fontSize: 15, color: textColor),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),

          // Location
          Row(
            children: [
              Icon(Icons.location_on_outlined, size: 14, color: muteColor),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  listing.location.displayName,
                  style: AppTypography.bodySm.copyWith(color: muteColor),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Stats row (beds, baths, size)
          if (listing.propertyType != 'plot')
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildStat(Icons.bed_outlined, '${listing.bedrooms}', muteColor),
                  const SizedBox(width: 8),
                  _buildStat(Icons.bathtub_outlined, '${listing.bathrooms}', muteColor),
                  if (listing.sizeSqm > 0) ...[
                    const SizedBox(width: 8),
                    _buildStat(Icons.square_foot, '${listing.sizeSqm.toInt()} m²', muteColor),
                  ],
                ],
              ),
            )
          else if (listing.sizeSqm > 0)
            _buildStat(Icons.square_foot, '${listing.sizeSqm.toInt()} m²', muteColor),

          // Owner / agent photo chip (when the profile resolved)
          _buildOwnerRow(muteColor, isDark),
        ],
      ),
    );
  }

  Widget _buildStat(IconData icon, String value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          value,
          style: AppTypography.caption.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(bool isDark) {
    return Container(
      color: isDark ? AppColors.bgSoft : AppColors.lightBgSoft,
      child: Center(
        child: Icon(
          Icons.home_outlined,
          size: 48,
          color: isDark ? AppColors.border : AppColors.lightBorder,
        ),
      ),
    );
  }
}
