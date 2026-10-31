import React from 'react';
import { useTheme } from '../context/ThemeContext';

const DefaultAvatar = ({ 
  name = 'User', 
  avatar = '',
  src = '',
  photoURL = '',
  size = 'md', 
  className = '',
  showVerification = false 
}) => {
  const { isDark } = useTheme();

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const imageSrc = src || avatar || photoURL;

  // Generate initials from name
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className={`relative ${className}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={`${sizeClasses[size]} rounded-full object-cover border-2 ${isDark ? 'border-white/15' : 'border-gray-200'}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div className={`
        ${sizeClasses[size]} 
        ${imageSrc ? 'hidden' : 'flex'}
        rounded-full 
        bg-zinc-900 text-white dark:bg-white dark:text-black
        items-center justify-center 
        font-bold
        shadow-sm
        border-2
        ${isDark ? 'border-white/15' : 'border-gray-200'}
      `}>
        {initials}
      </div>
      
      {showVerification && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center border-2 border-white shadow-md">
          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default DefaultAvatar;
