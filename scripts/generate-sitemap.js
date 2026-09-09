#!/usr/bin/env node
/**
 * Atlas Sitemap Generator
 * ─────────────────────────────────────────────────────────────
 * Dynamically builds a standard-compliant XML sitemap for Atlas
 * based on canonical public routes, clean URLs, and real file modification times.
 *
 * Usage:
 *   node scripts/generate-sitemap.js          # Generate & write public/sitemap.xml
 *   node scripts/generate-sitemap.js --check  # Verify public/sitemap.xml is up-to-date
 *   node scripts/generate-sitemap.js --dry-run# Print XML without writing
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BASE_URL = 'https://atlas.vylex.co.za';
const BASE_URL = (process.env.SITE_URL || process.env.APP_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Canonical public routes to include in the index
const ROUTES = [
  {
    path: '/',
    sourceFile: 'index.html',
    changefreq: 'daily',
    priority: '1.0',
    title: 'Atlas Interactive AI Workspace (Home)'
  },
  {
    path: '/docs',
    sourceFile: 'docs.html',
    changefreq: 'weekly',
    priority: '0.9',
    title: 'Technical Documentation & Capabilities'
  },
  {
    path: '/about',
    sourceFile: 'about.html',
    changefreq: 'weekly',
    priority: '0.8',
    title: 'About Atlas & Vylex Technologies'
  },
  {
    path: '/atlas',
    sourceFile: 'atlas.html',
    changefreq: 'weekly',
    priority: '0.7',
    title: 'Interactive Reasoning Launcher & Environment'
  },
  {
    path: '/privacy',
    sourceFile: 'privacy.html',
    changefreq: 'monthly',
    priority: '0.5',
    title: 'Privacy Policy & API Data Practices'
  },
  {
    path: '/terms',
    sourceFile: 'terms.html',
    changefreq: 'monthly',
    priority: '0.5',
    title: 'Terms of Service & Software License'
  }
];

/**
 * Format a Date object to YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the last modified date for a source file in public/
 */
function getFileLastMod(filename) {
  try {
    const fullPath = path.join(PUBLIC_DIR, filename);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return formatDate(stats.mtime);
    }
  } catch (err) {
    // Fallback to today's date if file stat fails
  }
  return formatDate(new Date());
}

/**
 * Generate standard XML sitemap
 */
function generateSitemapXml(baseUrl = BASE_URL) {
  const urlEntries = ROUTES.map(route => {
    const loc = route.path === '/' ? `${baseUrl}/` : `${baseUrl}${route.path}`;
    const lastmod = getFileLastMod(route.sourceFile);

    return [
      `  <!-- ${route.title} -->`,
      `  <url>`,
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      `  </url>`
    ].join('\n');
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
    `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9`,
    `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`,
    urlEntries.join('\n\n'),
    `</urlset>`,
    ``
  ].join('\n');
}

/**
 * CLI runner
 */
function runCli() {
  const args = process.argv.slice(2);
  const isCheck = args.includes('--check');
  const isDryRun = args.includes('--dry-run');

  const generatedXml = generateSitemapXml();

  if (isDryRun) {
    process.stdout.write(generatedXml);
    return;
  }

  if (isCheck) {
    if (!fs.existsSync(SITEMAP_PATH)) {
      console.error(`❌ Sitemap check failed: ${SITEMAP_PATH} does not exist.`);
      process.exit(1);
    }
    const currentXml = fs.readFileSync(SITEMAP_PATH, 'utf8');
    if (currentXml.trim() !== generatedXml.trim()) {
      console.error(`❌ Sitemap is out of date. Run 'npm run sitemap' to regenerate.`);
      process.exit(1);
    }
    console.log(`✅ Sitemap is up to date (${ROUTES.length} routes).`);
    return;
  }

  fs.writeFileSync(SITEMAP_PATH, generatedXml, 'utf8');
  console.log(`✨ Successfully generated sitemap at ${SITEMAP_PATH}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Indexed Routes (${ROUTES.length}):`);
  ROUTES.forEach(r => console.log(`     - ${r.path} (${r.priority}) [${r.sourceFile}]`));
}

if (require.main === module) {
  runCli();
}

module.exports = {
  ROUTES,
  DEFAULT_BASE_URL,
  generateSitemapXml,
  formatDate,
  getFileLastMod
};
