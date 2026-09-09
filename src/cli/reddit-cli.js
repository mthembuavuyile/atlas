#!/usr/bin/env node
/**
 * Atlas Reddit & Community Discussions CLI
 * ─────────────────────────────────────────────────────────────
 * Offline / terminal search across single or multiple subreddits
 * with balanced post distribution.
 *
 * Usage:
 *   node src/cli/reddit-cli.js java,bitcoin,news,python --limit 10
 *   npm run reddit -- java,bitcoin,news,python --limit 10
 */

const widgetService = require('../services/widget.service');

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  amber: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

async function main() {
  const args = process.argv.slice(2);
  let subreddits = [];
  let limit = 10;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--limit' || arg === '-n' || arg === '-l') {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = parsed;
        i++;
      }
    } else if (arg.startsWith('--limit=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (!isNaN(parsed) && parsed > 0) limit = parsed;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      subreddits.push(arg);
    }
  }

  const query = subreddits.join(' ').trim() || 'javaprogramming, bitcoin, news, python';

  console.log(`\n${ANSI.magenta}${ANSI.bold}Atlas | Community Discussion Search${ANSI.reset}`);
  console.log(`${ANSI.gray}───────────────────────────────────────────────────────${ANSI.reset}`);
  console.log(`${ANSI.cyan}🔍 Query Communities:${ANSI.reset} ${query}`);
  console.log(`${ANSI.cyan}📊 Requested Limit:${ANSI.reset}   ${limit} posts\n`);

  const startTime = Date.now();
  const res = await widgetService.getRedditPosts(query, limit);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (res.data?.error || !res.data?.posts || res.data.posts.length === 0) {
    console.error(`${ANSI.red}❌ Error: ${res.data?.error || 'No discussions found.'}${ANSI.reset}\n`);
    process.exit(1);
  }

  const posts = res.data.posts;
  console.log(`${ANSI.green}✓ Retrieved ${posts.length} posts via ${res.data.source || 'Reddit'} in ${elapsed}s${ANSI.reset}`);
  console.log(`${ANSI.gray}───────────────────────────────────────────────────────${ANSI.reset}\n`);

  posts.forEach((p, idx) => {
    const num = (idx + 1).toString().padStart(2, ' ');
    const subBadge = `${ANSI.amber}[${p.subreddit || 'community'}]${ANSI.reset}`;
    const scoreBadge = `${ANSI.cyan}▲ ${p.ups || 0}${ANSI.reset}`;
    const commentsBadge = `${ANSI.gray}(${p.comments || 0} comments)${ANSI.reset}`;

    console.log(`${ANSI.bold}${num}.${ANSI.reset} ${subBadge} ${scoreBadge} ${commentsBadge}`);
    console.log(`    ${ANSI.bold}${p.title}${ANSI.reset}`);
    console.log(`    ${ANSI.dim}Author:${ANSI.reset} ${p.author || 'unknown'} ${ANSI.dim}| Date:${ANSI.reset} ${p.created_at || 'Recent'}`);
    console.log(`    ${ANSI.blue}${p.url}${ANSI.reset}\n`);
  });

  // Summary breakdown
  const counts = {};
  posts.forEach(p => {
    const s = p.subreddit || 'Other';
    counts[s] = (counts[s] || 0) + 1;
  });

  console.log(`${ANSI.gray}───────────────────────────────────────────────────────${ANSI.reset}`);
  console.log(`${ANSI.bold}Distribution Summary:${ANSI.reset}`);
  for (const [sub, count] of Object.entries(counts)) {
    console.log(`  • ${sub}: ${ANSI.green}${count}${ANSI.reset} post(s)`);
  }
  console.log(`${ANSI.gray}Total: ${posts.length} posts evenly balanced across ${Object.keys(counts).length} community/communities.${ANSI.reset}\n`);
}

function printUsage() {
  console.log(`
Usage:
  node src/cli/reddit-cli.js [subreddits] [options]
  npm run reddit -- [subreddits] [options]

Arguments:
  subreddits    Comma, plus, or space separated subreddit names
                (e.g. "java, bitcoin, news, python" or "java+bitcoin")

Options:
  --limit, -n   Total number of posts to retrieve (default: 10)
  --help, -h    Display this help message

Examples:
  node src/cli/reddit-cli.js java,bitcoin,news,python --limit 12
  npm run reddit -- technology,science -n 6
`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}

module.exports = { main };
