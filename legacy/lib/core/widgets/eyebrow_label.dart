import 'package:flutter/material.dart';

import '../theme/app_typography.dart';

/// Uppercase spaced label matching BudgetThrills `.eyebrow` style.
/// Use above section headings for labels like "FEATURED" or "NEARBY".
class EyebrowLabel extends StatelessWidget {
  const EyebrowLabel(this.text, {super.key, this.color});

  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: color != null
          ? AppTypography.eyebrow.copyWith(color: color)
          : AppTypography.eyebrow,
    );
  }
}
