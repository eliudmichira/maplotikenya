import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'features/listings/screens/home_screen.dart';
import 'features/listings/screens/map_screen.dart';
import 'features/listings/screens/saved_listings_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'features/search/screens/search_screen.dart';
import 'firebase_options.dart';
import 'core/services/realtime_db_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Kick off font loading immediately so it overlaps with Firebase init.
  final fontsReady = _precacheBrandFonts();

  // On Android the Google Services plugin auto-creates the default Firebase
  // app natively (via FirebaseInitProvider), so initializing again would
  // throw [core/duplicate-app]. Only initialize when none exists yet.
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  // Ensure every weight of the three brand families is registered before the
  // first frame (raw `fontFamily: 'Inter'` styles rely on this too).
  await fontsReady;

  if (!kIsWeb) {
    // Immersive overlay style
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.bg,
      systemNavigationBarIconBrightness: Brightness.light,
    ));

    // Lock to portrait on mobile
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  runApp(const ProviderScope(child: MaplotiApp()));
}

/// Fetches and registers the exact weights the design system uses, so text
/// renders in Inter / Space Grotesk / JetBrains Mono instead of silently
/// falling back to the platform default font.
Future<void> _precacheBrandFonts() async {
  for (final w in const [
    FontWeight.w400,
    FontWeight.w500,
    FontWeight.w600,
    FontWeight.w700,
    FontWeight.w800,
    FontWeight.w900,
  ]) {
    GoogleFonts.inter(fontWeight: w);
    GoogleFonts.spaceGrotesk(fontWeight: w);
    GoogleFonts.jetBrainsMono(fontWeight: w);
  }
  await GoogleFonts.pendingFonts();
}

class MaplotiApp extends ConsumerWidget {
  const MaplotiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'Maploti',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      home: const AppShell(),
    );
  }
}

/// Main app shell with 5-tab bottom navigation.
class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _currentIndex = 0;

  final _screens = const [
    HomeScreen(),
    SearchScreen(),
    MapScreen(),
    SavedListingsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    // Activate presence manager (watches auth state, sets online/offline in RTDB)
    ref.watch(presenceManagerProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: isDark ? AppColors.border : AppColors.lightBorder),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            HapticFeedback.selectionClick();
            setState(() => _currentIndex = index);
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search),
              activeIcon: Icon(Icons.search),
              label: 'Search',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              activeIcon: Icon(Icons.map),
              label: 'Map',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.favorite_outline),
              activeIcon: Icon(Icons.favorite),
              label: 'Saved',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
