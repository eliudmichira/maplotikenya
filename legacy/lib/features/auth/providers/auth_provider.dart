import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_profile.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final authStateProvider = StreamProvider<User?>((ref) {
  return ref.watch(authServiceProvider).authStateChanges;
});

final userProfileProvider = StreamProvider<UserProfile?>((ref) {
  final authState = ref.watch(authStateProvider);
  final user = authState.asData?.value;
  if (user == null) {
    return Stream.value(null);
  }
  return ref.watch(authServiceProvider).streamUserProfile(user.uid);
});

/// Live set of listing IDs the current user has saved (empty when signed out).
/// Single source of truth is the Firestore `savedProperties` array on the
/// user profile doc.
final favoriteIdsProvider = StreamProvider<Set<String>>((ref) {
  final profileAsync = ref.watch(userProfileProvider);
  return profileAsync.when(
    data: (profile) =>
        Stream.value((profile?.savedProperties ?? const <String>[]).toSet()),
    loading: () => Stream.value(<String>{}),
    error: (_, __) => Stream.value(<String>{}),
  );
});
