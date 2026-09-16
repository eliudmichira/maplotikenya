import '../models/listing.dart';

/// Price sort direction applied to map listings.
enum PriceSort { none, lowToHigh, highToLow }

/// Filters a listing list by an optional price range and applies an optional
/// price sort. Pure function — the map screen feeds the already search/bed
/// filtered set through this, so changing price filters never refetches.
List<Listing> applyMapPriceFilter(
  List<Listing> listings, {
  double? minPrice,
  double? maxPrice,
  PriceSort sort = PriceSort.none,
}) {
  var res = listings;
  if (minPrice != null) {
    res = res.where((l) => l.price >= minPrice).toList();
  }
  if (maxPrice != null) {
    res = res.where((l) => l.price <= maxPrice).toList();
  }
  if (sort == PriceSort.lowToHigh) {
    res = [...res]..sort((a, b) => a.price.compareTo(b.price));
  } else if (sort == PriceSort.highToLow) {
    res = [...res]..sort((a, b) => b.price.compareTo(a.price));
  }
  return res;
}

/// Whether any price filter or sort is active (drives the filter-button badge
/// and the "Price" chip highlight).
bool hasActivePriceFilter({
  double? minPrice,
  double? maxPrice,
  PriceSort sort = PriceSort.none,
}) {
  return minPrice != null || maxPrice != null || sort != PriceSort.none;
}
