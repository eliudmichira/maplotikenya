import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Typography system — three-typeface identity:
///   • Inter        → UI / body text
///   • Space Grotesk → display / headings (distinctive, modern)
///   • JetBrains Mono → prices & numeric values (tabular, financial)
///
/// Styles are built through `google_fonts` so the font files are actually
/// fetched, registered and cached at runtime (previously they were referenced
/// by raw family names that never loaded, silently falling back to the
/// platform default font).
class AppTypography {
  AppTypography._();

  // ── Display — hero / splash headings (Space Grotesk) ──────────────
  // Tight negative tracking, heavy weight — the brand moment.
  static TextStyle display(double fontSize) => GoogleFonts.spaceGrotesk(
    fontSize: fontSize,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.045 * fontSize,
    height: 0.95,
    color: AppColors.text,
  );

  // ── Heading Large ────────────────────────────────────────────────
  static TextStyle get headingLg => GoogleFonts.spaceGrotesk(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.2,
    height: 1.15,
    color: AppColors.text,
  );

  // ── Heading Medium ───────────────────────────────────────────────
  static TextStyle get headingMd => GoogleFonts.spaceGrotesk(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.6,
    height: 1.2,
    color: AppColors.text,
  );

  // ── Heading Small ────────────────────────────────────────────────
  static TextStyle get headingSm => GoogleFonts.spaceGrotesk(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.3,
    height: 1.25,
    color: AppColors.text,
  );

  // ── Eyebrow — section labels ─────────────────────────────────────
  static TextStyle get eyebrow => GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 2.6,
    color: AppColors.mute,
  );

  // ── Body ─────────────────────────────────────────────────────────
  static TextStyle get body => GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.6,
    color: AppColors.text,
  );

  // ── Body Small ───────────────────────────────────────────────────
  static TextStyle get bodySm => GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.mute,
  );

  // ── Button label ─────────────────────────────────────────────────
  static TextStyle get button => GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.78,
    color: Colors.black,
  );

  // ── Caption ──────────────────────────────────────────────────────
  static TextStyle get caption => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.4,
    color: AppColors.mute,
  );

  // ── Label — field / section titles ───────────────────────────────
  static TextStyle get label => GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
    color: AppColors.text,
  );

  // ── Mono (prices, counts, code) — tabular figures keep columns aligned ──
  static TextStyle get mono => GoogleFonts.jetBrainsMono(
    fontSize: 15,
    fontWeight: FontWeight.w500,
    fontFeatures: const [FontFeature.tabularFigures()],
    color: AppColors.text,
  );

  // ── Price display — the money number, always tabular ─────────────
  static TextStyle get price => GoogleFonts.jetBrainsMono(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    fontFeatures: const [FontFeature.tabularFigures()],
    color: AppColors.accent,
  );

  /// Material [TextTheme] wired to Inter so non-styled Material widgets
  /// inherit the brand font instead of the platform default.
  static TextTheme textTheme(Color bodyColor, Color muteColor) {
    final base = GoogleFonts.interTextTheme();
    return base.apply(bodyColor: bodyColor).copyWith(
      displaySmall: GoogleFonts.spaceGrotesk(
        fontSize: 34,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.4,
        color: bodyColor,
      ),
      headlineMedium: headingLg,
      headlineSmall: headingMd,
      titleLarge: headingSm,
      labelLarge: button,
    );
  }
}
