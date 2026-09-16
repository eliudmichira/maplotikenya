import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import 'realtime_db_service.dart';

/// Singleton RTDB service provider
final realtimeDbServiceProvider = Provider<RealtimeDbService>((ref) {
  return RealtimeDbService();
});

/// Automatically manages presence when auth state changes.
/// Wire this up once in main.dart or AppShell by watching it.
final presenceManagerProvider = Provider<void>((ref) {
  final rtdb = ref.watch(realtimeDbServiceProvider);
  final authService = ref.watch(authServiceProvider);
  final authAsync = ref.watch(authStateProvider);

  final user = authAsync.asData?.value;
  final currentUid = user?.uid ?? authService.currentUser?.uid;

  if (currentUid != null) {
    // User signed in → go online
    rtdb.goOnline(currentUid);
  }

  // When provider is disposed (app closed, user signed out), go offline
  ref.onDispose(() {
    if (currentUid != null) {
      rtdb.goOffline(currentUid);
    }
  });
});

/// Stream of real-time RTDB events for the current user.
final rtdbEventsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final authAsync = ref.watch(authStateProvider);
  final rtdb = ref.watch(realtimeDbServiceProvider);

  return authAsync.when(
    data: (user) {
      if (user == null) {
        return Stream.value(<Map<String, dynamic>>[]);
      }
      return rtdb.eventsStream(user.uid);
    },
    loading: () => Stream.value(<Map<String, dynamic>>[]),
    error: (_, __) => Stream.value(<Map<String, dynamic>>[]),
  );
});
