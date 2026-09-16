import 'package:flutter_test/flutter_test.dart';
import 'package:maploti/features/listings/models/listing.dart';

void main() {
  group('Listing Model Tests', () {
    test('formattedPrice formats KES monthly rent correctly', () {
      final now = DateTime.now();
      final listing = Listing(
        id: '123',
        title: '2BR Apartment',
        description: 'Cozy home',
        price: 45000,
        currency: 'KES',
        propertyType: 'apartment',
        listingType: 'rent',
        location: const ListingLocation(county: 'Nairobi', area: 'Westlands'),
        ownerId: 'owner_1',
        createdAt: now,
        updatedAt: now,
      );

      expect(listing.formattedPrice, equals('KES 45,000/mo'));
    });

    test('formattedPrice formats KES sale price without monthly suffix', () {
      final now = DateTime.now();
      final listing = Listing(
        id: '124',
        title: '3BR House',
        description: 'Spacious home',
        price: 8500000,
        currency: 'KES',
        propertyType: 'house',
        listingType: 'sale',
        location: const ListingLocation(county: 'Nairobi', area: 'Karen'),
        ownerId: 'owner_1',
        createdAt: now,
        updatedAt: now,
      );

      expect(listing.formattedPrice, equals('KES 8,500,000'));
    });

    test('ListingLocation displayName formats correctly', () {
      const location = ListingLocation(county: 'Nairobi', area: 'Kilimani');
      expect(location.displayName, equals('Kilimani, Nairobi'));
    });

    test('copyWith produces updated instance preserving unchanged fields', () {
      final now = DateTime.now();
      final original = Listing(
        id: '1',
        title: 'Original Title',
        description: 'Original Desc',
        price: 30000,
        propertyType: 'apartment',
        listingType: 'rent',
        location: const ListingLocation(county: 'Nairobi', area: 'Ngara'),
        ownerId: 'owner_1',
        createdAt: now,
        updatedAt: now,
      );

      final updated = original.copyWith(price: 35000, title: 'Updated Title');

      expect(updated.id, equals('1'));
      expect(updated.price, equals(35000));
      expect(updated.title, equals('Updated Title'));
      expect(updated.location.area, equals('Ngara'));
    });
  });
}
