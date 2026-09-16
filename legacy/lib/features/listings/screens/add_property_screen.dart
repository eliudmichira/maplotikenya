import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/accent_button.dart';
import '../../../core/widgets/eyebrow_label.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/login_screen.dart';
import '../models/listing.dart';
import '../providers/listing_provider.dart';
import '../services/image_upload_service.dart';

class AddPropertyScreen extends ConsumerStatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  ConsumerState<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends ConsumerState<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _countyController = TextEditingController(text: 'Nairobi');
  final _areaController = TextEditingController();
  final _bedroomsController = TextEditingController(text: '2');
  final _bathroomsController = TextEditingController(text: '2');
  final _sizeController = TextEditingController(text: '85');

  String _propertyType = 'apartment';
  String _listingType = 'rent';
  bool _isLoading = false;
  double _uploadProgress = 0.0;

  // Pin picked on the map (so posted listings appear on the Map screen).
  GeoPoint? _selectedGeoPoint;

  // Selected images from gallery
  final List<XFile> _selectedImages = [];

  final _imageUploadService = ImageUploadService();

  final List<String> _selectedAmenities = ['wifi', 'water_storage'];

  final List<String> _availableAmenities = [
    'wifi',
    'gym',
    'borehole',
    'water_storage',
    'electric_fence',
    'cctv',
    'parking',
    'swimming_pool',
    'backup_generator',
    'balcony',
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _countyController.dispose();
    _areaController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _sizeController.dispose();
    super.dispose();
  }

  // â”€â”€ Image picking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Future<void> _pickImages() async {
    HapticFeedback.lightImpact();
    final remaining = 8 - _selectedImages.length;
    if (remaining <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 8 photos allowed per listing.')),
      );
      return;
    }
    final picked = await _imageUploadService.pickImages(maxImages: remaining);
    if (picked.isNotEmpty) {
      setState(() => _selectedImages.addAll(picked));
    }
  }

  Future<void> _takePhoto() async {
    HapticFeedback.lightImpact();
    if (_selectedImages.length >= 8) return;
    final photo = await _imageUploadService.takePhoto();
    if (photo != null) {
      setState(() => _selectedImages.add(photo));
    }
  }

  void _removeImage(int index) {
    HapticFeedback.selectionClick();
    setState(() => _selectedImages.removeAt(index));
  }

  Future<void> _openMapPicker() async {
    HapticFeedback.lightImpact();
    final picked = await Navigator.push<LatLng>(
      context,
      MaterialPageRoute(builder: (_) => const _MapLocationPickerScreen()),
    );
    if (picked != null && mounted) {
      setState(() {
        _selectedGeoPoint = GeoPoint(picked.latitude, picked.longitude);
      });
    }
  }

  // __ Submit ______________________________________________________________

  Future<void> _submitListing() async {
    if (!_formKey.currentState!.validate()) return;

    final user = ref.read(authServiceProvider).currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to post a property listing.')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _uploadProgress = 0.0;
    });

    try {
      final firestoreService = ref.read(firestoreServiceProvider);

      // 1. Reserve a Firestore document ID BEFORE uploading images.
      final listingId = firestoreService.reserveListingId();

      // 2. Upload images to Storage under property_images/{listingId}/
      List<String> imageUrls = [];
      if (_selectedImages.isNotEmpty) {
        imageUrls = await _imageUploadService.uploadImages(
          listingId,
          _selectedImages,
          onProgress: (p) => setState(() => _uploadProgress = p),
        );
      }

      // 3. Build keyword list
      final title = _titleController.text.trim();
      final county = _countyController.text.trim();
      final area = _areaController.text.trim();
      final keywords = {
        county.toLowerCase(),
        area.toLowerCase(),
        _propertyType.toLowerCase(),
        _listingType.toLowerCase(),
        ...title.toLowerCase().split(' ').where((w) => w.length > 2),
      }.toList();

      // 4. Build the listing object with reserved ID and uploaded URLs
      final now = DateTime.now();
      final listing = Listing(
        id: listingId,
        title: title,
        description: _descriptionController.text.trim(),
        price: double.parse(_priceController.text.trim()),
        propertyType: _propertyType,
        listingType: _listingType,
        location: ListingLocation(
          county: county,
          area: area,
          geoPoint: _selectedGeoPoint,
          searchKeywords: keywords,
        ),
        bedrooms: int.tryParse(_bedroomsController.text.trim()) ?? 0,
        bathrooms: int.tryParse(_bathroomsController.text.trim()) ?? 0,
        sizeSqm: double.tryParse(_sizeController.text.trim()) ?? 0,
        amenities: _selectedAmenities,
        images: imageUrls,
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now,
      );

      // 5. Write the Firestore document (images already uploaded)
      await firestoreService.createListing(listing);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Property listing published successfully!'),  
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to publish listing: $e'),  
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Auth gate
    final authState = ref.watch(authStateProvider);
    final user = authState.asData?.value;

    if (user == null) {
      final theme = Theme.of(context);
      final isDark = theme.brightness == Brightness.dark;
      final text = isDark ? AppColors.text : AppColors.lightText;
      final mute = isDark ? AppColors.mute : AppColors.lightMute;
      return Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          title: Text(
            'POST A PROPERTY',
            style: AppTypography.headingSm.copyWith(letterSpacing: 2, color: text),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 72, color: mute),
                const SizedBox(height: 16),
                Text('Sign in Required', style: AppTypography.headingMd.copyWith(color: text)),
                const SizedBox(height: 8),
                Text(
                  'You need to sign in to post a property listing on Maploti.',
                  style: AppTypography.bodySm.copyWith(color: mute),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                AccentButton(
                  label: 'Sign In / Register',
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      );
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(
          'POST A PROPERTY',
          style: AppTypography.headingSm.copyWith(letterSpacing: 2, color: text),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // â”€â”€ Photos Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const FadeSlideWidget(child: EyebrowLabel('Property Photos')),
                  const SizedBox(height: 4),
                  FadeSlideWidget(
                    delay: const Duration(milliseconds: 50),
                    child: Text(
                      'Add up to 8 photos. The first photo will be the cover.',
                      style: AppTypography.caption,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildImagePicker(),
                  const SizedBox(height: 24),

                  // â”€â”€ Basic Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const EyebrowLabel('Basic Details'),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Listing Title',
                      hintText: 'e.g. Modern 2BR Apartment in Westlands',
                    ),
                    validator: (val) => val == null || val.isEmpty ? 'Enter a title' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      hintText: 'Describe property features, environment, terms...',
                    ),
                    validator: (val) => val == null || val.isEmpty ? 'Enter a description' : null,
                  ),

                  // â”€â”€ Listing & Property Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const SizedBox(height: 24),
                  const EyebrowLabel('Listing & Property Type'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _listingType,
                          decoration: const InputDecoration(labelText: 'Listing Type'),
                          dropdownColor: AppColors.bgElev,
                          items: const [
                            DropdownMenuItem(value: 'rent', child: Text('FOR RENT')),
                            DropdownMenuItem(value: 'sale', child: Text('FOR SALE')),
                          ],
                          onChanged: (val) => setState(() => _listingType = val!),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _propertyType,
                          decoration: const InputDecoration(labelText: 'Property Type'),
                          dropdownColor: AppColors.bgElev,
                          items: const [
                            DropdownMenuItem(value: 'apartment', child: Text('Apartment')),
                            DropdownMenuItem(value: 'house', child: Text('House')),
                            DropdownMenuItem(value: 'plot', child: Text('Plot / Land')),
                            DropdownMenuItem(value: 'villa', child: Text('Villa')),
                          ],
                          onChanged: (val) => setState(() => _propertyType = val!),
                        ),
                      ),
                    ],
                  ),

                  // â”€â”€ Price & Location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const SizedBox(height: 24),
                  const EyebrowLabel('Price & Location'),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Price (KES)',
                      hintText: 'e.g. 45000',
                    ),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'Enter price';
                      if (double.tryParse(val) == null) return 'Enter a valid number';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _countyController,
                          decoration: const InputDecoration(labelText: 'County', hintText: 'Nairobi'),
                          validator: (val) =>
                              val == null || val.isEmpty ? 'Enter county' : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _areaController,
                          decoration: const InputDecoration(
                            labelText: 'Area / Estate',
                            hintText: 'e.g. Kilimani',
                          ),
                          validator: (val) =>
                              val == null || val.isEmpty ? 'Enter area' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildMapLocationCard(isDark, text, mute),

                  // â”€â”€ Specifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  if (_propertyType != 'plot') ...[
                    const SizedBox(height: 24),
                    const EyebrowLabel('Specifications'),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _bedroomsController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Bedrooms'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _bathroomsController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Bathrooms'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _sizeController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Size (mÂ²)'),
                          ),
                        ),
                      ],
                    ),
                  ],

                  // â”€â”€ Amenities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const SizedBox(height: 24),
                  const EyebrowLabel('Amenities'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableAmenities.map((amenity) {
                      final isSelected = _selectedAmenities.contains(amenity);
                      return FilterChip(
                        label: Text(amenity.replaceAll('_', ' ').toUpperCase()),
                        selected: isSelected,
                        selectedColor: AppColors.accent,
                        checkmarkColor: Colors.black,
                        labelStyle: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.black : text,
                        ),
                        onSelected: (selected) {
                          HapticFeedback.selectionClick();
                          setState(() {
                            if (selected) {
                              _selectedAmenities.add(amenity);
                            } else {
                              _selectedAmenities.remove(amenity);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),

                  // â”€â”€ Upload progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  if (_isLoading && _selectedImages.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text('Uploading photos...', style: AppTypography.caption),
                            const Spacer(),
                            Text(
                              '${(_uploadProgress * 100).toInt()}%',
                              style: AppTypography.mono.copyWith(
                                color: isDark ? AppColors.accent : AppColors.accentDark,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: _uploadProgress,
                            backgroundColor: AppColors.bgElev,
                            color: AppColors.accent,
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  ],

                  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const SizedBox(height: 36),
                  AccentButton(
                    label: 'Publish Listing',
                    icon: Icons.cloud_upload_outlined,
                    isLoading: _isLoading,
                    isExpanded: true,
                    onPressed: _submitListing,
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // â”€â”€ Image Picker Widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Map Location Card

  Widget _buildMapLocationCard(bool isDark, Color text, Color mute) {
    final bg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final border = isDark ? AppColors.border : AppColors.lightBorder;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Icon(
            _selectedGeoPoint != null
                ? Icons.location_on
                : Icons.location_on_outlined,
            color: _selectedGeoPoint != null ? AppColors.accent : mute,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _selectedGeoPoint != null
                      ? 'Pin placed on map'
                      : 'Add property location on map',
                  style: AppTypography.bodySm.copyWith(
                    fontWeight: FontWeight.w600,
                    color: text,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _selectedGeoPoint != null
                      ? '${_selectedGeoPoint!.latitude.toStringAsFixed(5)}, '
                          '${_selectedGeoPoint!.longitude.toStringAsFixed(5)}'
                      : 'Listings with a pin appear on the Map screen. '
                          'Without one they stay hidden from the map.',
                  style: AppTypography.caption.copyWith(color: mute),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: _openMapPicker,
            icon: Icon(
              _selectedGeoPoint != null
                  ? Icons.edit_location_alt
                  : Icons.add_location_alt,
              size: 16,
            ),
            label: Text(_selectedGeoPoint != null ? 'Change' : 'Pick'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              side: BorderSide(color: border),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePicker() {
    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _selectedImages.length + 1,
        separatorBuilder: (_, _i) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          if (index == _selectedImages.length) {
            // Add button
            return _buildAddImageButton();
          }
          return _buildImageThumbnail(index);
        },
      ),
    );
  }

  Widget _buildAddImageButton() {
    if (_selectedImages.length >= 8) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final accent = isDark ? AppColors.accent : AppColors.accentDark;

    return GestureDetector(
      onTap: _showImageSourceSheet,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 100,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.accent.withValues(alpha: 0.4),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_a_photo_outlined,
              color: accent,
              size: 28,
            ),
            const SizedBox(height: 6),
            Text(
              '${_selectedImages.length}/8',
              style: AppTypography.caption.copyWith(color: accent),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageThumbnail(int index) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.file(
            File(_selectedImages[index].path),
            width: 100,
            height: 100,
            fit: BoxFit.cover,
            errorBuilder: (_, _u, _e) => Container(
              width: 100,
              height: 100,
              color: AppColors.bgElev,
              child: const Icon(Icons.broken_image_outlined, color: AppColors.mute),
            ),
          ),
        ),
        // Cover label on first image
        if (index == 0)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.85),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
              ),
              child: const Text(
                'COVER',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
            ),
          ),
        // Remove button
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => _removeImage(index),
            child: Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  void _showImageSourceSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
    final text = isDark ? AppColors.text : AppColors.lightText;

    showModalBottomSheet(
      context: context,
      backgroundColor: bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Add Photos', style: AppTypography.headingSm.copyWith(color: text)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AppColors.accent),
              title: Text('Choose from Gallery', style: TextStyle(color: text)),
              subtitle: const Text('Select multiple photos'),
              onTap: () {
                Navigator.pop(context);
                _pickImages();
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppColors.accent),
              title: Text('Take a Photo', style: TextStyle(color: text)),
              subtitle: const Text('Use your camera'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Full-screen map where the user taps to drop a pin for their listing.
/// Returns the chosen [LatLng] via Navigator.pop.
class _MapLocationPickerScreen extends StatefulWidget {
  const _MapLocationPickerScreen();

  @override
  State<_MapLocationPickerScreen> createState() => _MapLocationPickerScreenState();
}

class _MapLocationPickerScreenState extends State<_MapLocationPickerScreen> {
  static const _nairobiCenter = LatLng(-1.2921, 36.8219);
  final _mapController = MapController();
  LatLng? _pin;
  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _tryLocate();
  }

  Future<void> _tryLocate() async {
    setState(() => _isLocating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
      if (!mounted) return;
      setState(() => _pin = LatLng(pos.latitude, pos.longitude));
      // Move only after the map widget has mounted (post-frame) to avoid
      // acting on an unattached MapController.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _mapController.move(_pin!, 15);
      });
    } catch (_) {
      // Stay on the default Nairobi view.
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;
    final mapUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(
          'Pick Location',
          style: AppTypography.headingSm.copyWith(color: text),
        ),
        actions: [
          TextButton(
            onPressed: _pin == null
                ? null
                : () => Navigator.pop(context, _pin),
            child: const Text(
              'Confirm',
              style: TextStyle(
                color: AppColors.accent,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _pin ?? _nairobiCenter,
              initialZoom: 12,
              minZoom: 5,
              maxZoom: 18,
              onTap: (_, latLng) => setState(() => _pin = latLng),
            ),
            children: [
              TileLayer(
                urlTemplate: mapUrl,
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'ke.maploti.maploti',
                retinaMode: true,
              ),
              if (_pin != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _pin!,
                      width: 46,
                      height: 46,
                      child: const Icon(
                        Icons.location_on,
                        color: AppColors.error,
                        size: 46,
                      ),
                    ),
                  ],
                ),
            ],
          ),

          // Instruction pill
          Positioned(
            top: MediaQuery.of(context).padding.top + 76,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: (isDark ? AppColors.bgElev : Colors.white)
                      .withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? AppColors.border : AppColors.lightBorder,
                  ),
                ),
                child: Text(
                  _pin == null
                      ? 'Tap the map to drop the pin'
                      : 'Pin: ${_pin!.latitude.toStringAsFixed(5)}, '
                          '${_pin!.longitude.toStringAsFixed(5)}',
                  style: AppTypography.caption.copyWith(
                    color: _pin == null ? mute : text,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          // Use-my-location FAB
          Positioned(
            right: 16,
            bottom: 32,
            child: FloatingActionButton.small(
              heroTag: 'fab_map_picker_locate',
              backgroundColor: isDark ? const Color(0xFF1E1E20) : Colors.white,
              elevation: 6,
              onPressed: _tryLocate,
              child: _isLocating
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.accent,
                      ),
                    )
                  : const Icon(Icons.my_location, color: AppColors.accent, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

