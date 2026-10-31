import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import logoLight from '../assets/maploti_lockup.png';
import logoDark from '../assets/maploti_lockup_dark.png';

/**
 * Maploti - Brand Logo Lockup
 * Automatically toggles between white lockup (for dark mode) and dark lockup (for light mode).
 * Props:
 * - isDark: optional boolean override. If omitted, detects current theme automatically.
 * - className: custom Tailwind classes
 */
const Logo = ({
  className = "",
  isDark: isDarkProp,
  variant = "standard"
}) => {
  let themeIsDark = true;
  try {
    const theme = useTheme();
    if (theme && typeof theme.isDark === 'boolean') {
      themeIsDark = theme.isDark;
    }
  } catch (e) {
    // Fallback to dark if outside ThemeProvider
    themeIsDark = true;
  }

  const isDark = isDarkProp !== undefined ? isDarkProp : themeIsDark;
  const activeLogo = isDark ? logoLight : logoDark;

  return (
    <motion.div
      whileHover={{ opacity: 0.92, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center select-none cursor-pointer ${className}`}
    >
      <img
        src={activeLogo}
        alt="Maploti"
        className="h-8 sm:h-9 md:h-10 w-auto object-contain"
        priority="true"
      />
    </motion.div>
  );
};

export default React.memo(Logo);
