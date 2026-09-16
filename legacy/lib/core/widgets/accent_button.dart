import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';

/// 3D Embossed Lime Pill Primary Button matching the Auth page design language.
class AccentButton extends StatefulWidget {
  const AccentButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isExpanded = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isExpanded;

  @override
  State<AccentButton> createState() => _AccentButtonState();
}

class _AccentButtonState extends State<AccentButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.isLoading || widget.onPressed == null
          ? null
          : () {
              HapticFeedback.mediumImpact();
              widget.onPressed!();
            },
      child: AnimatedScale(
        scale: _isPressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          width: widget.isExpanded ? double.infinity : null,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFFE2FF5E), // vibrant top highlight lime
                Color(0xFF9BE500), // rich base lime
              ],
            ),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.5),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.accent.withValues(alpha: 0.4),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: widget.isExpanded ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.isLoading)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    color: Colors.black,
                  ),
                )
              else ...[
                Text(
                  widget.label.toUpperCase(),
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 1.2,
                    color: Colors.black,
                  ),
                ),
                if (widget.icon != null) ...[
                  const SizedBox(width: 8),
                  Icon(widget.icon, size: 17, color: Colors.black),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Ghost/outline button matching the 3D tactile pill aesthetic.
class OutlineAccentButton extends StatefulWidget {
  const OutlineAccentButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isExpanded = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isExpanded;

  @override
  State<OutlineAccentButton> createState() => _OutlineAccentButtonState();
}

class _OutlineAccentButtonState extends State<OutlineAccentButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onPressed == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              widget.onPressed!();
            },
      child: AnimatedScale(
        scale: _isPressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          width: widget.isExpanded ? double.infinity : null,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? [const Color(0xFF262628), const Color(0xFF161618)]
                  : [Colors.white, const Color(0xFFF3F4F6)],
            ),
            border: Border.all(
              color: isDark ? const Color(0xFF363639) : const Color(0xFFE2E4E8),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.06),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: widget.isExpanded ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.label.toUpperCase(),
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  letterSpacing: 1.0,
                  color: text,
                ),
              ),
              if (widget.icon != null) ...[
                const SizedBox(width: 8),
                Icon(widget.icon, size: 17, color: text),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
