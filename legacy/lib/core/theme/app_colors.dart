import 'dart:ui';

/// Design tokens for dark & light modes.
class AppColors {
  AppColors._();

  // ── Backgrounds (dark mode) ──────────────────────────
  static const Color bg       = Color(0xFF0A0A0A);  // page background
  static const Color bgSoft   = Color(0xFF0E0E0E);  // subtle elevation
  static const Color bgElev   = Color(0xFF131313);  // card / elevated bg

  // ── Backgrounds (light mode) ─────────────────────────
  static const Color lightBg       = Color(0xFFF8F9FA);  // light page background
  static const Color lightBgSoft   = Color(0xFFF1F3F5);  // subtle light elevation
  static const Color lightBgElev   = Color(0xFFFFFFFF);  // card / elevated bg

  // ── Borders ──────────────────────────────────────────
  static const Color border      = Color(0xFF1C1C1C);  // dark mode hairline borders
  static const Color lightBorder = Color(0xFFE9ECEF);  // light mode borders

  // ── Text ─────────────────────────────────────────────
  static const Color text        = Color(0xFFF2F2F2);  // primary text dark
  static const Color mute        = Color(0xFF6E6E6E);  // secondary / labels dark

  static const Color lightText   = Color(0xFF111827);  // primary text light
  static const Color lightMute   = Color(0xFF6B7280);  // secondary / labels light

  // ── Accent ───────────────────────────────────────────
  static const Color accent      = Color(0xFFBFFF1A);  // lime accent
  static const Color accentDim   = Color(0xFF8FC816);  // darker shade
  static const Color accentDark  = Color(0xFF7AA800);  // deep lime for light mode buttons
  static const Color accent2     = Color(0xFFFF6B2C);  // orange highlight

  // ── Semantic ────────────────────────────────────────
  static const Color success     = Color(0xFF22C55E);
  static const Color error       = Color(0xFFEF4444);
  static const Color warning     = Color(0xFFFBBF24);

  // ── Glassmorphism helpers ───────────────────────────
  static Color glassBackground  = bgElev.withValues(alpha: 0.85);
  static Color glassBorder      = border;
}
