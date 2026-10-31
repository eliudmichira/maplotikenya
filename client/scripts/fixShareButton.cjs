const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/propertyDetails/propertyDetails.jsx');
let code = fs.readFileSync(filePath, 'utf8');

const norm = s => s.replace(/\r\n/g, '\n');

// 1. Add Check to lucide-react imports if missing
if (!code.includes('Check,') && !code.includes('Check }')) {
  code = code.replace(/(\bCheckCircle,)/, '$1\n  Check,');
}

// 2. Add copied state and handleShare logic
const shareLogic = `  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareTitle = property?.title || safeProperty?.title || 'Property on Maploti';
    const shareText = \`Check out \${shareTitle} on Maploti: \${url}\`;

    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast({
        type: 'success',
        title: 'Link Copied!',
        message: 'Property link copied to clipboard.'
      });
    } catch (_) {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        showToast({
          type: 'success',
          title: 'Link Copied!',
          message: 'Property link copied to clipboard.'
        });
      } catch (err) {
        prompt('Copy property link:', url);
      }
      document.body.removeChild(el);
    }
  };
`;

const stateTarget = "const [activeTab, setActiveTab] = useState('overview');";
if (!code.includes('const handleShare =')) {
  code = code.replace(stateTarget, `${stateTarget}\n${shareLogic}`);
}

// 3. Update the share button and theme button
const oldButtons = `<button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className={\`p-2 rounded-lg transition-colors \${isDark
                  ? 'text-white hover:text-white hover:bg-[rgba(251,191,36,0.1)]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }\`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={\`p-2 rounded-lg transition-colors \${isDark
                ? 'text-[#ccc] hover:text-white hover:bg-[rgba(251,191,36,0.1)]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }\`}>
                <Share2 className="w-5 h-5" />
              </button>`;

const newButtons = `<button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className={\`p-2 rounded-lg transition-colors \${isDark
                  ? 'text-white hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }\`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleShare}
                title={copied ? 'Link Copied!' : 'Share listing'}
                aria-label="Share listing"
                className={\`p-2 rounded-lg transition-colors flex items-center justify-center \${isDark
                  ? 'text-[#ccc] hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }\`}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </button>`;

const normCode = norm(code);
const normOld = norm(oldButtons);
if (normCode.includes(normOld)) {
  code = normCode.replace(normOld, norm(newButtons));
} else {
  console.log('Button block not matched via exact string, using regex replacement');
  code = code.replace(
    /<button className={`p-2 rounded-lg transition-colors \${isDark[\s\S]*?<Share2 className="w-5 h-5" \/>[\s\S]*?<\/button>/,
    `<button
                onClick={handleShare}
                title={copied ? 'Link Copied!' : 'Share listing'}
                aria-label="Share listing"
                className={\`p-2 rounded-lg transition-colors flex items-center justify-center \${isDark
                  ? 'text-[#ccc] hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }\`}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </button>`
  );
  code = code.replace(/hover:bg-\[rgba\(251,191,36,0\.1\)\]/g, 'hover:bg-white/10');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated Share2 button and handleShare in propertyDetails.jsx!');
