import 'package:firebase_database/firebase_database.dart';

/// Service for all Realtime Database operations.
///
/// Architecture split:
///   - Firestore  → listings, user profiles, saves (structured, indexed queries)
///   - RTDB       → presence (online/offline), saved-listing fast sync, events
///
/// RTDB structure:
///   /presence/{uid}        → { online: bool, lastSeen: int (ms) }
///   /saves/{uid}/{listingId} → true / null (deleted)
///   /events/{uid}/...      → ephemeral real-time events (e.g. new inquiry)
class RealtimeDbService {
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  // ── Presence ─────────────────────────────────────────────────────────────────

  /// Call once after the user signs in to begin tracking online presence.
  /// Sets up an onDisconnect handler so Firebase marks the user offline
  /// automatically if the connection drops.
  Future<void> goOnline(String uid) async {
    final ref = _db.ref('presence/$uid');

    // Mark online now
    await ref.set({
      'online': true,
      'lastSeen': ServerValue.timestamp,
    });

    // Automatically mark offline when connection drops
    await ref.onDisconnect().set({
      'online': false,
      'lastSeen': ServerValue.timestamp,
    });
  }

  /// Call when the user explicitly signs out.
  Future<void> goOffline(String uid) async {
    await _db.ref('presence/$uid').set({
      'online': false,
      'lastSeen': ServerValue.timestamp,
    });
  }

  /// Stream another user's online presence.
  Stream<bool> presenceStream(String uid) {
    return _db
        .ref('presence/$uid/online')
        .onValue
        .map((event) => (event.snapshot.value as bool?) ?? false);
  }

  // ── Real-time events ─────────────────────────────────────────────────────────

  /// Push an ephemeral event to a user's feed (e.g. new inquiry on their listing).
  Future<void> pushEvent(String targetUid, Map<String, dynamic> event) async {
    await _db.ref('events/$targetUid').push().set({
      ...event,
      'timestamp': ServerValue.timestamp,
    });
  }

  /// Stream of real-time events for the current user.
  /// Each event map includes its own push key as `id` (needed to track
  /// read state and dedupe).
  Stream<List<Map<String, dynamic>>> eventsStream(String uid) {
    return _db
        .ref('events/$uid')
        .orderByChild('timestamp')
        .limitToLast(50)
        .onValue
        .map((event) {
      final data = event.snapshot.value;
      if (data == null) return <Map<String, dynamic>>[];
      if (data is Map) {
        final events = data.entries
            .where((e) => e.value is Map)
            .map((e) => {
                  'id': e.key.toString(),
                  ...Map<String, dynamic>.from(e.value as Map),
                })
            .toList()
          ..sort((a, b) {
            final ta = _eventTimeMs(a);
            final tb = _eventTimeMs(b);
            return tb.compareTo(ta); // newest first
          });
        return events;
      }
      return <Map<String, dynamic>>[];
    });
  }

  /// Best-effort timestamp (ms) from an event map (server timestamp arrives
  /// as an int of epoch ms after write; also handles strings/absent).
  int _eventTimeMs(Map<String, dynamic> event) {
    final t = event['timestamp'];
    if (t is int) return t;
    if (t is String) return DateTime.tryParse(t)?.millisecondsSinceEpoch ?? 0;
    return 0;
  }

  /// Clear all events for a user.
  Future<void> clearEvents(String uid) async {
    await _db.ref('events/$uid').remove();
  }
}
