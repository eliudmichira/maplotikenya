import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:maploti/core/widgets/accent_button.dart';
import 'package:maploti/core/widgets/app_property_image.dart';
import 'package:maploti/features/listings/models/listing.dart';
import 'package:maploti/features/listings/widgets/property_card.dart';

Listing _listing() => Listing(
      id: 'test-1',
      title: 'Modern 2BR Apartment in Westlands',
      description: 'A lovely, well-lit apartment with parking.',
      price: 45000,
      propertyType: 'apartment',
      listingType: 'rent',
      location: const ListingLocation(county: 'Nairobi', area: 'Westlands'),
      bedrooms: 2,
      bathrooms: 2,
      images: const [], // no network images → pure placeholder path in tests
      ownerId: 'owner-1',
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime(2026, 1, 1),
    );

void main() {
  group('webSafeImageUrl', () {
    test('passes URLs through unchanged on native platforms', () {
      expect(
        webSafeImageUrl('https://assets.mbanyu.com/photo.webp'),
        'https://assets.mbanyu.com/photo.webp',
      );
      expect(
        webSafeImageUrl('https://example.com/img.png'),
        'https://example.com/img.png',
      );
      expect(webSafeImageUrl(''), '');
    });
  });

  group('PropertyCard', () {
    testWidgets('renders title, formatted price and location', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: PropertyCard(listing: _listing())),
        ),
      );

      expect(find.text('Modern 2BR Apartment in Westlands'), findsOneWidget);
      expect(find.text('KES 45,000/mo'), findsOneWidget);
      expect(find.text('Westlands, Nairobi'), findsOneWidget);
      expect(find.text('FOR RENT'), findsOneWidget);
    });

    testWidgets('shows placeholder icon when no images exist', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: PropertyCard(listing: _listing())),
        ),
      );

      expect(find.byIcon(Icons.home_outlined), findsWidgets);
    });
  });

  group('AccentButton', () {
    testWidgets('renders an uppercased label', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AccentButton(label: 'Post Property', onPressed: null),
          ),
        ),
      );

      expect(find.text('POST PROPERTY'), findsOneWidget);
    });
  });
}
