#!/usr/bin/env node
/**
 * scripts/doctor.js
 * Pre-flight Platform Configuration & Consistency Validator.
 * Verifies synchronization between config/app.json, config/assets, and .env.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(ROOT_DIR, 'config', 'app.json');
const ASSETS_DIR = path.join(ROOT_DIR, 'config', 'assets');
const ENV_FILE = path.join(ROOT_DIR, '.env');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const issues = [];
const warnings = [];
const passes = [];

function pass(msg) {
  passes.push(msg);
  console.log(`  ${colors.green}✔ PASS${colors.reset}  ${msg}`);
}

function fail(field, msg, remedy) {
  issues.push({ field, msg, remedy });
  console.log(`  ${colors.red}✖ FAIL${colors.reset}  ${colors.bold}${field}${colors.reset}: ${msg}`);
}

function warn(field, msg) {
  warnings.push({ field, msg });
  console.log(`  ${colors.yellow}▲ WARN${colors.reset}  ${field}: ${msg}`);
}

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function getOrigin(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.origin;
  } catch {
    return urlStr;
  }
}

console.log(`\n${colors.cyan}${colors.bold}=== Pre-Flight Configuration Doctor ===${colors.reset}\n`);

// 1. Validate config/app.json
let appConfig = null;
if (!fs.existsSync(CONFIG_FILE)) {
  fail('config/app.json', 'Missing configuration file', 'Create config/app.json from config/schema.json.');
} else {
  try {
    appConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    pass('config/app.json exists and is valid JSON');
  } catch (err) {
    fail('config/app.json', `Malformed JSON: ${err.message}`, 'Fix JSON syntax in config/app.json.');
  }
}

// 2. Validate visual branding assets
const REQUIRED_ASSETS = ['logo.svg', 'favicon.svg', 'favicon.ico'];
for (const asset of REQUIRED_ASSETS) {
  const assetPath = path.join(ASSETS_DIR, asset);
  if (!fs.existsSync(assetPath)) {
    fail(`Asset: ${asset}`, `Missing required asset in config/assets/${asset}`, `Place your custom ${asset} in config/assets/`);
  } else {
    const stats = fs.statSync(assetPath);
    if (stats.size === 0) {
      fail(`Asset: ${asset}`, `File config/assets/${asset} is 0 bytes (empty)`, `Replace with valid non-empty ${asset}`);
    } else {
      pass(`Asset config/assets/${asset} is present (${stats.size} bytes)`);
    }
  }
}

// 3. Cross-service validation with .env / environment
if (appConfig) {
  const brand = appConfig.brand || {};
  const urls = appConfig.urls || {};
  const fileEnv = parseEnv(ENV_FILE);
  const effectiveEnv = fileEnv || process.env;

  const appName = brand.appName;
  const supportEmail = brand.supportEmail;
  const legalName = brand.legalName;

  if (fileEnv) {
    pass('.env file found');
  } else {
    warn('.env', 'No .env file found in project root; checking process environment variables.');
  }

  // APP_NAME check
  const envAppName = effectiveEnv.APP_NAME;
  if (envAppName) {
    if (envAppName !== appName) {
      fail(
        'APP_NAME mismatch',
        `Backend APP_NAME="${envAppName}" does not match frontend config/app.json appName="${appName}"`,
        `Set APP_NAME="${appName}" in .env or update config/app.json`
      );
    } else {
      pass(`App Name synchronized: "${appName}"`);
    }
  } else if (appName && appName !== 'TradeX') {
    fail(
      'APP_NAME missing in .env',
      `Frontend appName is "${appName}", but backend .env has no APP_NAME set (defaults to "TradeX")`,
      `Add APP_NAME="${appName}" to .env`
    );
  } else {
    pass(`App Name default: "${appName || 'TradeX'}"`);
  }

  // SUPPORT_EMAIL check
  const envEmail = effectiveEnv.SUPPORT_EMAIL;
  if (envEmail) {
    if (envEmail !== supportEmail) {
      fail(
        'SUPPORT_EMAIL mismatch',
        `Backend SUPPORT_EMAIL="${envEmail}" does not match frontend supportEmail="${supportEmail}"`,
        `Set SUPPORT_EMAIL="${supportEmail}" in .env or update config/app.json`
      );
    } else {
      pass(`Support Email synchronized: "${supportEmail}"`);
    }
  } else if (supportEmail && supportEmail !== 'support@tradenows.com') {
    fail(
      'SUPPORT_EMAIL missing in .env',
      `Frontend supportEmail is "${supportEmail}", but backend .env has no SUPPORT_EMAIL set`,
      `Add SUPPORT_EMAIL="${supportEmail}" to .env`
    );
  }

  // LEGAL_NAME check
  const envLegal = effectiveEnv.LEGAL_NAME;
  if (envLegal && legalName && envLegal !== legalName) {
    fail(
      'LEGAL_NAME mismatch',
      `Backend LEGAL_NAME="${envLegal}" does not match frontend legalName="${legalName}"`,
      `Set LEGAL_NAME="${legalName}" in .env`
    );
  } else if (legalName) {
    pass(`Legal Name checked: "${legalName}"`);
  }

  // CORS checks
  const corsPatterns = effectiveEnv.CORS_ALLOWED_ORIGIN_PATTERNS || '';
  const corsList = corsPatterns.split(',').map((s) => s.trim()).filter(Boolean);

  function checkOriginAllowed(urlKey, urlValue) {
    if (!urlValue) return;
    const origin = getOrigin(urlValue);
    if (!origin.startsWith('http://') && !origin.startsWith('https://')) return;

    // Check if origin matches any CORS pattern (exact or wildcard)
    const isAllowed = corsList.some((pat) => {
      if (pat === origin) return true;
      if (pat.includes('*')) {
        const regexStr = '^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
        return new RegExp(regexStr).test(origin);
      }
      return false;
    });

    if (corsPatterns && !isAllowed) {
      fail(
        `CORS origin missing for ${urlKey}`,
        `Origin "${origin}" from urls.${urlKey} is not allowed by CORS_ALLOWED_ORIGIN_PATTERNS`,
        `Append "${origin}" to CORS_ALLOWED_ORIGIN_PATTERNS in .env`
      );
    } else {
      pass(`CORS origin allowed for ${urlKey}: "${origin}"`);
    }
  }

  checkOriginAllowed('portalUrl', urls.portalUrl);
  checkOriginAllowed('landingUrl', urls.landingUrl);
}

// 4. Final Verdict
console.log('');
if (issues.length > 0) {
  console.log(`${colors.red}${colors.bold}✖ DOCTOR CHECK FAILED with ${issues.length} error(s):${colors.reset}`);
  issues.forEach((iss, idx) => {
    console.log(`\n  ${idx + 1}) ${colors.bold}${iss.field}${colors.reset}`);
    console.log(`     Reason: ${iss.msg}`);
    console.log(`     ${colors.cyan}Action: ${iss.remedy}${colors.reset}`);
  });
  console.log(`\n${colors.red}Build aborted. Fix the discrepancies above before proceeding.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}✔ ALL CHECKS PASSED. Platform configuration is consistent across services.${colors.reset}\n`);
  process.exit(0);
}
