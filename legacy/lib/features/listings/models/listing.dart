import 'package:cloud_firestore/cloud_firestore.dart';

/// Data model for a property listing.
class Listing {
  final String id;
  final String title;
  final String description;
  final double price;
  final String currency;
  final String propertyType; // apartment, plot, house
  final String listingType;  // rent, sale
  final String status;       // active, rented, sold, draft
  final ListingLocation location;
  final int bedrooms;
  final int bathrooms;
  final int parking;
  final double sizeSqm;
  final List<String> amenities;
  final List<String> images;
  final String ownerId;
  final bool featured;
  final bool verified;
  final int views;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Listing({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    this.currency = 'KES',
    required this.propertyType,
    required this.listingType,
    this.status = 'active',
    required this.location,
    this.bedrooms = 0,
    this.bathrooms = 0,
    this.parking = 0,
    this.sizeSqm = 0,
    this.amenities = const [],
    this.images = const [],
    required this.ownerId,
    this.featured = false,
    this.verified = false,
    this.views = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create from Firestore document snapshot.
  static DateTime _parseDateTime(dynamic val) {
    if (val is Timestamp) return val.toDate();
    if (val is String) {
      return DateTime.tryParse(val) ?? DateTime.now();
    }
    if (val is int) {
      return DateTime.fromMillisecondsSinceEpoch(val);
    }
    return DateTime.now();
  }

  /// Create from Firestore document snapshot.
  factory Listing.fromFirestore(DocumentSnapshot doc) {
    final data = (doc.data() as Map<String, dynamic>?) ?? {};
    
    // Normalize listing type (handle 'for_sale' -> 'sale', 'for_rent' -> 'rent')
    String rawListingType = (data['listingType'] ?? 'rent').toString().toLowerCase();
    if (rawListingType.contains('sale')) {
      rawListingType = 'sale';
    } else {
      rawListingType = 'rent';
    }

    return Listing(
      id: doc.id,
      title: data['title']?.toString() ?? '',
      description: data['description']?.toString() ?? '',
      price: (data['price'] is num) ? (data['price'] as num).toDouble() : 0.0,
      currency: data['currency']?.toString() ?? 'KES',
      propertyType: data['propertyType']?.toString() ?? 'apartment',
      listingType: rawListingType,
      status: data['status']?.toString() ?? 'active',
      location: ListingLocation.fromMap(
        data['location'] as Map<String, dynamic>? ?? {},
      ),
      bedrooms: (data['bedrooms'] is num) ? (data['bedrooms'] as num).toInt() : int.tryParse(data['bedrooms']?.toString() ?? '0') ?? 0,
      bathrooms: (data['bathrooms'] is num) ? (data['bathrooms'] as num).toInt() : int.tryParse(data['bathrooms']?.toString() ?? '0') ?? 0,
      parking: (data['parking'] is num) ? (data['parking'] as num).toInt() : int.tryParse(data['parking']?.toString() ?? '0') ?? 0,
      sizeSqm: (data['sizeSqm'] is num) ? (data['sizeSqm'] as num).toDouble() : double.tryParse(data['sizeSqm']?.toString() ?? '0') ?? 0.0,
      amenities: List<String>.from(data['amenities'] ?? []),
      images: List<String>.from(data['images'] ?? []),
      ownerId: data['ownerId']?.toString() ?? '',
      featured: data['featured'] == true || data['featured']?.toString() == 'true',
      // Trust heuristic: a stored flag, or titles marketed as verified.
      verified: data['verified'] == true ||
          data['verified']?.toString() == 'true' ||
          (data['title']?.toString().toLowerCase().contains('verified') ?? false),
      views: (data['views'] is num) ? (data['views'] as num).toInt() : int.tryParse(data['views']?.toString() ?? '0') ?? 0,
      createdAt: _parseDateTime(data['createdAt']),
      updatedAt: _parseDateTime(data['updatedAt']),
    );
  }

  /// Convert to Firestore-compatible map.
  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'description': description,
      'price': price,
      'currency': currency,
      'propertyType': propertyType,
      'listingType': listingType,
      'status': status,
      'location': location.toMap(),
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'parking': parking,
      'sizeSqm': sizeSqm,
      'amenities': amenities,
      'images': images,
      'ownerId': ownerId,
      'featured': featured,
      'verified': verified,
      'views': views,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  /// Formatted price string, e.g. "KES 35,000/mo"
  String get formattedPrice {
    final formatted = price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]},',
    );
    final suffix = listingType == 'rent' ? '/mo' : '';
    return '$currency $formatted$suffix';
  }

  Listing copyWith({
    String? id,
    String? title,
    String? description,
    double? price,
    String? currency,
    String? propertyType,
    String? listingType,
    String? status,
    ListingLocation? location,
    int? bedrooms,
    int? bathrooms,
    int? parking,
    double? sizeSqm,
    List<String>? amenities,
    List<String>? images,
    String? ownerId,
    bool? featured,
    bool? verified,
    int? views,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Listing(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      price: price ?? this.price,
      currency: currency ?? this.currency,
      propertyType: propertyType ?? this.propertyType,
      listingType: listingType ?? this.listingType,
      status: status ?? this.status,
      location: location ?? this.location,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      parking: parking ?? this.parking,
      sizeSqm: sizeSqm ?? this.sizeSqm,
      amenities: amenities ?? this.amenities,
      images: images ?? this.images,
      ownerId: ownerId ?? this.ownerId,
      featured: featured ?? this.featured,
      verified: verified ?? this.verified,
      views: views ?? this.views,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Sub-model for location data.
class ListingLocation {
  final String county;
  final String area;
  final String address;
  final GeoPoint? geoPoint;
  final List<String> searchKeywords;

  const ListingLocation({
    required this.county,
    required this.area,
    this.address = '',
    this.geoPoint,
    this.searchKeywords = const [],
  });

  factory ListingLocation.fromMap(Map<String, dynamic> data) {
    GeoPoint? geo;
    if (data['geoPoint'] is GeoPoint) {
      geo = data['geoPoint'] as GeoPoint;
    } else if (data['geoPoint'] is Map) {
      final m = data['geoPoint'] as Map;
      final lat = ((m['latitude'] ?? m['_latitude'] ?? m['lat'] ?? 0.0) as num).toDouble();
      final lng = ((m['longitude'] ?? m['_longitude'] ?? m['lng'] ?? 0.0) as num).toDouble();
      geo = GeoPoint(lat, lng);
    }
    return ListingLocation(
      county: data['county']?.toString() ?? '',
      area: data['area']?.toString() ?? '',
      address: data['address']?.toString() ?? '',
      geoPoint: geo,
      searchKeywords: List<String>.from(data['searchKeywords'] ?? []),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'county': county,
      'area': area,
      'address': address,
      if (geoPoint != null) 'geoPoint': geoPoint,
      'searchKeywords': searchKeywords,
    };
  }

  /// Formatted display string, e.g. "Westlands, Nairobi"
  String get displayName => '$area, $county';
}
