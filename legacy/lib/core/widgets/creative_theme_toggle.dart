import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/app_colors.dart';
import '../theme/theme_provider.dart';

/// A sleek, ultra-premium iOS/Mac style Light/Dark mode pill switcher.
/// Features a sliding thumb with sun/moon icon and micro-haptic feedback.
class CreativeThemeToggle extends ConsumerWidget {
  const CreativeThemeToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        ref.read(themeModeProvider.notifier).toggleTheme();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        width: 60,
        height: 32,
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFE5E7EB),
          border: Border.all(
            color: isDark ? AppColors.border : AppColors.lightBorder,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.3)
                  : Colors.black.withValues(alpha: 0.06),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Static background icons
            Positioned(
              left: 5,
              top: 3,
              child: Icon(
                Icons.wb_sunny_rounded,
                size: 18,
                color: isDark ? const Color(0xFF6B7280) : const Color(0xFFF59E0B),
              ),
            ),
            Positioned(
              right: 5,
              top: 3,
              child: Icon(
                Icons.nightlight_round,
                size: 18,
                color: isDark ? AppColors.accent : const Color(0xFF9CA3AF),
              ),
            ),

            // Animated sliding knob
            AnimatedAlign(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOutBack,
              alignment: isDark ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppColors.bgElev : Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: isDark
                          ? AppColors.accent.withValues(alpha: 0.3)
                          : Colors.black.withValues(alpha: 0.15),
                      blurRadius: 6,
                      spreadRadius: 0.5,
                    ),
                  ],
                ),
                child: Center(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: isDark
                        ? const Icon(
                            Icons.nightlight_round,
                            key: ValueKey('dark'),
                            size: 14,
                            color: AppColors.accent,
                          )
                        : const Icon(
                            Icons.wb_sunny_rounded,
                            key: ValueKey('light'),
                            size: 14,
                            color: Color(0xFFF59E0B),
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
