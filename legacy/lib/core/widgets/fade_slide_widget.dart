import 'package:flutter/material.dart';

/// Wraps a child widget with a fade-in + slide-up animation.
/// This is the Flutter equivalent of BudgetThrills' `[data-reveal]` scroll animation.
///
/// Usage:
/// ```dart
/// FadeSlideWidget(
///   delay: Duration(milliseconds: 200),
///   child: Text('Hello'),
/// )
/// ```
class FadeSlideWidget extends StatefulWidget {
  const FadeSlideWidget({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 800),
    this.offset = 24.0,
  });

  final Widget child;
  final Duration delay;
  final Duration duration;
  final double offset;

  @override
  State<FadeSlideWidget> createState() => _FadeSlideWidgetState();
}

class _FadeSlideWidgetState extends State<FadeSlideWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _opacity = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );

    _slide = Tween<Offset>(
      begin: Offset(0, widget.offset),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: const Cubic(0.2, 0.7, 0.2, 1.0), // matches cubic-bezier(.2,.7,.2,1)
    ));

    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      Future.delayed(widget.delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: ListenableBuilder(
        listenable: _slide,
        builder: (context, child) => Transform.translate(
          offset: _slide.value,
          child: child,
        ),
        child: widget.child,
      ),
    );
  }
}

/// Staggered animation for lists — each item animates in sequence.
/// Use inside a `ListView.builder` or `Column`.
class StaggeredFadeSlide extends StatelessWidget {
  const StaggeredFadeSlide({
    super.key,
    required this.index,
    required this.child,
    this.baseDelay = const Duration(milliseconds: 100),
    this.stagger = const Duration(milliseconds: 80),
  });

  final int index;
  final Widget child;
  final Duration baseDelay;
  final Duration stagger;

  @override
  Widget build(BuildContext context) {
    return FadeSlideWidget(
      delay: baseDelay + stagger * index,
      child: child,
    );
  }
}
