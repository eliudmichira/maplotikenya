import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/accent_button.dart';
import '../../../core/widgets/profile_image.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/eyebrow_label.dart';
import '../../../core/widgets/glassmorphic_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/login_screen.dart';
import '../../listings/providers/listing_provider.dart';
import '../../listings/screens/add_property_screen.dart';
import '../../listings/services/image_upload_service.dart';
import '../../listings/screens/my_listings_screen.dart';
import '../../listings/screens/saved_listings_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  /// Picks a photo (camera or gallery), uploads it to Firebase
  /// Storage (avatars/{uid}.jpg) and saves the URL to the profile —
  /// the same photoUrl field the website reads, so it syncs both ways.
  Future<void> _uploadAvatar(BuildContext context, WidgetRef ref, String uid) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? AppColors.bgElev
          : AppColors.lightBgElev,
      builder: (ctx) {
        final text = Theme.of(ctx).brightness == Brightness.dark
            ? AppColors.text
            : AppColors.lightText;
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined, color: AppColors.accent),
                title: Text('Take a photo', style: TextStyle(color: text)),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.accent),
                title: Text('Choose from gallery', style: TextStyle(color: text)),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        );
      },
    );
    if (source == null || !context.mounted) return;

    final service = ImageUploadService();
    final XFile? picked = source == ImageSource.camera
        ? await service.takePhoto()
        : await service.pickSingleImage();
    if (picked == null || !context.mounted) return;

    final current = ref.read(userProfileProvider).valueOrNull;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
    );

    try {
      final url = await service.uploadAvatar(uid, picked);
      await ref.read(firestoreServiceProvider).updateUserProfile(
        uid: uid,
        displayName: current?.displayName ?? '',
        phone: current?.phone ?? '',
        photoUrl: url,
      );
      ref.invalidate(userProfileProvider);
      if (context.mounted) Navigator.of(context).pop();
    } catch (_) {
      if (context.mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not upload that photo. Try again.')),
        );
      }
    }
  }

  void _showEditProfileDialog(BuildContext context, WidgetRef ref, String currentName, String currentPhone) {
    final nameController = TextEditingController(text: currentName);
    final phoneController = TextEditingController(text: currentPhone);

    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        final cardBg = isDark ? AppColors.bgElev : AppColors.lightBgElev;
        final inputBg = isDark ? AppColors.bgSoft : AppColors.lightBgSoft;
        final border = isDark ? AppColors.border : AppColors.lightBorder;
        final text = isDark ? AppColors.text : AppColors.lightText;

        return AlertDialog(
          backgroundColor: cardBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Edit Profile Details', style: AppTypography.headingSm.copyWith(color: text)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: TextStyle(color: text, fontFamily: 'Inter'),
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: const Icon(Icons.person_outline, color: AppColors.accent),
                  filled: true,
                  fillColor: inputBg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: border)),
                  focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.accent, width: 1.5)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                style: TextStyle(color: text, fontFamily: 'Inter'),
                decoration: InputDecoration(
                  labelText: 'Phone / WhatsApp Number',
                  hintText: 'e.g. 0712345678',
                  prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.accent),
                  filled: true,
                  fillColor: inputBg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: border)),
                  focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.accent, width: 1.5)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.mute)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () async {
                final newName = nameController.text.trim();
                final newPhone = phoneController.text.trim();
                final uid = ref.read(authServiceProvider).currentUser?.uid;
                if (uid != null) {
                  await ref.read(firestoreServiceProvider).updateUserProfile(
                    uid: uid,
                    displayName: newName,
                    phone: newPhone,
                  );
                  ref.invalidate(userProfileProvider);
                }
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('SAVE CHANGES', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final userProfileAsync = ref.watch(userProfileProvider);
    final authState = ref.watch(authStateProvider);

    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'M',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w900,
                    fontSize: 17,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                'PROFILE',
                overflow: TextOverflow.ellipsis,
                style: AppTypography.headingSm.copyWith(
                  letterSpacing: 2.0,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: text,
                ),
              ),
            ),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: CreativeThemeToggle(),
          ),
        ],
      ),
      body: authState.when(
        data: (user) {
          if (user == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.account_circle_outlined, size: 80, color: mute),
                    const SizedBox(height: 16),
                    Text('Sign in to Maploti', style: AppTypography.headingMd.copyWith(color: text)),
                    const SizedBox(height: 8),
                    Text('Manage your listings, saved properties, and profile', style: AppTypography.bodySm.copyWith(color: mute), textAlign: TextAlign.center),
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
            );
          }

          return userProfileAsync.when(
            data: (profile) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    GlassmorphicCard(
                      child: Row(
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              CircleAvatar(
                                radius: 30,
                                backgroundColor: AppColors.accent,
                                backgroundImage:
                                    profileImageProvider(profile?.photoUrl ?? ''),
                                child: (profile?.photoUrl.isNotEmpty == true)
                                    ? null
                                    : Text(
                                        (profile?.displayName ?? 'U')[0].toUpperCase(),
                                        style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.black, fontSize: 24),
                                      ),
                              ),
                              Positioned(
                                right: -2,
                                bottom: -2,
                                child: Material(
                                  color: AppColors.accent,
                                  shape: const CircleBorder(),
                                  child: InkWell(
                                    customBorder: const CircleBorder(),
                                    onTap: () {
                                      final uid = ref.read(authServiceProvider).currentUser?.uid;
                                      if (uid != null) _uploadAvatar(context, ref, uid);
                                    },
                                    child: const Padding(
                                      padding: EdgeInsets.all(5),
                                      child: Icon(Icons.photo_camera, size: 15, color: Colors.black),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(profile?.displayName ?? 'User', style: AppTypography.headingSm.copyWith(color: text)),
                                const SizedBox(height: 4),
                                Text(profile?.email ?? user.email ?? '', style: AppTypography.bodySm.copyWith(color: mute)),
                                if (profile?.phone.isNotEmpty == true) ...[
                                  const SizedBox(height: 2),
                                  Text('WhatsApp: ${profile!.phone}', style: AppTypography.caption.copyWith(color: AppColors.accent)),
                                ],
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppColors.bgSoft : AppColors.lightBgSoft,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: isDark ? AppColors.border : AppColors.lightBorder),
                                  ),
                                  child: Text(
                                    (profile?.role ?? 'USER').toUpperCase(),
                                    style: AppTypography.caption.copyWith(color: AppColors.accent, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, color: AppColors.accent),
                            tooltip: 'Edit Profile Details',
                            onPressed: () => _showEditProfileDialog(context, ref, profile?.displayName ?? '', profile?.phone ?? ''),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Align(alignment: Alignment.centerLeft, child: EyebrowLabel('Account Options')),
                    const SizedBox(height: 12),
                    ListTile(
                      leading: const Icon(Icons.add_home_work_outlined, color: AppColors.accent),
                      title: Text('Add New Property', style: TextStyle(color: text)),
                      trailing: Icon(Icons.chevron_right, color: mute),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AddPropertyScreen()),
                        );
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.holiday_village_outlined, color: AppColors.accent),
                      title: Text('My Listings', style: TextStyle(color: text)),
                      subtitle: Text('Manage & delete your posted properties', style: TextStyle(color: mute)),
                      trailing: Icon(Icons.chevron_right, color: mute),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const MyListingsScreen()),
                        );
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.favorite_outline, color: AppColors.accent),
                      title: Text('Saved Properties', style: TextStyle(color: text)),
                      trailing: Icon(Icons.chevron_right, color: mute),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SavedListingsScreen()),
                        );
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.palette_outlined, color: AppColors.accent),
                      title: Text('App Theme', style: TextStyle(color: text)),
                      subtitle: Text('Toggle between Light & Dark mode', style: TextStyle(color: mute)),
                      trailing: const CreativeThemeToggle(),
                    ),
                    ListTile(
                      leading: const Icon(Icons.logout, color: AppColors.error),
                      title: const Text('Sign Out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        ref.read(authServiceProvider).signOut();
                      },
                    ),
                  ],
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (err, _) => Center(child: Text('Error loading profile: $err', style: TextStyle(color: text))),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
        error: (err, _) => Center(child: Text('Auth error: $err', style: TextStyle(color: text))),
      ),
    );
  }
}
