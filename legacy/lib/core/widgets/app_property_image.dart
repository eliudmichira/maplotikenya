import 'dart:convert';
import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../theme/app_colors.dart';

/// Rewrites image URLs that would be CORS-blocked on Flutter Web.
///
/// Flutter Web downloads images via XHR/fetch, so any server that does not
/// send an `Access-Control-Allow-Origin` header (e.g. assets.mbanyu.com) is
/// blocked by the browser and the image silently fails. images.weserv.nl is
/// a free, CORS-enabled image proxy/CDN (returns `access-control-allow-origin: *`)
/// that serves these images correctly on web.
///
/// Native platforms (Android/iOS/desktop) have no CORS restriction, so URLs
/// are returned unchanged there — no extra hop, no third-party dependency.
String webSafeImageUrl(String url) {
  if (!kIsWeb) return url;
  final clean = url.trim();
  final host = Uri.tryParse(clean)?.host;
  if (host == 'assets.mbanyu.com') {
    return 'https://images.weserv.nl/?url=${Uri.encodeComponent(clean)}';
  }
  return clean;
}

/// Universal property image renderer that handles:
/// - Local bundled assets (e.g. 'assets/images/properties/karen_mansion.webp')
/// - Remote HTTPS image URLs (via CachedNetworkImage with Shimmer)
/// - Base64 Data URIs (via Image.memory)
/// - Graceful placeholder fallback for errors or empty URLs
class AppPropertyImage extends StatelessWidget {
  const AppPropertyImage({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.borderRadius,
  });

  final String imageUrl;
  final BoxFit fit;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cleanUrl = webSafeImageUrl(imageUrl);

    Widget imageWidget;

    if (cleanUrl.isEmpty) {
      imageWidget = _buildPlaceholder(isDark);
    } else if (cleanUrl.startsWith('assets/')) {
      imageWidget = Image.asset(
        cleanUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, __, ___) => _buildPlaceholder(isDark),
      );
    } else if (cleanUrl.startsWith('data:image')) {
      try {
        final commaIndex = cleanUrl.indexOf(',');
        final base64Str = commaIndex != -1 ? cleanUrl.substring(commaIndex + 1) : cleanUrl;
        final Uint8List bytes = base64Decode(base64Str);
        imageWidget = Image.memory(
          bytes,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (_, __, ___) => _buildPlaceholder(isDark),
        );
      } catch (_) {
        imageWidget = _buildPlaceholder(isDark);
      }
    } else {
      imageWidget = CachedNetworkImage(
        imageUrl: cleanUrl,
        width: width,
        height: height,
        fit: fit,
        placeholder: (_, __) => Shimmer.fromColors(
          baseColor: isDark ? AppColors.bgElev : AppColors.lightBgElev,
          highlightColor: isDark ? AppColors.bgSoft : AppColors.lightBgSoft,
          child: Container(
            width: width,
            height: height,
            color: isDark ? AppColors.bgElev : AppColors.lightBgElev,
          ),
        ),
        errorWidget: (_, __, ___) => _buildPlaceholder(isDark),
      );
    }

    if (borderRadius != null) {
      return ClipRRect(
        borderRadius: borderRadius!,
        child: imageWidget,
      );
    }

    return imageWidget;
  }

  Widget _buildPlaceholder(bool isDark) {
    return Container(
      width: width,
      height: height,
      color: isDark ? AppColors.bgSoft : AppColors.lightBgSoft,
      child: Center(
        child: Icon(
          Icons.home_outlined,
          size: 40,
          color: isDark ? AppColors.border : AppColors.lightBorder,
        ),
      ),
    );
  }
}
