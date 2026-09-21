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

targets.forEach((dest) => {
  fs.mkdirSync(dest, { recursive: true });
  if (fs.existsSync(configSrc)) {
    fs.copyFileSync(configSrc, path.join(dest, 'app.json'));
  }
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, dest, { recursive: true });
  }
  console.log(`[sync-config] Synced branding bundle to ${dest}`);
});
