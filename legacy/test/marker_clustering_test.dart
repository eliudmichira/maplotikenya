import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:maploti/features/listings/models/listing.dart';
import 'package:maploti/features/listings/utils/marker_clustering.dart';

Listing _listing({
  required String id,
  required double lat,
  required double lng,
}) {
  return Listing(
    id: id,
    title: 'Listing $id',
    description: '',
    price: 45000,
    propertyType: 'apartment',
    listingType: 'rent',
    location: ListingLocation(
      county: 'Nairobi',
      area: 'Test',
      geoPoint: GeoPoint(lat, lng),
    ),
    bedrooms: 2,
    bathrooms: 2,
    ownerId: 'o1',
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  // Two points ~0.005° apart in longitude (≈550 m), same latitude so their
  // vertical cell is always identical. Coordinates are chosen to sit in the
  // middle of the same 72px grid cell at zoom 13.
  final a = _listing(id: 'a', lat: -1.29, lng: 36.81331);
  final b = _listing(id: 'b', lat: -1.29, lng: 36.81828);

  // Two points 0.01° apart (≈1.1 km) — guaranteed to land in different
  // cells once zoomed in (their screen gap exceeds the cell size).
  final c = _listing(id: 'c', lat: -1.29, lng: 36.8200);
  final d = _listing(id: 'd', lat: -1.29, lng: 36.8300);

  group('clusterListings', () {
    test('nearby points cluster together at low zoom', () {
      final clusters = clusterListings(listings: [a, b], zoom: 13);
      expect(clusters.length, 1);
      expect(clusters.single.listings.length, 2);
    });

    test('a single listing stays unclustered', () {
      final clusters = clusterListings(listings: [a], zoom: 13);
      expect(clusters.length, 1);
      expect(clusters.single.listings.length, 1);
    });

    test('zooming in splits a cluster apart', () {
      // At zoom 14 their screen gap (~116px) exceeds the 72px cell, so they
      // cannot share a cell regardless of boundary alignment.
      final at14 = clusterListings(listings: [c, d], zoom: 14);
      expect(at14.length, 2);
      expect(at14.every((cl) => cl.listings.length == 1), isTrue);
    });

    test('cluster centroid is the average of the group', () {
      final clusters = clusterListings(listings: [a, b], zoom: 13);
      final centroid = clusters.single.centroid;
      expect(centroid.latitude, closeTo(-1.29, 1e-6));
      expect(centroid.longitude, closeTo(36.815795, 1e-6));
    });

    test('far-apart cities never cluster', () {
      final nairobi = _listing(id: 'nrb', lat: -1.2921, lng: 36.8219);
      final mombasa = _listing(id: 'msa', lat: -4.0435, lng: 39.6626);
      final clusters =
          clusterListings(listings: [nairobi, mombasa], zoom: 8);
      expect(clusters.length, 2);
    });

    test('listings without a geoPoint are skipped', () {
      final noPin = Listing(
        id: 'nopin',
        title: 'No pin',
        description: '',
        price: 100,
        propertyType: 'apartment',
        listingType: 'rent',
        location: const ListingLocation(county: 'Nairobi', area: 'X'),
        ownerId: 'o1',
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      final clusters = clusterListings(listings: [a, noPin], zoom: 13);
      expect(clusters.length, 1);
      expect(clusters.single.listings.single.id, 'a');
    });

    test('custom cell size merges or splits points', () {
      // a & b are ~29px apart at zoom 13.
      final wide = clusterListings(listings: [a, b], zoom: 13, cellSize: 90);
      final narrow =
          clusterListings(listings: [a, b], zoom: 13, cellSize: 25);
      expect(wide.length, 1);
      expect(narrow.length, 2);
    });

    test('empty input yields no clusters', () {
      expect(clusterListings(listings: const [], zoom: 13), isEmpty);
    });
  });
}
