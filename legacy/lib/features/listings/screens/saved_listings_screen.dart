import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/listing_provider.dart';
import '../widgets/property_card.dart';
import 'detail_screen.dart';

class SavedListingsScreen extends ConsumerWidget {
  const SavedListingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final userProfileAsync = ref.watch(userProfileProvider);

    final text = isDark ? AppColors.text : AppColors.lightText;

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
                'SAVED PROPERTIES',
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
      body: userProfileAsync.when(
        data: (profile) {
          final savedIds = profile?.savedProperties ?? [];

          if (savedIds.isEmpty) {
            return const EmptyState(
              icon: Icons.favorite_border,
              title: 'No saved properties yet',
              message: 'Tap the heart icon on any property to save it here for quick access.',
            );
          }

          // Fetch only the saved documents by ID — never the whole collection.
          // Key the family member by the sorted joined IDs so widget rebuilds
          // do not refetch.
          final savedKey = (savedIds.toSet().toList()..sort()).join(',');
          return ref.watch(savedListingsProvider(savedKey)).when(
            data: (fetched) {
              final savedListings = [...fetched]
                ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

              return GridView.builder(
                padding: const EdgeInsets.all(20),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 14,
                  childAspectRatio: 0.68,
                ),
                itemCount: savedListings.length,
                itemBuilder: (context, index) {
                  final listing = savedListings[index];
                  return StaggeredFadeSlide(
                    index: index,
                    child: PropertyCard(
                      listing: listing,
                      owner: ref.watch(ownerProfileProvider(listing.ownerId)).valueOrNull,
                      isFavorited: true,
                      onFavorite: () => ref.read(authServiceProvider).toggleFavoriteProperty(listing.id),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => PropertyDetailScreen(listing: listing)),
                        );
                      },
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (err, _) => Center(child: Text('Error loading saved properties: $err', style: TextStyle(color: text))),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
        error: (err, _) => Center(child: Text('Error: $err', style: TextStyle(color: text))),
      ),
    );
  }
}
