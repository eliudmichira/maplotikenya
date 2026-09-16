import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// A polished empty state: icon in a soft ring, headline, one-line message,
/// and an optional action button.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final ring = isDark ? AppColors.bgElev : AppColors.lightBgElev;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: ring,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? AppColors.border : AppColors.lightBorder,
                ),
              ),
              child: Icon(icon, size: 40, color: AppColors.accent),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: AppTypography.headingSm.copyWith(color: text),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppTypography.bodySm.copyWith(color: mute, height: 1.5),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onAction,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                icon: const Icon(Icons.add_location_alt_outlined, size: 18),
                label: Text(
                  actionLabel!,
                  style: AppTypography.button.copyWith(
                    letterSpacing: 0.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
