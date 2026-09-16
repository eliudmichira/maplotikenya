import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/models/user_profile.dart';
import '../models/listing.dart';
import '../services/firestore_service.dart';

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

final activeListingsProvider = StreamProvider<List<Listing>>((ref) {
  return ref.watch(firestoreServiceProvider).streamActiveListings();
});

final featuredListingsProvider = StreamProvider<List<Listing>>((ref) {
  return ref.watch(firestoreServiceProvider).streamFeaturedListings();
});

/// Listings posted by a specific owner (used by the My Listings screen).
final myListingsProvider =
    StreamProvider.family<List<Listing>, String>((ref, ownerId) {
  return ref.watch(firestoreServiceProvider).streamMyListings(ownerId);
});

/// Owner/agent profile for a listing (`users/{ownerId}`), cached by the
/// provider family — a grid of cards that share one owner (e.g. all the
/// scraped listings) only triggers a single Firestore read.
final ownerProfileProvider =
    FutureProvider.family<UserProfile?, String>((ref, ownerId) {
  return ref.watch(firestoreServiceProvider).getOwnerProfile(ownerId);
});

// ── Infinite-scroll feed (Home & Search grids) ───────────────────────────────
//
// The feed paginates SERVER-side (cursor-based) using only the index-friendly
// equality filters. Free-text, price, and bedroom filters are applied
// CLIENT-side on the loaded pages so they never trigger a Firestore refetch.

/// Server-side part of a feed: drives the Firestore query and is used as the
/// provider family key (so typing text never refetches — text is client-side).
class ListingServerQuery {
  final String county; // '' = any
  final String propertyType; // '' = any
  final String listingType; // '' = any

  const ListingServerQuery({
    this.county = '',
    this.propertyType = '',
    this.listingType = '',
  });

  @override
  bool operator ==(Object other) =>
      other is ListingServerQuery &&
      other.county == county &&
      other.propertyType == propertyType &&
      other.listingType == listingType;

  @override
  int get hashCode => Object.hash(county, propertyType, listingType);
}

/// Client-side part of a feed: applied to the loaded pages in the widget.
class ListingClientQuery {
  final String text; // lowercased free-text
  final double? minPrice;
  final double? maxPrice;
  final int? minBedrooms;
  final int? maxBedrooms;
  final List<String> amenities;

  const ListingClientQuery({
    this.text = '',
    this.minPrice,
    this.maxPrice,
    this.minBedrooms,
    this.maxBedrooms,
    this.amenities = const [],
  });
}

/// Pure client-side filtering over already-loaded feed items.
List<Listing> applyClientFilters(List<Listing> items, ListingClientQuery q) {
  return items.where((l) {
    if (q.text.isNotEmpty) {
      final t = q.text.toLowerCase();
      final matches =
          l.title.toLowerCase().contains(t) ||
          l.location.county.toLowerCase().contains(t) ||
          l.location.area.toLowerCase().contains(t) ||
          l.location.displayName.toLowerCase().contains(t) ||
          l.propertyType.toLowerCase().contains(t);
      if (!matches) return false;
    }
    if (q.minPrice != null && l.price < q.minPrice!) return false;
    if (q.maxPrice != null && l.price > q.maxPrice!) return false;
    if (q.minBedrooms != null && l.bedrooms < q.minBedrooms!) return false;
    if (q.maxBedrooms != null && l.bedrooms > q.maxBedrooms!) return false;
    if (q.amenities.isNotEmpty &&
        !q.amenities.every((a) => l.amenities.contains(a))) {
      return false;
    }
    return true;
  }).toList();
}

class ListingFeedState {
  final List<Listing> items;
  final bool initialLoading;
  final bool loadingMore;
  final bool hasMore;
  final String? error;

  const ListingFeedState({
    this.items = const [],
    this.initialLoading = true,
    this.loadingMore = false,
    this.hasMore = true,
    this.error,
  });

  ListingFeedState copyWith({
    List<Listing>? items,
    bool? initialLoading,
    bool? loadingMore,
    bool? hasMore,
    String? error,
  }) {
    return ListingFeedState(
      items: items ?? this.items,
      initialLoading: initialLoading ?? this.initialLoading,
      loadingMore: loadingMore ?? this.loadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: error ?? this.error,
    );
  }
}

class ListingFeedNotifier extends StateNotifier<ListingFeedState> {
  ListingFeedNotifier(this._ref, this._query)
      : super(const ListingFeedState());

  static const int pageSize = 24;

  final Ref _ref;
  final ListingServerQuery _query;
  DocumentSnapshot? _lastDoc;
  bool _busy = false;

  Future<void> refresh() async {
    if (!mounted) return; // may be disposed before the first-frame microtask
    _busy = true;
    // Only show the full shimmer when there is nothing on screen yet;
    // pull-to-refresh keeps the loaded grid visible.
    state = state.copyWith(initialLoading: state.items.isEmpty, error: null);
    try {
      final page = await _ref.read(firestoreServiceProvider).paginateListings(
            county: _query.county,
            propertyType: _query.propertyType,
            listingType: _query.listingType,
            startAfter: null,
            limit: pageSize,
          );
      if (!mounted) return;
      _lastDoc = page.lastDoc;
      state = state.copyWith(
        items: page.items,
        initialLoading: false,
        hasMore: page.hasMore,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(initialLoading: false, error: _friendly(e));
    } finally {
      _busy = false;
    }
  }

  Future<void> loadMore() async {
    if (!mounted || _busy || state.initialLoading || !state.hasMore) return;
    _busy = true;
    state = state.copyWith(loadingMore: true);
    try {
      final page = await _ref.read(firestoreServiceProvider).paginateListings(
            county: _query.county,
            propertyType: _query.propertyType,
            listingType: _query.listingType,
            startAfter: _lastDoc,
            limit: pageSize,
          );
      if (!mounted) return;
      _lastDoc = page.lastDoc;
      final merged = [...state.items];
      for (final l in page.items) {
        if (!merged.any((m) => m.id == l.id)) merged.add(l);
      }
      state = state.copyWith(
        items: merged,
        loadingMore: false,
        hasMore: page.hasMore,
        error: null,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(loadingMore: false, error: _friendly(e));
    } finally {
      _busy = false;
    }
  }

  String _friendly(Object e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('index')) {
      return 'Firestore is missing a required index — deploy firestore.indexes.json to enable filters.';
    }
    if (msg.contains('permission') || msg.contains('denied')) {
      return 'You do not have permission to load these listings.';
    }
    return 'Unable to load listings. Check your connection and try again.';
  }
}

/// Family keyed by the server-side query. Each member owns its cursor and
/// accumulated pages; the first page loads automatically. autoDispose keeps
/// old filter-combination feeds from accumulating during a session.
final listingFeedProvider = StateNotifierProvider.autoDispose
    .family<ListingFeedNotifier, ListingFeedState, ListingServerQuery>(
        (ref, query) {
  final notifier = ListingFeedNotifier(ref, query);
  Future.microtask(notifier.refresh);
  return notifier;
});

/// Saved listings fetched by ID (so the Saved tab never downloads the whole
/// collection). Keyed by the sorted, comma-joined ID string so the family
/// member survives widget rebuilds (a raw List would compare by identity and
/// refetch on every profile emission).
final savedListingsProvider =
    FutureProvider.family<List<Listing>, String>((ref, joinedIds) {
  final ids =
      joinedIds.isEmpty ? <String>[] : joinedIds.split(',').toList();
  return ref.watch(firestoreServiceProvider).getListingsByIds(ids);
});
