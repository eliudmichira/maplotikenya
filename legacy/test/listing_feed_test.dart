import 'package:flutter_test/flutter_test.dart';

import 'package:maploti/features/listings/models/listing.dart';
import 'package:maploti/features/listings/providers/listing_provider.dart';

Listing _listing({
  required String id,
  required String title,
  required String propertyType,
  required String county,
  required String area,
  required double price,
  required int bedrooms,
  List<String> amenities = const [],
}) {
  return Listing(
    id: id,
    title: title,
    description: '',
    price: price,
    propertyType: propertyType,
    listingType: 'rent',
    location: ListingLocation(county: county, area: area),
    bedrooms: bedrooms,
    bathrooms: 2,
    amenities: amenities,
    ownerId: 'o1',
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  group('ListingServerQuery (provider family key)', () {
    test('equal queries are == (same feed reused)', () {
      const a = ListingServerQuery(county: 'Nairobi', propertyType: 'apartment');
      const b = ListingServerQuery(county: 'Nairobi', propertyType: 'apartment');
      const c = ListingServerQuery(county: 'Mombasa', propertyType: 'apartment');
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
      expect(a == c, isFalse);
    });

    test('empty string means "any"', () {
      const any = ListingServerQuery();
      const rent = ListingServerQuery(listingType: 'rent');
      expect(any.listingType, '');
      expect(rent.listingType, 'rent');
    });
  });

  group('applyClientFilters', () {
    final listings = [
      _listing(
        id: '1',
        title: 'Sunny 2BR in Westlands',
        propertyType: 'apartment',
        county: 'Nairobi',
        area: 'Westlands',
        price: 45000,
        bedrooms: 2,
      ),
      _listing(
        id: '2',
        title: 'Modern Villa in Kiambu',
        propertyType: 'villa',
        county: 'Kiambu',
        area: 'Runda',
        price: 25000000,
        bedrooms: 5,
      ),
      _listing(
        id: '3',
        title: 'Studio near CBD',
        propertyType: 'apartment',
        county: 'Nairobi',
        area: 'Kilimani',
        price: 25000,
        bedrooms: 1,
      ),
    ];

    test('no filters returns everything', () {
      final out = applyClientFilters(listings, const ListingClientQuery());
      expect(out.length, 3);
    });

    test('text matches title, area, county or type', () {
      expect(applyClientFilters(listings, const ListingClientQuery(text: 'westlands')).length, 1);
      expect(applyClientFilters(listings, const ListingClientQuery(text: 'villa')).length, 1);
      expect(applyClientFilters(listings, const ListingClientQuery(text: 'kiambu')).length, 1);
      expect(applyClientFilters(listings, const ListingClientQuery(text: 'apartment')).length, 2);
      expect(applyClientFilters(listings, const ListingClientQuery(text: 'nope')).length, 0);
    });

    test('price range is inclusive', () {
      expect(
        applyClientFilters(listings, const ListingClientQuery(minPrice: 30000, maxPrice: 50000)).length,
        1,
      );
      expect(applyClientFilters(listings, const ListingClientQuery(maxPrice: 25000)).length, 1);
      expect(applyClientFilters(listings, const ListingClientQuery(minPrice: 25000000)).length, 1);
    });

    test('bedroom min/max bounds work', () {
      expect(applyClientFilters(listings, const ListingClientQuery(minBedrooms: 2)).length, 2);
      expect(
        applyClientFilters(listings, const ListingClientQuery(minBedrooms: 1, maxBedrooms: 1)).length,
        1,
      );
    });

    test('amenities require every one', () {
      final withAmenities = [
        _listing(
          id: '4',
          title: 'Gym flat',
          propertyType: 'apartment',
          county: 'Nairobi',
          area: 'Lavington',
          price: 40000,
          bedrooms: 2,
          amenities: ['gym', 'cctv'],
        ),
      ];
      expect(
        applyClientFilters(withAmenities, const ListingClientQuery(amenities: ['gym', 'cctv'])).length,
        1,
      );
      expect(
        applyClientFilters(withAmenities, const ListingClientQuery(amenities: ['gym', 'pool'])).length,
        0,
      );
    });
  });
}
