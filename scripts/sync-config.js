import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const targets = [
  path.join(root, 'tradex-app', 'public', 'branding'),
  path.join(root, 'nextjs-app', 'public', 'branding'),
];

const configSrc = path.join(root, 'config', 'app.json');
const assetsSrc = path.join(root, 'config', 'assets');
const envFile = path.join(root, '.env');
const envExampleFile = path.join(root, '.env.example');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function sameContent(a, b) {
  try {
    return fs.readFileSync(a).equals(fs.readFileSync(b));
  } catch {
    return false;
  }
}

function copyFile(src, dest) {
  if (sameContent(src, dest)) return;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.copyFileSync(src, dest);
      return;
    } catch (err) {
      const busy = err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES';
      if (!busy) throw err;
      if (attempt === 5) {
        console.warn(
          `[sync-config] Could not update ${dest} (${err.code}). Another program is using it. ` +
            'Stop the dev server and run the sync again if the branding looks out of date.'
        );
        return;
      }
      sleep(200 * attempt);
    }
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

function hexToHsl(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function generateThemeCss(config) {
  const theme = config.theme || {};
  const primary = theme.primaryColor || '#e16c39';
  const [h, s, l] = hexToHsl(primary);

  const hoverL = Math.max(0, l - 8);
  const activeL = Math.max(0, l - 15);
  const strongL = Math.max(0, l - 12);

  return `/* Auto-generated from config/app.json by sync-config.js. Do not edit directly. */
:root {
  --color-brand: hsl(${h}, ${s}%, ${l}%);
  --color-brand-hover: hsl(${h}, ${s}%, ${hoverL}%);
  --color-brand-active: hsl(${h}, ${s}%, ${activeL}%);
  --color-brand-strong: hsl(${h}, ${s}%, ${strongL}%);
  --color-brand-tint: hsl(${h}, ${s}%, 96%);
  --color-brand-tint-2: hsl(${h}, ${s}%, 92%);
  --color-brand-border: hsl(${h}, ${s}%, 85%);

  --orange-600: var(--color-brand);
  --orange-700: var(--color-brand-hover);
  --orange-800: var(--color-brand-active);
  --orange-100: var(--color-brand-tint);
  --orange-200: var(--color-brand-tint-2);
  --orange-300: var(--color-brand-border);
}
`;
}

function syncHtmlFiles(config) {
  const brand = config.brand || {};
  const appName = brand.appName || 'TradeNows';
  const brandPrefix = brand.brandPrefix || (brand.appName ? brand.appName : 'Trade');
  const accentText = brand.accentText !== undefined ? brand.accentText : (brand.appName ? '' : 'Nows');
  const supportEmail = brand.supportEmail || 'support@tradenows.com';

  const pagesDir = path.join(root, 'nextjs-app', 'public', 'pages');
  if (fs.existsSync(pagesDir)) {
    const htmlFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html'));
    for (const file of htmlFiles) {
      const fullPath = path.join(pagesDir, file);
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      content = content.replace(/<title>([^—<]+)—\s*[^<]+<\/title>/g, `<title>$1— ${appName}</title>`);
      content = content.replace(/<span\s+data-app-name>[^<]*<\/span>/g, `<span data-app-name>${appName}</span>`);
      
      const brandInner = accentText ? `${brandPrefix}<span>${accentText}</span>` : brandPrefix;
      content = content.replace(/(<span[^>]*\bdata-brand\b[^>]*>)(?:(?!<\/span>).)*<\/span>/g, `$1${brandInner}</span>`);
      content = content.replace(/(<a[^>]*\bdata-support-email\b[^>]*)href="[^"]*"([^>]*)>[^<]*<\/a>/g, `$1href="mailto:${supportEmail}"$2>${supportEmail}</a>`);

      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  }

  const tradexIndex = path.join(root, 'tradex-app', 'index.html');
  if (fs.existsSync(tradexIndex)) {
    let content = fs.readFileSync(tradexIndex, 'utf-8');
    content = content.replace(/<title>[^<]+<\/title>/, `<title>${appName} — Trade Smarter</title>`);
    fs.writeFileSync(tradexIndex, content, 'utf-8');
  }
}

function syncEnvFile(config) {
  const brand = config.brand || {};
  const urls = config.urls || {};
  const appName = brand.appName || 'TradeNows';
  const supportEmail = brand.supportEmail || 'support@tradenows.com';
  const legalName = brand.legalName || appName;

  // Derive allowed CORS origins from portalUrl, landingUrl and local development defaults
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ]);

  for (const urlStr of [urls.portalUrl, urls.landingUrl]) {
    if (!urlStr) continue;
    try {
      const u = new URL(urlStr);
      origins.add(u.origin);
      if (!u.hostname.includes('localhost') && !u.hostname.includes('127.0.0.1')) {
        if (!u.hostname.startsWith('www.')) {
          origins.add(`${u.protocol}//www.${u.hostname}${u.port ? ':' + u.port : ''}`);
        }
        const parts = u.hostname.split('.');
        if (parts.length >= 2) {
          const rootDomain = parts.slice(-2).join('.');
          origins.add(`${u.protocol}//${rootDomain}`);
          origins.add(`${u.protocol}//*.${rootDomain}`);
        }
      }
    } catch {}
  }
  const corsValue = Array.from(origins).join(',');

  let envContent = '';
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf-8');
  } else if (fs.existsSync(envExampleFile)) {
    envContent = fs.readFileSync(envExampleFile, 'utf-8');
  }

  const updates = {
    APP_NAME: `"${appName}"`,
    SUPPORT_EMAIL: `"${supportEmail}"`,
    LEGAL_NAME: `"${legalName}"`,
    CORS_ALLOWED_ORIGIN_PATTERNS: `"${corsValue}"`,
  };

  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${val}`);
    } else {
      envContent = (envContent.trim() ? envContent.trim() + '\n' : '') + `${key}=${val}\n`;
    }
  }

  fs.writeFileSync(envFile, envContent, 'utf-8');
  console.log(`[sync-config] Synchronized branding and CORS origins into .env`);
}

// 1. Load app.json
let appConfigData = null;
if (fs.existsSync(configSrc)) {
  try {
    appConfigData = JSON.parse(fs.readFileSync(configSrc, 'utf-8'));
  } catch (e) {
    console.warn('[sync-config] Could not parse config/app.json:', e);
  }
}

if (!appConfigData) {
  console.error('[sync-config] ERROR: config/app.json missing or invalid JSON');
  process.exit(1);
}

// 3. Sync to target folders
targets.forEach((dest) => {
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'app.json'), JSON.stringify(appConfigData, null, 2), 'utf-8');
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, dest);
  }
  const themeCss = generateThemeCss(appConfigData);
  fs.writeFileSync(path.join(dest, 'theme.css'), themeCss, 'utf-8');
  console.log(`[sync-config] Synced bundle to ${dest}`);
});

// 4. Sync HTML files
syncHtmlFiles(appConfigData);
console.log('[sync-config] Synced dynamic branding placeholders into HTML pages');

// 5. Sync .env backend variables
syncEnvFile(appConfigData);
