import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../../core/widgets/glassmorphic_card.dart';
import '../../listings/providers/listing_provider.dart';
import '../../listings/screens/detail_screen.dart';
import '../models/notification_item.dart';
import '../providers/notification_provider.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final notifications =
        ref.watch(notificationsProvider).asData?.value ?? const <NotificationItem>[];
    final unreadCount = ref.watch(unreadNotificationCountProvider);

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
                'NOTIFICATIONS',
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
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                ref
                    .read(readNotificationsProvider.notifier)
                    .markAllAsRead(notifications.map((n) => n.id));
              },
              child: const Text('Read All', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
            ),
          const Padding(
            padding: EdgeInsets.only(right: 16),
            child: CreativeThemeToggle(),
          ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_off_outlined, size: 70, color: mute),
                  const SizedBox(height: 16),
                  Text('No Notifications', style: AppTypography.headingSm.copyWith(color: text)),
                  const SizedBox(height: 8),
                  Text('You are all caught up! Check back later for updates.', style: AppTypography.bodySm.copyWith(color: mute)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final item = notifications[index];

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: StaggeredFadeSlide(
                    index: index,
                    child: GestureDetector(
                      onTap: () async {
                        HapticFeedback.lightImpact();
                        ref.read(readNotificationsProvider.notifier).markAsRead(item.id);
                        final listingId = item.listingId;
                        if (listingId == null || listingId.isEmpty) return;
                        final listing =
                            await ref
                                .read(firestoreServiceProvider)
                                .getListingById(listingId);
                        if (!context.mounted || listing == null) return;
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PropertyDetailScreen(listing: listing),
                          ),
                        );
                      },
                      child: GlassmorphicCard(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: item.isRead
                                    ? (isDark ? AppColors.bgSoft : AppColors.lightBgSoft)
                                    : AppColors.accent.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: item.isRead ? (isDark ? AppColors.border : AppColors.lightBorder) : AppColors.accent,
                                ),
                              ),
                              child: Icon(
                                item.icon,
                                size: 20,
                                color: item.isRead ? mute : AppColors.accent,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.title,
                                          style: AppTypography.headingSm.copyWith(
                                            color: text,
                                            fontSize: 14,
                                            fontWeight: item.isRead ? FontWeight.w600 : FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                      if (!item.isRead)
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: AppColors.accent,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.message,
                                    style: AppTypography.bodySm.copyWith(color: mute, fontSize: 13),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _formatTimestamp(item.timestamp),
                                    style: AppTypography.caption.copyWith(color: mute, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
