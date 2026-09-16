import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Handles image selection from gallery/camera, compression, and
/// uploading to Firebase Storage under property_images/{listingId}/.
class ImageUploadService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final ImagePicker _picker = ImagePicker();

  // ── Pick images from gallery ─────────────────────────────────────────────────

  /// Opens the image gallery and allows selecting up to [maxImages] photos.
  Future<List<XFile>> pickImages({int maxImages = 8}) async {
    final picked = await _picker.pickMultiImage(
      imageQuality: 90,
      maxWidth: 1920,
      maxHeight: 1920,
    );
    if (picked.length > maxImages) {
      return picked.sublist(0, maxImages);
    }
    return picked;
  }

  /// Opens the camera and captures a single photo.
  Future<XFile?> takePhoto() async {
    return _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 90,
      maxWidth: 1920,
      maxHeight: 1920,
    );
  }

  /// Picks a single image from the gallery.
  Future<XFile?> pickSingleImage() async {
    return _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
      maxWidth: 1920,
      maxHeight: 1920,
    );
  }

  // ── Compress ──────────────────────────────────────────────────────────────────

  /// Compresses a single image to ~70% quality, max 1280px width.
  Future<File?> compressImage(XFile xFile) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final ext = path.extension(xFile.path).toLowerCase();
      final targetPath = '${tempDir.path}/${DateTime.now().millisecondsSinceEpoch}_compressed$ext';

      final result = await FlutterImageCompress.compressAndGetFile(
        xFile.path,
        targetPath,
        quality: 72,
        minWidth: 640,
        minHeight: 480,
      );

      return result != null ? File(result.path) : null;
    } catch (_) {
      // Fall back to uncompressed if compression fails
      return File(xFile.path);
    }
  }  /// Compresses and uploads one avatar image to Firebase Storage
  /// under avatars/{uid}.jpg, returning the download URL.
  /// Written to users/{uid}.photoUrl so web & mobile stay in sync.
  Future<String> uploadAvatar(String uid, XFile image) async {
    File file = File(image.path);
    try {
      final tempDir = await getTemporaryDirectory();
      final targetPath =
          '${tempDir.path}/${DateTime.now().millisecondsSinceEpoch}_avatar.jpg';
      final result = await FlutterImageCompress.compressAndGetFile(
        image.path,
        targetPath,
        quality: 80,
        minWidth: 256,
        minHeight: 256,
      );
      if (result != null) file = File(result.path);
    } catch (_) {
      // Fall back to the original file if compression fails
    }

    final ref = _storage.ref('avatars/$uid.jpg');
    final snapshot = await ref.putFile(file);
    return snapshot.ref.getDownloadURL();
  }

  // ── Upload ────────────────────────────────────────────────────

  /// Compresses and uploads [images] to Firebase Storage.
  /// Returns the list of download URLs in order.
  /// Calls [onProgress] with values 0.0–1.0 for each file.
  Future<List<String>> uploadImages(
    String listingId,
    List<XFile> images, {
    void Function(double progress)? onProgress,
  }) async {
    final List<String> urls = [];

    for (int i = 0; i < images.length; i++) {
      // Compress
      final compressed = await compressImage(images[i]);
      if (compressed == null) continue;

      // Upload
      final ext = path.extension(images[i].path).isEmpty
          ? '.jpg'
          : path.extension(images[i].path);
      final ref = _storage.ref('property_images/$listingId/image_$i$ext');

      final task = ref.putFile(compressed);

      // Report upload progress
      task.snapshotEvents.listen((snapshot) {
        if (onProgress != null && snapshot.totalBytes > 0) {
          final fileProgress = snapshot.bytesTransferred / snapshot.totalBytes;
          final overallProgress = (i + fileProgress) / images.length;
          onProgress(overallProgress);
        }
      });

      final snapshot = await task;
      final url = await snapshot.ref.getDownloadURL();
      urls.add(url);

      onProgress?.call((i + 1) / images.length);
    }

    return urls;
  }
}
