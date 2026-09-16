import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/creative_theme_toggle.dart';
import '../../../core/widgets/fade_slide_widget.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();

  bool _isSignUp = false;
  bool _isLoading = false;
  bool _isGoogleLoading = false;
  bool _obscurePassword = true;

  bool _isCtaPressed = false;
  bool _isGooglePressed = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  // ── Email / Password submit ──────────────────────────────────────────────────

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      if (_isSignUp) {
        await authService.signUpWithEmail(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
          displayName: _nameController.text.trim(),
        );
      } else {
        await authService.signInWithEmail(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
        );
      }

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Google Sign-In ──────────────────────────────────────────────────────────

  Future<void> _signInWithGoogle() async {
    setState(() => _isGoogleLoading = true);
    try {
      final result = await ref.read(authServiceProvider).signInWithGoogle();
      if (result != null && mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isGoogleLoading = false);
    }
  }

  // ── Forgot Password ─────────────────────────────────────────────────────────

  void _showResetPasswordDialog() {
    final resetEmailController = TextEditingController(
      text: _emailController.text,
    );

    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? AppColors.bgElev : AppColors.lightBgElev,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text('Reset Password', style: AppTypography.headingSm),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter your email address and we\'ll send you a password reset link.',
                style: AppTypography.bodySm,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: resetEmailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email Address',
                  hintText: 'name@example.com',
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: const OutlineInputBorder(borderRadius: BorderRadius.zero),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: isDark ? AppColors.border : AppColors.lightBorder),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.accent, width: 1.5),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.mute)),
            ),
            GestureDetector(
              onTap: () async {
                final email = resetEmailController.text.trim();
                if (email.isEmpty) return;
                Navigator.pop(ctx);
                try {
                  await ref.read(authServiceProvider).resetPassword(email);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Password reset email sent! Check your inbox.'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                } catch (e) {
                  if (mounted) _showError(e.toString());
                }
              },
              child: _buildEmbossedPillButton(
                child: const Text(
                  'SEND LINK',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: Colors.black,
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bg = theme.scaffoldBackgroundColor;
    final inputBg = isDark ? AppColors.bgSoft : AppColors.lightBgSoft;
    final border = isDark ? AppColors.border : AppColors.lightBorder;
    final text = isDark ? AppColors.text : AppColors.lightText;
    final mute = isDark ? AppColors.mute : AppColors.lightMute;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: text, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: CreativeThemeToggle(),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Brand Badge & Header ─────────────────────────────────────
                FadeSlideWidget(
                  child: Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Color(0xFFD4FF33), Color(0xFFA6E600)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withValues(alpha: 0.4),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'M',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w900,
                              fontSize: 24,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MAPLOTI',
                            style: AppTypography.headingSm.copyWith(
                              letterSpacing: 2.5,
                              fontWeight: FontWeight.w900,
                              color: text,
                            ),
                          ),
                          Text(
                            'Kenya Real Estate Platform',
                            style: AppTypography.caption.copyWith(color: mute),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // ── Embossed Segmented Tab Switcher (Sign In / Register) ──────
                FadeSlideWidget(
                  delay: const Duration(milliseconds: 60),
                  child: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: inputBg,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: border),
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.black.withValues(alpha: 0.04),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              if (_isSignUp) {
                                HapticFeedback.selectionClick();
                                setState(() {
                                  _isSignUp = false;
                                  _formKey.currentState?.reset();
                                });
                              }
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              curve: Curves.easeOutBack,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: !_isSignUp
                                  ? BoxDecoration(
                                      borderRadius: BorderRadius.circular(26),
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: isDark
                                            ? [const Color(0xFF2C2C2E), const Color(0xFF1C1C1E)]
                                            : [Colors.white, const Color(0xFFF3F4F6)],
                                      ),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF3A3A3C) : const Color(0xFFE5E7EB),
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: isDark ? Colors.black.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.08),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        ),
                                        BoxShadow(
                                          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white,
                                          blurRadius: 4,
                                          offset: const Offset(0, -1),
                                        ),
                                      ],
                                    )
                                  : const BoxDecoration(),
                              child: Text(
                                'Sign In',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontWeight: !_isSignUp ? FontWeight.w800 : FontWeight.w500,
                                  color: !_isSignUp ? text : mute,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              if (!_isSignUp) {
                                HapticFeedback.selectionClick();
                                setState(() {
                                  _isSignUp = true;
                                  _formKey.currentState?.reset();
                                });
                              }
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              curve: Curves.easeOutBack,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: _isSignUp
                                  ? BoxDecoration(
                                      borderRadius: BorderRadius.circular(26),
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: isDark
                                            ? [const Color(0xFF2C2C2E), const Color(0xFF1C1C1E)]
                                            : [Colors.white, const Color(0xFFF3F4F6)],
                                      ),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF3A3A3C) : const Color(0xFFE5E7EB),
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: isDark ? Colors.black.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.08),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        ),
                                        BoxShadow(
                                          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white,
                                          blurRadius: 4,
                                          offset: const Offset(0, -1),
                                        ),
                                      ],
                                    )
                                  : const BoxDecoration(),
                              child: Text(
                                'Register',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontWeight: _isSignUp ? FontWeight.w800 : FontWeight.w500,
                                  color: _isSignUp ? text : mute,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // ── Dynamic Title & Subtitle ──────────────────────────────────
                FadeSlideWidget(
                  delay: const Duration(milliseconds: 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isSignUp ? 'Create your Account' : 'Welcome back to Maploti',
                        style: AppTypography.headingLg.copyWith(fontSize: 24, color: text),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _isSignUp
                            ? 'Start searching, saving, and listing properties across Kenya.'
                            : 'Access your saved properties and manage your account.',
                        style: AppTypography.bodySm.copyWith(color: mute),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // ── Embossed Google Sign-In Pill Button ───────────────────────
                FadeSlideWidget(
                  delay: const Duration(milliseconds: 140),
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTapDown: (_) => setState(() => _isGooglePressed = true),
                    onTapUp: (_) => setState(() => _isGooglePressed = false),
                    onTapCancel: () => setState(() => _isGooglePressed = false),
                    onTap: _isGoogleLoading ? null : () {
                      HapticFeedback.mediumImpact();
                      _signInWithGoogle();
                    },
                    child: AnimatedScale(
                      scale: _isGooglePressed ? 0.97 : 1.0,
                      duration: const Duration(milliseconds: 120),
                      curve: Curves.easeOutCubic,
                      child: Container(
                        height: 52,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(28),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: isDark
                                ? [const Color(0xFF262628), const Color(0xFF161618)]
                                : [Colors.white, const Color(0xFFF3F4F6)],
                          ),
                          border: Border.all(
                            color: isDark ? const Color(0xFF363639) : const Color(0xFFE2E4E8),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.08),
                              blurRadius: 10,
                              offset: const Offset(0, 5),
                            ),
                            BoxShadow(
                              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white,
                              blurRadius: 4,
                              offset: const Offset(0, -1),
                            ),
                          ],
                        ),
                        child: Center(
                          child: _isGoogleLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.accent,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const _GoogleLogoWidget(),
                                    const SizedBox(width: 12),
                                    Text(
                                      _isSignUp ? 'Continue with Google' : 'Sign in with Google',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                        color: text,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 22),

                // ── Divider ───────────────────────────────────────────────────
                FadeSlideWidget(
                  delay: const Duration(milliseconds: 180),
                  child: Row(
                    children: [
                      Expanded(child: Divider(color: border)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Text(
                          'or continue with email',
                          style: AppTypography.caption.copyWith(color: mute),
                        ),
                      ),
                      Expanded(child: Divider(color: border)),
                    ],
                  ),
                ),
                const SizedBox(height: 22),

                // ── Form Fields ───────────────────────────────────────────────
                if (_isSignUp) ...[
                  TextFormField(
                    controller: _nameController,
                    textCapitalization: TextCapitalization.words,
                    style: TextStyle(color: text, fontFamily: 'Inter'),
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      hintText: 'e.g. John Doe',
                      prefixIcon: const Icon(Icons.person_outline, color: AppColors.accent),
                      filled: true,
                      fillColor: inputBg,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(color: border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(color: border),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.zero,
                        borderSide: BorderSide(color: AppColors.accent, width: 1.5),
                      ),
                    ),
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'Enter your full name' : null,
                  ),
                  const SizedBox(height: 16),
                ],

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: TextStyle(color: text, fontFamily: 'Inter'),
                  decoration: InputDecoration(
                    labelText: 'Email Address',
                    hintText: 'name@example.com',
                    prefixIcon: const Icon(Icons.email_outlined, color: AppColors.accent),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: border),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: AppColors.accent, width: 1.5),
                    ),
                  ),
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) return 'Enter your email address';
                    if (!val.contains('@') || !val.contains('.')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: TextStyle(color: text, fontFamily: 'Inter'),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline, color: AppColors.accent),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: mute,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: border),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: AppColors.accent, width: 1.5),
                    ),
                  ),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Enter your password';
                    if (val.length < 6) return 'Password must be at least 6 characters';
                    return null;
                  },
                ),

                // Forgot Password link
                if (!_isSignUp) ...[
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _showResetPasswordDialog,
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          color: AppColors.accent,
                          fontFamily: 'Inter',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ] else
                  const SizedBox(height: 24),

                // ── Primary 3D Embossed Lime Pill CTA Button ──────────────────
                GestureDetector(
                  onTapDown: (_) => setState(() => _isCtaPressed = true),
                  onTapUp: (_) => setState(() => _isCtaPressed = false),
                  onTapCancel: () => setState(() => _isCtaPressed = false),
                  onTap: _isLoading ? null : () {
                    HapticFeedback.mediumImpact();
                    _submit();
                  },
                  child: AnimatedScale(
                    scale: _isCtaPressed ? 0.97 : 1.0,
                    duration: const Duration(milliseconds: 120),
                    curve: Curves.easeOutCubic,
                    child: _buildEmbossedPillButton(
                      child: _isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.black,
                              ),
                            )
                          : Text(
                              _isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN',
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                                letterSpacing: 1.5,
                                color: Colors.black,
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // ── Security Trust Badge ─────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.shield_outlined, size: 14, color: AppColors.accent),
                    const SizedBox(width: 6),
                    Text(
                      '256-bit Encrypted · Instant Firebase Auth',
                      style: AppTypography.caption.copyWith(color: mute, fontSize: 11, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // ── Bottom Toggle Link ────────────────────────────────────────
                Center(
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _isSignUp = !_isSignUp;
                        _formKey.currentState?.reset();
                      });
                    },
                    child: RichText(
                      text: TextSpan(
                        style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: mute),
                        children: [
                          TextSpan(
                            text: _isSignUp
                                ? 'Already have an account? '
                                : "Don't have an account? ",
                          ),
                          TextSpan(
                            text: _isSignUp ? 'Sign In' : 'Register',
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── 3D Embossed Lime Pill CTA Generator Helper ──────────────────────────────
  Widget _buildEmbossedPillButton({required Widget child, EdgeInsetsGeometry? padding}) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFE2FF5E), // vibrant top highlight lime
            Color(0xFF9BE500), // rich base lime
          ],
        ),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.5),
          width: 1.2,
        ),
        boxShadow: [
          // Lime glow & depth shadow
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.45),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
          // Dark drop shadow
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(child: child),
    );
  }
}

// ── Clean Authentic Google Logo Widget ─────────────────────────────────────────
class _GoogleLogoWidget extends StatelessWidget {
  const _GoogleLogoWidget();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(
        painter: _GoogleGLogoPainter(),
      ),
    );
  }
}

class _GoogleGLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    final center = Offset(w / 2, h / 2);
    final radius = w / 2;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.22
      ..strokeCap = StrokeCap.butt;

    // Blue (Right arc)
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - paint.strokeWidth / 2),
      -0.5,
      1.8,
      false,
      paint,
    );

    // Green (Bottom arc)
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - paint.strokeWidth / 2),
      1.3,
      1.5,
      false,
      paint,
    );

    // Yellow (Left arc)
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - paint.strokeWidth / 2),
      2.8,
      1.2,
      false,
      paint,
    );

    // Red (Top arc)
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - paint.strokeWidth / 2),
      4.0,
      1.8,
      false,
      paint,
    );

    // Horizontal bar for 'G'
    final barPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    canvas.drawRect(
      Rect.fromLTRB(w * 0.48, h * 0.38, w * 0.9, h * 0.62),
      barPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
