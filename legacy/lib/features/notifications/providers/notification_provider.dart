import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/realtime_db_provider.dart';
import '../models/notification_item.dart';

/// Tracks which event IDs the user has marked as read (local read state).
class ReadNotificationsNotifier extends StateNotifier<Set<String>> {
  ReadNotificationsNotifier() : super(const <String>{});

  void markAsRead(String id) {
    if (state.contains(id)) return;
    state = {...state, id};
  }

  void markAllAsRead(Iterable<String> ids) {
    state = {...state, ...ids};
  }

  void clearAll() => state = const <String>{};
}

final readNotificationsProvider =
    StateNotifierProvider<ReadNotificationsNotifier, Set<String>>(
        (ref) => ReadNotificationsNotifier());

/// Real-time notifications for the current user, driven by Realtime Database
/// events (see RealtimeDbService.pushEvent / eventsStream). Emits an empty
/// list while signed out or before the first event arrives.
final notificationsProvider = StreamProvider<List<NotificationItem>>((ref) {
  final eventsAsync = ref.watch(rtdbEventsProvider);
  final readIds = ref.watch(readNotificationsProvider);
  return eventsAsync.when(
    data: (events) => Stream.value(
      events.map((e) {
        final id = e['id']?.toString() ?? '';
        final type = e['type']?.toString() ?? '';
        return NotificationItem(
          id: id,
          title: _titleFor(type, e['listingTitle']?.toString()),
          message: e['message']?.toString() ?? '',
          timestamp: _parseTimestamp(e['timestamp']),
          category: _categoryFor(type),
          isRead: readIds.contains(id),
          listingId: e['listingId']?.toString(),
        );
      }).toList(),
    ),
    loading: () => Stream.value(const <NotificationItem>[]),
    error: (_, __) => Stream.value(const <NotificationItem>[]),
  );
});

/// Number of notifications not yet marked as read (drives the app-bar badge).
final unreadNotificationCountProvider = Provider<int>((ref) {
  final list = ref.watch(notificationsProvider).asData?.value ?? const [];
  return list.where((n) => !n.isRead).length;
});

// ── Mapping helpers ─────────────────────────────────────────────────────────

NotificationCategory _categoryFor(String type) {
  switch (type) {
    case 'listing_inquiry':
      return NotificationCategory.inquiry;
    case 'property_alert':
    case 'price_drop':
      return NotificationCategory.alert;
    case 'new_listing':
      return NotificationCategory.property;
    default:
      return NotificationCategory.system;
  }
}

String _titleFor(String type, String? listingTitle) {
  switch (type) {
    case 'listing_inquiry':
      return 'New Inquiry 📞';
    case 'price_drop':
      return 'Price Drop Alert';
    case 'new_listing':
      return listingTitle?.isNotEmpty == true
          ? 'New Listing: $listingTitle'
          : 'New Listing';
    default:
      return 'Notification';
  }
}

DateTime _parseTimestamp(dynamic t) {
  if (t is int) return DateTime.fromMillisecondsSinceEpoch(t);
  if (t is String) {
    final parsed = DateTime.tryParse(t);
    if (parsed != null) return parsed;
  }
  return DateTime.now();
}
