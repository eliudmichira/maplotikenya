import 'dart:convert';

import 'package:flutter/material.dart';

/// Builds an [ImageProvider] for a profile photo URL.
///
/// Supports both https URLs (Firebase Storage / Google avatar, rendered
/// via [NetworkImage]) and `data:` URLs (avatars uploaded from the
/// website when the Storage bucket has no CORS config, rendered via
/// [MemoryImage]). Returns null when [url] is empty or unparseable so
/// callers can fall back to the initial.
ImageProvider? profileImageProvider(String url) {
  if (url.isEmpty) return null;
  if (url.startsWith('data:')) {
    try {
      final comma = url.indexOf(',');
      if (comma < 0) return null;
      final bytes = base64Decode(url.substring(comma + 1));
      return MemoryImage(bytes);
    } catch (_) {
      return null;
    }
  }
  return NetworkImage(url);
}
