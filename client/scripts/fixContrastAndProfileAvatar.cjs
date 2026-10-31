const fs = require('fs');
const path = require('path');

// 1. Fix HomePage.jsx contrast issues
const homePagePath = path.join(__dirname, '../src/routes/homePage/HomePage.jsx');
let homeContent = fs.readFileSync(homePagePath, 'utf8');

// Fix "Find Your Perfect Home" header contrast
homeContent = homeContent.replace(
  /<span className="text-white">\s*Find Your Perfect Home\s*<\/span>/g,
  '<span>Find Your Perfect Home</span>'
);

// Fix "Ready to Find Your Dream Home?" header contrast and button contrast
homeContent = homeContent.replace(
  /<span className="text-white">\s*Ready to Find Your Dream Home\?\s*<\/span>/g,
  '<span>Ready to Find Your Dream Home?</span>'
);

// Fix CTA section buttons contrast in light/dark mode
homeContent = homeContent.replace(
  /className="group relative flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all shadow-sm overflow-hidden"/g,
  'className="group relative flex items-center justify-center px-8 py-4 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md overflow-hidden"'
);

homeContent = homeContent.replace(
  /className=\{`flex items-center justify-center px-8 py-4 border-2 border-white\/40 rounded-full font-semibold transition-colors duration-300 hover:bg-white hover:text-\[#111\] \$\{isDark \? 'text-white' : 'text-gray-900'\}`\}/g,
  'className={`flex items-center justify-center px-8 py-4 border-2 ${isDark ? "border-white/30 text-white hover:bg-white hover:text-black" : "border-zinc-300 text-zinc-900 hover:bg-black hover:text-white"} rounded-full font-semibold transition-colors duration-300`}'
);

fs.writeFileSync(homePagePath, homeContent, 'utf8');
console.log('Fixed HomePage.jsx contrast issues');

// 2. Fix AuthContext.jsx to always preserve photoURL & avatar
const authContextPath = path.join(__dirname, '../src/context/AuthContext.jsx');
let authContent = fs.readFileSync(authContextPath, 'utf8');

// Update basicUserData in onAuthStateChange
authContent = authContent.replace(
  /const basicUserData = \{\s*id: user\.uid,\s*email: user\.email,[\s\S]*?role: "user", \/\/ Default\s*\};/,
  `const basicUserData = {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          username: user.displayName || user.email?.split("@")[0] || "User",
          name: user.displayName || user.email?.split("@")[0] || "User",
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          avatar: user.photoURL || "",
          createdAt: user.metadata.creationTime,
          provider: user.providerData[0]?.providerId || "email",
          role: "user", // Default
        };`
);

// Update enrichedUserData in onAuthStateChange
authContent = authContent.replace(
  /const enrichedUserData = \{\s*\.\.\.profile,\s*id: user\.uid,[\s\S]*?\.\.\.\(isVerified && profile\?\.role !== 'admin' \? \{ role: 'agent' \} : \{\}\)\s*\};/,
  `const userAvatar = profile?.avatar || profile?.photoURL || user.photoURL || basicUserData.avatar || "";
          const enrichedUserData = {
            ...profile,
            id: user.uid,
            uid: user.uid,
            email: user.email,
            username: profile?.username || user.displayName || user.email?.split("@")[0] || "User",
            name: profile?.name || profile?.fullName || user.displayName || basicUserData.name,
            displayName: profile?.displayName || profile?.name || user.displayName || basicUserData.displayName,
            avatar: userAvatar,
            photoURL: userAvatar,
            ...(isVerified && profile?.role !== 'admin' ? { role: 'agent' } : {})
          };`
);

// Update google login handler in AuthContext
authContent = authContent.replace(
  /phone: result\.user\.phoneNumber \|\| "",\s*avatar: result\.user\.photoURL \|\| "",\s*createdAt: result\.user\.metadata\.creationTime,/,
  `phone: result.user.phoneNumber || "",
            photoURL: result.user.photoURL || "",
            avatar: result.user.photoURL || "",
            displayName: result.user.displayName || result.user.email?.split("@")[0] || "User",
            createdAt: result.user.metadata.creationTime,`
);

fs.writeFileSync(authContextPath, authContent, 'utf8');
console.log('Fixed AuthContext.jsx photoURL propagation');

// 3. Fix Navbar.jsx avatar rendering & contrast
const navbarPath = path.join(__dirname, '../src/components/navbar/Navbar.jsx');
let navContent = fs.readFileSync(navbarPath, 'utf8');

// Define userPhoto and userInitials helper variables inside Navbar component
const navAvatarSetup = `  // User photo helper (Google auth profile or uploaded avatar)
  const userPhoto = currentUser?.photoURL || currentUser?.avatar || currentUser?.photo || currentUser?.profileImage || "";
  const userInitials = (currentUser?.displayName ? currentUser.displayName.charAt(0) : (currentUser?.name ? currentUser.name.charAt(0) : (currentUser?.email ? currentUser.email.charAt(0) : "U"))).toUpperCase();
`;

if (!navContent.includes('const userPhoto =')) {
  navContent = navContent.replace(
    /const userRole = getUserRole \? getUserRole\(\) : 'user';/,
    `const userRole = getUserRole ? getUserRole() : 'user';\n${navAvatarSetup}`
  );
}

