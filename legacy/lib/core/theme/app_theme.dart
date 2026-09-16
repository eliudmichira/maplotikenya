import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_typography.dart';

/// Unified theme system supporting Dark and Light modes.
class AppTheme {
  AppTheme._();

  // ── Dark Theme ─────────────────────────────────────────────────────────────
  static ThemeData get dark {
    return ThemeData(
      brightness: Brightness.dark,
      useMaterial3: true,

      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
          TargetPlatform.macOS: ZoomPageTransitionsBuilder(),
          TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.fuchsia: FadeForwardsPageTransitionsBuilder(),
        },
      ),

      scaffoldBackgroundColor: AppColors.bg,
      colorScheme: const ColorScheme.dark(
        surface: AppColors.bg,
        primary: AppColors.accent,
        onPrimary: Colors.black,
        secondary: AppColors.accent2,
        onSecondary: Colors.black,
        error: AppColors.error,
        onError: Colors.white,
        onSurface: AppColors.text,
        outline: AppColors.border,
      ),

      textTheme: AppTypography.textTheme(AppColors.text, AppColors.mute),

      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.headingSm,
        iconTheme: const IconThemeData(color: AppColors.text, size: 22),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          systemNavigationBarColor: AppColors.bg,
        ),
      ),

      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.bg,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.mute,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        showUnselectedLabels: true,
        selectedLabelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),

      cardTheme: CardThemeData(
        color: AppColors.bgElev,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.black,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          textStyle: AppTypography.button,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.text,
          side: const BorderSide(color: AppColors.border),
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          textStyle: AppTypography.button.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.text,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accent,
          textStyle: AppTypography.bodySm.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgSoft,
        hintStyle: AppTypography.body.copyWith(color: AppColors.mute),
        labelStyle: AppTypography.caption,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.error),
        ),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 0,
      ),

      chipTheme: ChipThemeData(
        backgroundColor: AppColors.bgSoft,
        labelStyle: AppTypography.caption.copyWith(color: AppColors.text),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.bgSoft,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        showDragHandle: true,
        dragHandleColor: AppColors.border,
      ),

      textSelectionTheme: TextSelectionThemeData(
        cursorColor: AppColors.accent,
        selectionColor: AppColors.accent.withValues(alpha: 0.3),
        selectionHandleColor: AppColors.accent,
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.bgElev,
        contentTextStyle: AppTypography.bodySm.copyWith(color: AppColors.text),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: AppColors.border),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ── Light Theme ────────────────────────────────────────────────────────────
  static ThemeData get light {
    return ThemeData(
      brightness: Brightness.light,
      useMaterial3: true,

      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
          TargetPlatform.macOS: ZoomPageTransitionsBuilder(),
          TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.fuchsia: FadeForwardsPageTransitionsBuilder(),
        },
      ),

      scaffoldBackgroundColor: AppColors.lightBg,
      // Lime carries through both modes — the brand never switches identity.
      colorScheme: const ColorScheme.light(
        surface: AppColors.lightBg,
        primary: AppColors.accentDark,
        onPrimary: Colors.black,
        secondary: AppColors.accent2,
        onSecondary: Colors.white,
        error: AppColors.error,
        onError: Colors.white,
        onSurface: AppColors.lightText,
        outline: AppColors.lightBorder,
      ),

      textTheme: AppTypography.textTheme(AppColors.lightText, AppColors.lightMute),

      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.lightText,
        ),
        iconTheme: const IconThemeData(color: AppColors.lightText, size: 22),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          systemNavigationBarColor: AppColors.lightBg,
        ),
      ),

      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.lightBgElev,
        selectedItemColor: AppColors.lightText,
        unselectedItemColor: AppColors.lightMute,
        type: BottomNavigationBarType.fixed,
        elevation: 4,
        showUnselectedLabels: true,
        selectedLabelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),

      cardTheme: CardThemeData(
        color: AppColors.lightBgElev,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.lightBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accentDark,
          foregroundColor: Colors.black,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          textStyle: AppTypography.button,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.lightText,
          side: const BorderSide(color: AppColors.lightBorder),
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          textStyle: AppTypography.button.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.lightText,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.lightText,
          textStyle: AppTypography.bodySm.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.lightBgSoft,
        hintStyle: AppTypography.body.copyWith(color: AppColors.lightMute),
        labelStyle: AppTypography.caption.copyWith(color: AppColors.lightMute),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.lightText, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.error),
        ),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.lightBorder,
        thickness: 1,
        space: 0,
      ),

      chipTheme: ChipThemeData(
        backgroundColor: AppColors.lightBgSoft,
        labelStyle: AppTypography.caption.copyWith(color: AppColors.lightText),
        side: const BorderSide(color: AppColors.lightBorder),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.lightBgElev,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        showDragHandle: true,
        dragHandleColor: AppColors.lightBorder,
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.lightText,
        contentTextStyle: AppTypography.bodySm.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
