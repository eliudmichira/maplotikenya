import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:maploti/features/listings/models/listing.dart';
import 'package:maploti/features/listings/utils/map_filters.dart';

Listing _listing(String id, double price) {
  return Listing(
    id: id,
    title: 'Listing $id',
    description: '',
    price: price,
    propertyType: 'apartment',
    listingType: 'rent',
    location: ListingLocation(
      county: 'Nairobi',
      area: 'Test',
      geoPoint: GeoPoint(-1.29, 36.82),
    ),
    bedrooms: 2,
    bathrooms: 2,
    ownerId: 'o1',
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  final listings = [
    _listing('a', 15000),  // cheapest
    _listing('b', 45000),
    _listing('c', 80000),  // priciest
    _listing('d', 45000),  // duplicate price
  ];

  group('applyMapPriceFilter', () {
    test('no filters returns the same set unchanged', () {
      final out = applyMapPriceFilter(listings);
      expect(out.length, 4);
      expect(out.map((l) => l.id).toSet(),
          {'a', 'b', 'c', 'd'});
    });

    test('minPrice keeps listings at or above the bound', () {
      final out = applyMapPriceFilter(listings, minPrice: 45000);
      expect(out.map((l) => l.id).toSet(), {'b', 'c', 'd'});
    });

    test('maxPrice keeps listings at or below the bound', () {
      final out = applyMapPriceFilter(listings, maxPrice: 45000);
      expect(out.map((l) => l.id).toSet(), {'a', 'b', 'd'});
    });

    test('both bounds select the inclusive range', () {
      final out = applyMapPriceFilter(listings, minPrice: 20000, maxPrice: 80000);
      expect(out.map((l) => l.id).toSet(), {'b', 'c', 'd'});
    });

    test('lowToHigh sorts ascending by price', () {
      final out = applyMapPriceFilter(listings, sort: PriceSort.lowToHigh);
      expect(out.map((l) => l.id).toList(), ['a', 'b', 'd', 'c']);
    });

    test('highToLow sorts descending by price', () {
      final out = applyMapPriceFilter(listings, sort: PriceSort.highToLow);
      expect(out.map((l) => l.id).toList(), ['c', 'b', 'd', 'a']);
    });

    test('range and sort compose', () {
      final out = applyMapPriceFilter(
        listings,
        minPrice: 20000,
        sort: PriceSort.highToLow,
      );
      expect(out.map((l) => l.id).toList(), ['c', 'b', 'd']);
    });

    test('does not mutate the input list when sorting', () {
      final before = listings.map((l) => l.id).toList();
      applyMapPriceFilter(listings, sort: PriceSort.lowToHigh);
      expect(listings.map((l) => l.id).toList(), before);
    });

    test('empty input stays empty', () {
      expect(applyMapPriceFilter(const [], minPrice: 100), isEmpty);
    });
  });

  group('hasActivePriceFilter', () {
    test('false when nothing is set', () {
      expect(hasActivePriceFilter(), isFalse);
    });

    test('true when a bound is set', () {
      expect(hasActivePriceFilter(minPrice: 100), isTrue);
      expect(hasActivePriceFilter(maxPrice: 100), isTrue);
    });

    test('true when a sort is set', () {
      expect(hasActivePriceFilter(sort: PriceSort.lowToHigh), isTrue);
      expect(hasActivePriceFilter(sort: PriceSort.highToLow), isTrue);
    });

    test('false when only nulls and none are passed', () {
      expect(
        hasActivePriceFilter(minPrice: null, maxPrice: null, sort: PriceSort.none),
        isFalse,
      );
    });
  });
}