// Replace desktop button avatar
const oldDesktopAvatar = `{currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || currentUser.email}
                          className="w-full h-full object-cover rounded-full select-none"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 text-white flex items-center justify-center">
                          <span className="text-[#111] font-bold text-lg">
                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}`;

const newDesktopAvatar = `{userPhoto ? (
                        <img
                          src={userPhoto}
                          alt={currentUser.displayName || currentUser.email}
                          className="w-full h-full object-cover rounded-full select-none"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          draggable={false}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className={\`w-full h-full \${userPhoto ? 'hidden' : 'flex'} bg-zinc-900 text-white dark:bg-white dark:text-black items-center justify-center\`}>
                        <span className="font-bold text-sm">
                          {userInitials}
                        </span>
                      </div>`;

if (navContent.includes(oldDesktopAvatar)) {
  navContent = navContent.replace(oldDesktopAvatar, newDesktopAvatar);
} else {
  // Regex fallback
  navContent = navContent.replace(
    /{\s*currentUser\.photoURL\s*\?[\s\S]*?text-\[#111\][\s\S]*?<\/span>\s*<\/div>\s*\)\s*}/,
    newDesktopAvatar
  );
}

// Replace dropdown header avatar
const oldDropdownAvatar = `{currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt={currentUser.displayName || currentUser.email}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 text-white flex items-center justify-center">
                              <span className="text-[#111] font-bold text-lg">
                                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}`;

const newDropdownAvatar = `{userPhoto ? (
                            <img
                              src={userPhoto}
                              alt={currentUser.displayName || currentUser.email}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className={\`w-full h-full \${userPhoto ? 'hidden' : 'flex'} bg-zinc-900 text-white dark:bg-white dark:text-black items-center justify-center\`}>
                            <span className="font-bold text-base">
                              {userInitials}
                            </span>
                          </div>`;

if (navContent.includes(oldDropdownAvatar)) {
  navContent = navContent.replace(oldDropdownAvatar, newDropdownAvatar);
} else {
  navContent = navContent.replace(
    /{\s*currentUser\.photoURL\s*\?[\s\S]*?text-\[#111\][\s\S]*?<\/span>\s*<\/div>\s*\)\s*}/,
    newDropdownAvatar
  );
}

// Replace mobile menu avatar
const oldMobileAvatar = `{currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || currentUser.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 text-white flex items-center justify-center">
                        <span className="text-[#111] font-bold text-lg">
                          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}`;

const newMobileAvatar = `{userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={currentUser.displayName || currentUser.email}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={\`w-full h-full \${userPhoto ? 'hidden' : 'flex'} bg-zinc-900 text-white dark:bg-white dark:text-black items-center justify-center\`}>
                      <span className="font-bold text-sm">
                        {userInitials}
                      </span>
                    </div>`;

if (navContent.includes(oldMobileAvatar)) {
  navContent = navContent.replace(oldMobileAvatar, newMobileAvatar);
} else {
  navContent = navContent.replace(
    /{\s*currentUser\.photoURL\s*\?[\s\S]*?text-\[#111\][\s\S]*?<\/span>\s*<\/div>\s*\)\s*}/,
    newMobileAvatar
  );
}

fs.writeFileSync(navbarPath, navContent, 'utf8');
console.log('Fixed Navbar.jsx user avatar and contrast');

// 4. Fix listPage_fixed_useLocation.jsx property count badge contrast
const listPagePath = path.join(__dirname, '../src/routes/listPage/listPage_fixed_useLocation.jsx');
let listContent = fs.readFileSync(listPagePath, 'utf8');

// Replace the muddy gradient and dark icon on the properties count pill (Image 4)
listContent = listContent.replace(
  /<div className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-400">[\s\S]*?<\/svg>\s*<\/div>\s*<span className="text-xs font-semibold text-gray-900 dark:text-white">\{filteredData\.length\} properties<\/span>/,
  `<div className="w-5 h-5 rounded-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black">
                  <Sparkles className="w-3 h-3 text-white dark:text-black" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {isLoading || propertiesLoading ? 'Loading properties...' : \`\${filteredData.length.toLocaleString()} properties\`}
                </span>`
);

fs.writeFileSync(listPagePath, listContent, 'utf8');
console.log('Fixed listPage badge contrast & loading state');

// 5. Update DefaultAvatar.jsx to support Google profile photo
const defaultAvatarPath = path.join(__dirname, '../src/components/DefaultAvatar.jsx');
let avatarContent = fs.readFileSync(defaultAvatarPath, 'utf8');

const newDefaultAvatarComponent = `import React from 'react';
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
    <div className={\`relative \${className}\`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={\`\${sizeClasses[size]} rounded-full object-cover border-2 \${isDark ? 'border-white/15' : 'border-gray-200'}\`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div className={\`
        \${sizeClasses[size]} 
        \${imageSrc ? 'hidden' : 'flex'}
        rounded-full 
        bg-zinc-900 text-white dark:bg-white dark:text-black
        items-center justify-center 
        font-bold
        shadow-sm
        border-2
        \${isDark ? 'border-white/15' : 'border-gray-200'}
      \`}>
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
`;

fs.writeFileSync(defaultAvatarPath, newDefaultAvatarComponent, 'utf8');
console.log('Fixed DefaultAvatar.jsx to support Google profile photo');
