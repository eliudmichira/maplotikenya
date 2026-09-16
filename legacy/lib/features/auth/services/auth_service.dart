import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user_profile.dart';
import '../../../core/services/realtime_db_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ── Auth state ──────────────────────────────────────────────────────────────

  Stream<User?> get authStateChanges => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  // ── User profile stream ─────────────────────────────────────────────────────

  Stream<UserProfile?> streamUserProfile(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .snapshots()
        .map((doc) => doc.exists ? UserProfile.fromFirestore(doc) : null);
  }

  // ── Email / Password sign-in ────────────────────────────────────────────────

  Future<UserCredential> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      if (credential.user != null) {
        await _updateLastSeen(credential.user!.uid);
      }
      return credential;
    } on FirebaseAuthException catch (e) {
      throw _friendlyError(e);
    }
  }

  // ── Email / Password sign-up ────────────────────────────────────────────────

  Future<UserCredential> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        await credential.user!.updateDisplayName(displayName);

        final profile = UserProfile(
          uid: credential.user!.uid,
          displayName: displayName,
          email: email,
          createdAt: DateTime.now(),
          lastSeen: DateTime.now(),
        );

        await _firestore
            .collection('users')
            .doc(credential.user!.uid)
            .set(profile.toFirestore());
      }

      return credential;
    } on FirebaseAuthException catch (e) {
      throw _friendlyError(e);
    }
  }

  // ── Google Sign-In ──────────────────────────────────────────────────────────

  // Web Client ID from google-services.json (oauth_client type 3)
  static const _webClientId =
      '689776477151-donequkm302oguk2vktoo4undmrmh2ok.apps.googleusercontent.com';

  bool _isGoogleSignInInitialized = false;

  Future<UserCredential?> signInWithGoogle() async {
    try {
      UserCredential userCredential;

      if (kIsWeb) {
        final googleProvider = GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
        userCredential = await _auth.signInWithPopup(googleProvider);
      } else {
        if (!_isGoogleSignInInitialized) {
          await GoogleSignIn.instance.initialize(
            serverClientId: _webClientId,
          );
          _isGoogleSignInInitialized = true;
        }

        final googleUser = await GoogleSignIn.instance.authenticate();
        final googleAuth = googleUser.authentication;

        if (googleAuth.idToken == null) {
          throw 'Google Sign-In failed: could not retrieve ID token. Ensure SHA-1 fingerprint is registered in Firebase Console.';
        }

        final credential = GoogleAuthProvider.credential(
          idToken: googleAuth.idToken,
        );

        userCredential = await _auth.signInWithCredential(credential);
      }

      // Create or merge Firestore profile
      if (userCredential.user != null) {
        final user = userCredential.user!;
        final docRef = _firestore.collection('users').doc(user.uid);
        final existing = await docRef.get();

        if (!existing.exists) {
          final profile = UserProfile(
            uid: user.uid,
            displayName: user.displayName ?? 'User',
            email: user.email ?? '',
            photoUrl: user.photoURL ?? '',
            createdAt: DateTime.now(),
            lastSeen: DateTime.now(),
          );
          await docRef.set(profile.toFirestore());
        } else {
          await _updateLastSeen(user.uid);
        }
      }

      return userCredential;
    } on FirebaseAuthException catch (e) {
      throw _friendlyError(e);
    } catch (e) {
      final msg = e.toString().toLowerCase();
      if (msg.contains('cancel') || msg.contains('abort') || msg.contains('closed') || msg.contains('sign_in_canceled')) {
        return null;
      }
      rethrow;
    }
  }


  // ── Password reset ──────────────────────────────────────────────────────────

  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      throw _friendlyError(e);
    }
  }

  // ── Sign out ────────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    // Mark offline in RTDB before clearing auth session
    final uid = _auth.currentUser?.uid;
    if (uid != null) {
      try {
        await RealtimeDbService().goOffline(uid);
      } catch (_) {}
    }
    try {
      // Sign out from GoogleSignIn so account picker shows next time
      await GoogleSignIn.instance.signOut();
    } catch (_) {}
    try {
      await _auth.signOut();
    } catch (_) {}
  }


  // ── Toggle favourite ────────────────────────────────────────────────────────

  Future<void> toggleFavoriteProperty(String listingId) async {
    final user = currentUser;
    if (user == null) return;

    final userDoc = _firestore.collection('users').doc(user.uid);
    final snapshot = await userDoc.get();

    if (!snapshot.exists) return;

    final data = snapshot.data();
    // Source of truth is `savedProperties`; fall back to the legacy
    // `savedListings` key for docs written by older app versions.
    final favorites =
        List<String>.from(data?['savedProperties'] ?? data?['savedListings'] ?? []);

    if (favorites.contains(listingId)) {
      favorites.remove(listingId);
    } else {
      favorites.add(listingId);
    }

    await userDoc.update({
      'savedProperties': favorites,
      'lastSeen': FieldValue.serverTimestamp(),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  Future<void> _updateLastSeen(String uid) async {
    try {
      await _firestore.collection('users').doc(uid).update({
        'lastSeen': FieldValue.serverTimestamp(),
      });
    } catch (_) {
      // Document might not exist yet
    }
  }

  String _friendlyError(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No user found with this email address.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'email-already-in-use':
        return 'An account already exists with this email.';
      case 'weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'invalid-email':
        return 'Invalid email address format.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return e.message ?? 'An authentication error occurred.';
    }
  }
}
