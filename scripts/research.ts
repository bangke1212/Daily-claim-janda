// Research-only script

import 'dotenv/config';
import { researchAirdrops } from '../lib/research-agent';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Daily Claim Janda - Research Agent\n');
  if (!process.env.IAMHC_API_KEY || process.env.IAMHC_API_KEY === 'your_iamhc_api_key_here') {
    console.error('Set IAMHC_API_KEY in .env');
    process.exit(1);
  }
  const result = await researchAirdrops();
  console.log(`\nFound ${result.opportunities.length} airdrops:\n`);
  for (const a of result.opportunities) {
    const icons: Record<string, string> = { active: 'ACTIVE', upcoming: 'SOON', ended: 'ENDED' };
    console.log(`${icons[a.status] || '?'} ${a.name} (${a.chain.toUpperCase()})`);
    console.log(`   Contract: ${a.contract} | Method: ${a.method} | Risk: ${a.risk}`);
    if (a.deadline) console.log(`   Deadline: ${a.deadline}`);
    console.log(`   URL: ${a.url}\n`);
  }
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const fn = `research-${new Date().toISOString().slice(0,10)}.json`;
  fs.writeFileSync(path.join(dataDir, fn), JSON.stringify(result, null, 2));
  console.log(`Saved: data/${fn}`);
}

main().catch(console.error);
