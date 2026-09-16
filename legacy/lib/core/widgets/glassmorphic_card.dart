import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A frosted-glass card with backdrop blur that dynamically adapts to Light & Dark mode.
class GlassmorphicCard extends StatelessWidget {
  const GlassmorphicCard({
    super.key,
    required this.child,
    this.borderRadius = 16,
    this.blur = 20,
    this.opacity = 0.85,
    this.padding,
    this.margin,
  });

  final Widget child;
  final double borderRadius;
  final double blur;
  final double opacity;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bgColor = isDark
        ? AppColors.bgElev.withValues(alpha: opacity)
        : AppColors.lightBgElev.withValues(alpha: opacity);

    final borderColor = isDark ? AppColors.border : AppColors.lightBorder;

    return Container(
      margin: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding ?? const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(color: borderColor),
              boxShadow: isDark
                  ? []
                  : [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
