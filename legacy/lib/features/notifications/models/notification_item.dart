import 'package:flutter/material.dart';

enum NotificationCategory { alert, inquiry, property, system }

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final NotificationCategory category;
  final bool isRead;
  final String? listingId;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.category,
    this.isRead = false,
    this.listingId,
  });

  NotificationItem copyWith({
    String? id,
    String? title,
    String? message,
    DateTime? timestamp,
    NotificationCategory? category,
    bool? isRead,
    String? listingId,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      category: category ?? this.category,
      isRead: isRead ?? this.isRead,
      listingId: listingId ?? this.listingId,
    );
  }

  IconData get icon {
    switch (category) {
      case NotificationCategory.alert:
        return Icons.notifications_active_outlined;
      case NotificationCategory.inquiry:
        return Icons.chat_bubble_outline;
      case NotificationCategory.property:
        return Icons.home_work_outlined;
      case NotificationCategory.system:
        return Icons.shield_outlined;
    }
  }
}
