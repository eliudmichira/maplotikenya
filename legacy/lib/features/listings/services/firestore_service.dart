import 'package:cloud_firestore/cloud_firestore.dart';

import '../../auth/models/user_profile.dart';
import '../models/listing.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ── Stream listings ──────────────────────────────────────────────────────────

  Stream<List<Listing>> streamActiveListings() {
    return _firestore
        .collection('listings')
        .where('status', isEqualTo: 'active')
        .snapshots()
        .map((snapshot) {
          final list = snapshot.docs
              .map((doc) => Listing.fromFirestore(doc))
              .toList();
          list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          return list;
        });
  }

  Stream<List<Listing>> streamFeaturedListings() {
    return _firestore
        .collection('listings')
        .where('status', isEqualTo: 'active')
        .where('featured', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
          final list = snapshot.docs
              .map((doc) => Listing.fromFirestore(doc))
              .toList();
          list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          return list;
        });
  }

  // ── Paginated feed ───────────────────────────────────────────────────────────
  //
  // Server-side, cursor-based pagination for the Home/Search grids. Only the
  // index-friendly equality filters (county / propertyType / listingType) are
  // pushed into the query; price / bedrooms / free-text are applied client-side
  // on the loaded pages (see ListingClientQuery in listing_provider.dart).
  // Each page fetches `limit + 1` docs so `hasMore` is known without an extra
  // round trip; the returned [lastDoc] is the cursor for the next page.
  Future<({List<Listing> items, DocumentSnapshot? lastDoc, bool hasMore})>
      paginateListings({
    required String county,
    required String propertyType,
    required String listingType,
    required DocumentSnapshot? startAfter,
    required int limit,
  }) async {
    Query query = _firestore
        .collection('listings')
        .where('status', isEqualTo: 'active');
    if (county.isNotEmpty) query = query.where('location.county', isEqualTo: county);
    if (propertyType.isNotEmpty) query = query.where('propertyType', isEqualTo: propertyType);
    if (listingType.isNotEmpty) query = query.where('listingType', isEqualTo: listingType);
    query = query.orderBy('createdAt', descending: true).limit(limit + 1);
    if (startAfter != null) query = query.startAfterDocument(startAfter);

    final snapshot = await query.get();
    final docs = snapshot.docs;
    final hasMore = docs.length > limit;
    final pageDocs = hasMore ? docs.sublist(0, limit) : docs;
    final items =
        pageDocs.map((doc) => Listing.fromFirestore(doc)).toList();
    return (
      items: items,
      lastDoc: pageDocs.isEmpty ? null : pageDocs.last,
      hasMore: hasMore,
    );
  }

  /// Fetches a batch of listings by their document IDs (used by the Saved
  /// screen so it does not have to download the entire collection).
  /// Doc reads are parallelized in chunks of 30.
  Future<List<Listing>> getListingsByIds(List<String> ids) async {
    final unique = ids.toSet().toList();
    final listings = <Listing>[];
    for (var i = 0; i < unique.length; i += 30) {
      final end = (i + 30 > unique.length) ? unique.length : i + 30;
      final chunk = unique.sublist(i, end);
      final snapshots = await Future.wait(
        chunk.map((id) => _firestore.collection('listings').doc(id).get()),
      );
      for (final snap in snapshots) {
        if (snap.exists) listings.add(Listing.fromFirestore(snap));
      }
    }
    return listings;
  }

  // ── Reserve a Firestore document ID ─────────────────────────────────────────
  //
  // Call this BEFORE uploading images so you can use the final document ID
  // as the Storage path prefix. The document is not written yet.
  String reserveListingId() {
    return _firestore.collection('listings').doc().id;
  }

  // ── Create listing ───────────────────────────────────────────────────────────
  //
  // Images MUST be uploaded before calling this.
  // listing.images should already contain the Firebase Storage download URLs.
  // listing.id should be set to the value returned by reserveListingId().
  //
  // Returns the Firestore document ID.
  Future<String> createListing(Listing listing) async {
    final now = DateTime.now();
    final docRef = listing.id.isNotEmpty
        ? _firestore.collection('listings').doc(listing.id)
        : _firestore.collection('listings').doc();

    final finalListing = listing.copyWith(
      id: docRef.id,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    );

    await docRef.set(finalListing.toFirestore());
    return docRef.id;
  }

  // ── Owner management ────────────────────────────────────────────────────────

  Stream<List<Listing>> streamMyListings(String ownerId) {
    // NOTE: sorting is done client-side (like streamActiveListings) so the
    // query stays a single-field filter and does not require a composite
    // Firestore index.
    return _firestore
        .collection('listings')
        .where('ownerId', isEqualTo: ownerId)
        .snapshots()
        .map((snapshot) {
      final list =
          snapshot.docs.map((doc) => Listing.fromFirestore(doc)).toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }

  Future<void> deleteListing(String listingId) async {
    await _firestore.collection('listings').doc(listingId).delete();
  }

  // ── Misc ─────────────────────────────────────────────────────────────────────

  Future<void> incrementViews(String listingId) async {
    await _firestore.collection('listings').doc(listingId).update({
      'views': FieldValue.increment(1),
    });
  }

  Future<Listing?> getListingById(String listingId) async {
    final doc = await _firestore.collection('listings').doc(listingId).get();
    if (!doc.exists) return null;
    return Listing.fromFirestore(doc);
  }

  Future<UserProfile?> getOwnerProfile(String ownerId) async {
    if (ownerId.isEmpty) return null;
    try {
      final doc = await _firestore.collection('users').doc(ownerId).get();
      if (!doc.exists) return null;
      return UserProfile.fromFirestore(doc);
    } catch (_) {
      return null;
    }
  }

  Future<void> updateUserProfile({
    required String uid,
    required String displayName,
    required String phone,
    String photoUrl = '',
  }) async {
    await _firestore.collection('users').doc(uid).set({
      'displayName': displayName,
      'phone': phone,
      if (photoUrl.isNotEmpty) 'photoUrl': photoUrl,
      'lastSeen': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
