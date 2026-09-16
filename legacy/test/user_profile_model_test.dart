import 'package:flutter_test/flutter_test.dart';
import 'package:maploti/features/auth/models/user_profile.dart';

void main() {
  group('UserProfile Model Tests', () {
    test('role helpers return correct boolean values', () {
      final now = DateTime.now();
      final user = UserProfile(
        uid: '1',
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
        createdAt: now,
        lastSeen: now,
      );

      final landlord = UserProfile(
        uid: '2',
        displayName: 'John Smith',
        email: 'john@example.com',
        role: 'landlord',
        createdAt: now,
        lastSeen: now,
      );

      final admin = UserProfile(
        uid: '3',
        displayName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: now,
        lastSeen: now,
      );

      expect(user.isLandlord, isFalse);
      expect(user.isAdmin, isFalse);

      expect(landlord.isLandlord, isTrue);
      expect(landlord.isAdmin, isFalse);

      expect(admin.isLandlord, isTrue);
      expect(admin.isAdmin, isTrue);
    });

    test('copyWith updates properties correctly', () {
      final now = DateTime.now();
      final profile = UserProfile(
        uid: '100',
        displayName: 'Alice',
        email: 'alice@example.com',
        savedProperties: ['p1'],
        createdAt: now,
        lastSeen: now,
      );

      final updated = profile.copyWith(savedProperties: ['p1', 'p2']);

      expect(updated.uid, equals('100'));
      expect(updated.displayName, equals('Alice'));
      expect(updated.savedProperties, equals(['p1', 'p2']));
    });
  });
}
