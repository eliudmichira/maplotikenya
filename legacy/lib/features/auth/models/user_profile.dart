import 'package:cloud_firestore/cloud_firestore.dart';

/// Data model for a user profile.
class UserProfile {
  final String uid;
  final String displayName;
  final String email;
  final String phone;
  final String photoUrl;
  final List<String> savedProperties;
  final String role; // user, landlord, agent, admin
  final DateTime createdAt;
  final DateTime lastSeen;

  const UserProfile({
    required this.uid,
    required this.displayName,
    required this.email,
    this.phone = '',
    this.photoUrl = '',
    this.savedProperties = const [],
    this.role = 'user',
    required this.createdAt,
    required this.lastSeen,
  });

  factory UserProfile.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserProfile(
      uid: doc.id,
      displayName: data['displayName'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      photoUrl: data['photoUrl'] ?? '',
      savedProperties: List<String>.from(data['savedProperties'] ?? []),
      role: data['role'] ?? 'user',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      lastSeen: (data['lastSeen'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'displayName': displayName,
      'email': email,
      'phone': phone,
      'photoUrl': photoUrl,
      'savedProperties': savedProperties,
      'role': role,
      'createdAt': Timestamp.fromDate(createdAt),
      'lastSeen': Timestamp.fromDate(lastSeen),
    };
  }

  bool get isLandlord => role == 'landlord' || role == 'agent' || role == 'admin';
  bool get isAdmin => role == 'admin';

  UserProfile copyWith({
    String? uid,
    String? displayName,
    String? email,
    String? phone,
    String? photoUrl,
    List<String>? savedProperties,
    String? role,
    DateTime? createdAt,
    DateTime? lastSeen,
  }) {
    return UserProfile(
      uid: uid ?? this.uid,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      photoUrl: photoUrl ?? this.photoUrl,
      savedProperties: savedProperties ?? this.savedProperties,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      lastSeen: lastSeen ?? this.lastSeen,
    );
  }
}
