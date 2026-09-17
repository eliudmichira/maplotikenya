import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../Logo';

const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`transition-colors duration-500 ${isDark
      ? 'bg-[#000000] border-t border-[rgba(251,191,36,0.15)]'
      : 'bg-gray-900 border-t border-gray-800'
      }`}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10 sm:mb-12">

          {/* Company Info */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center">
              <Logo
                isDark={true}
                variant="premium"
                greenStyle="premium"
                glow="subtle"
                pulse="off"
                className="text-lg sm:text-xl lg:text-2xl"
              />
            </div>
            <p className={`font-outfit text-sm leading-relaxed max-w-sm ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
              Kenya's premier real estate platform, connecting buyers and sellers across all 47 counties.
              Find your dream home with us.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 hover:text-[#fbbf24] text-gray-300 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid: Side-by-side on mobile, 2 columns on desktop */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:col-span-2 lg:col-span-2 lg:grid-cols-2">
            {/* Quick Links */}
            <div className="space-y-3 sm:space-y-5">
              <h3 className="text-white font-outfit font-semibold text-base sm:text-lg">Quick Links</h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Properties', to: '/desktop/properties' },
                  { label: 'About Us', to: '/desktop/about' },
                  { label: 'Contact', to: '/desktop/contact' },
                  { label: 'Agents', to: '/desktop/agents' },
                  { label: 'Blog', to: '/desktop/blog' },
                  { label: 'List Property', to: '/properties/add' }
                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className={`hover:text-[#fbbf24] transition-colors duration-200 font-outfit text-sm inline-block py-0.5 ${isDark ? 'text-[#ccc]' : 'text-gray-300'}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-3 sm:space-y-5">
              <h3 className="text-white font-outfit font-semibold text-base sm:text-lg">Services</h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {[
                  { label: 'Buy Property', to: '/properties?type=buy' },
                  { label: 'Rent Property', to: '/properties?type=rent' },
                  { label: 'Sell Property', to: '/desktop/register' },
                  { label: 'Property Valuation', to: '/desktop/contact' },
                  { label: 'M-Pesa Payments', to: '/desktop/contact' }
                ].map((service, index) => (
                  <li key={index}>
                    <Link
                      to={service.to}
                      className={`hover:text-[#fbbf24] transition-colors duration-200 font-outfit text-sm inline-block py-0.5 ${isDark ? 'text-[#ccc]' : 'text-gray-300'}`}
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-white font-outfit font-semibold text-base sm:text-lg">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <MapPin className="w-5 h-5 text-[#fbbf24] mt-0.5 flex-shrink-0" />
                <p className={`font-outfit text-sm leading-snug ${isDark ? 'text-[#ccc]' : 'text-gray-300'}`}>
                  Nairobi, Kenya<br />
                  <span className="text-xs opacity-75">Westlands, 8th Floor</span>
                </p>
              </div>

              <a
                href="tel:+254700000000"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 transition-all group"
              >
                <Phone className="w-4 h-4 text-[#fbbf24] flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className={`font-outfit text-sm group-hover:text-[#fbbf24] transition-colors ${isDark ? 'text-[#ccc]' : 'text-gray-300'}`}>
                  +254 700 000 000
                </span>
              </a>

              <a
                href="mailto:support@maplotikenya.com"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 transition-all group"
              >
                <Mail className="w-4 h-4 text-[#fbbf24] flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className={`font-outfit text-sm break-all group-hover:text-[#fbbf24] transition-colors ${isDark ? 'text-[#ccc]' : 'text-gray-300'}`}>
                  support@maplotikenya.com
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className={`border-t pt-8 mb-8 ${isDark ? 'border-[rgba(251,191,36,0.15)]' : 'border-gray-800'}`}>
          <div className="max-w-md">
            <h3 className="text-white font-outfit font-semibold text-base sm:text-lg mb-2">Stay Updated</h3>
            <p className={`font-outfit text-sm mb-4 ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
              Subscribe to our newsletter for the latest property updates and market insights.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                placeholder="Enter your email"
                className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-outfit text-sm focus:outline-none focus:border-[#fbbf24] transition-colors ${isDark
                  ? 'bg-[#111111] border border-white/10 text-white placeholder-gray-500'
                  : 'bg-gray-800 border border-gray-700 text-white placeholder-gray-400'
                  }`}
              />
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#111] font-outfit font-semibold rounded-xl shadow-[0px_-2px_0px_rgba(17,17,17,0.32)_inset] hover:shadow-lg hover:shadow-[#fbbf24]/20 transition-all duration-300 active:scale-95"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`border-t pt-6 sm:pt-8 ${isDark ? 'border-[rgba(251,191,36,0.15)]' : 'border-gray-800'}`}>
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className={`font-outfit text-xs sm:text-sm ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
              &copy; {new Date().getFullYear()} MaplotiKenya. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
              <Link to="/privacy" className={`hover:text-[#fbbf24] transition-colors duration-200 font-outfit text-xs sm:text-sm ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
                Privacy Policy
              </Link>
              <Link to="/terms" className={`hover:text-[#fbbf24] transition-colors duration-200 font-outfit text-xs sm:text-sm ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
                Terms of Service
              </Link>
              <Link to="/cookies" className={`hover:text-[#fbbf24] transition-colors duration-200 font-outfit text-xs sm:text-sm ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
                Cookie Policy
              </Link>
              <Link to="/account-deletion" className={`hover:text-[#fbbf24] transition-colors duration-200 font-outfit text-xs sm:text-sm ${isDark ? 'text-[#aaa]' : 'text-gray-400'}`}>
                Delete Data
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
