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

// Copy one file. Skips when the destination already has identical content, and
// retries when Windows reports the destination as busy (a running dev server,
// editor, antivirus or cloud-sync client can hold the file open).
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

targets.forEach((dest) => {
  fs.mkdirSync(dest, { recursive: true });
  if (fs.existsSync(configSrc)) {
    copyFile(configSrc, path.join(dest, 'app.json'));
  }
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, dest);
  }
  console.log(`[sync-config] Synced branding bundle to ${dest}`);
});
