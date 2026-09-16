import 'dart:math' as math;

import 'package:latlong2/latlong.dart';

import '../models/listing.dart';

/// A group of listings that occupy the same map cell at the current zoom.
class ListingCluster {
  final List<Listing> listings;
  final LatLng centroid;

  const ListingCluster({required this.listings, required this.centroid});
}

/// Groups listings into clusters using a fixed-size world-pixel grid.
///
/// Because world-pixel size doubles with every zoom level, a fixed cell size
/// covers fewer degrees as you zoom in — clusters naturally split apart the
/// closer you get, and merge when you zoom out. Points separated by more than
/// one cell never cluster.
///
/// [cellSize] is in world pixels, which is 1:1 with logical screen pixels for
/// the default tile size, so 72 ≈ a 72px cell on screen.
List<ListingCluster> clusterListings({
  required List<Listing> listings,
  required double zoom,
  double cellSize = 72,
}) {
  final world = 256.0 * math.pow(2.0, zoom);
  final cells = <String, List<Listing>>{};

  for (final listing in listings) {
    final gp = listing.location.geoPoint;
    if (gp == null) continue;
    final x = (gp.longitude + 180.0) / 360.0 * world;
    final y = _latToWorldY(gp.latitude, world);
    final cx = (x / cellSize).floor();
    final cy = (y / cellSize).floor();
    cells.putIfAbsent('$cx|$cy', () => []).add(listing);
  }

  return cells.values.map((group) {
    final lat = group.fold<double>(
            0.0, (sum, l) => sum + l.location.geoPoint!.latitude) /
        group.length;
    final lng = group.fold<double>(
            0.0, (sum, l) => sum + l.location.geoPoint!.longitude) /
        group.length;
    return ListingCluster(
      listings: group,
      centroid: LatLng(lat, lng),
    );
  }).toList();
}

/// Web-Mercator Y in world pixels (0 = top, world = bottom).
double _latToWorldY(double lat, double world) {
  final rad = lat * math.pi / 180.0;
  final n = math.log(math.tan(rad) + 1.0 / math.cos(rad));
  return (1.0 - n / math.pi) / 2.0 * world;
}
