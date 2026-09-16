import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/listing.dart';
import '../providers/listing_provider.dart';
import '../widgets/property_card.dart';
import 'add_property_screen.dart';
import 'detail_screen.dart';

/// Lets a signed-in owner see, open, and delete the listings they posted.
class MyListingsScreen extends ConsumerWidget {
  const MyListingsScreen({super.key});

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    Listing listing,
  ) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final text = isDark ? AppColors.text : AppColors.lightText;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: cardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete listing?', style: AppTypography.headingSm.copyWith(color: text)),
        content: Text(
          '"${listing.title}" will be permanently removed. This cannot be undone.',
          style: AppTypography.bodySm.copyWith(color: text),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.mute)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      HapticFeedback.mediumImpact();
      await ref.read(firestoreServiceProvider).deleteListing(listing.id);
      ref.invalidate(myListingsProvider(listing.ownerId));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Listing deleted.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final user = ref.watch(authStateProvider).asData?.value;

    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
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
                    fontSize: 17,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                'MY LISTINGS',
                overflow: TextOverflow.ellipsis,
                style: AppTypography.headingSm.copyWith(
                  letterSpacing: 2.0,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: text,
                ),
              ),
            ),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: CreativeThemeToggle(),
          ),
        ],
      ),
      body: user == null
          ? Center(
              child: Text(
                'Sign in to manage your listings.',
                style: AppTypography.bodySm.copyWith(color: mute),
              ),
            )
          : ref.watch(myListingsProvider(user.uid)).when(
              data: (listings) {
                if (listings.isEmpty) {
                  return EmptyState(
                    icon: Icons.home_work_outlined,
                    title: 'You have not posted any listings yet',
                    message: 'Tap POST PROPERTY to list your first property and reach buyers instantly.',
                    actionLabel: 'POST PROPERTY',
                    onAction: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const AddPropertyScreen()),
                      );
                    },
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.68,
                  ),
                  itemCount: listings.length,
                  itemBuilder: (context, index) {
                    final listing = listings[index];
                    return StaggeredFadeSlide(
                      index: index,
                      child: Stack(
                        children: [
                          PropertyCard(
                            listing: listing,
                            owner: ref.watch(ownerProfileProvider(listing.ownerId)).valueOrNull,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      PropertyDetailScreen(listing: listing),
                                ),
                              );
                            },
                          ),
                          // Delete overlay (covers the card's heart slot).
                          Positioned(
                            bottom: 12,
                            right: 12,
                            child: GestureDetector(
                              onTap: () => _confirmDelete(context, ref, listing),
                              child: Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.55),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.delete_outline,
                                  size: 18,
                                  color: AppColors.error,
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
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.accent),
              ),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(
                    'Failed to load your listings: $err',
                    style: AppTypography.bodySm.copyWith(color: mute),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
    );
  }
}
