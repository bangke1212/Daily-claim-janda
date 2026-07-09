// Claim orchestration script

import 'dotenv/config';
import { getWallets, claimAll, generateClaimSummary, ClaimConfig, CHAINS } from '../lib/claim-engine';
import { researchAirdrops, AirdropOpportunity } from '../lib/research-agent';
import * as fs from 'fs';
import * as path from 'path';

const CLAIM_ABI = [
  'function claim() external',
  'function claimAirdrop() external',
  'function harvest() external',
  'function getReward() external',
  'function claimRewards() external',
  'function claim(address account) external',
  'function claim(uint256 amount, bytes32[] proof) external',
];

const STATIC_CLAIMS: ClaimConfig[] = [];

async function main() {
  console.log('Daily Claim Janda - Multi-wallet EVM airdrop auto-claim\n');

  let wallets: string[];
  try {
    wallets = getWallets().map(w => w.privateKey);
    console.log(`[WALLETS] Loaded ${wallets.length} wallet(s)`);
  } catch (err) {
    console.error('[ERROR] No wallets configured. Set PRIVATE_KEYS in .env');
    process.exit(1);
  }

  let dynamicClaims: ClaimConfig[] = [];
  if (process.env.IAMHC_API_KEY && process.env.IAMHC_API_KEY !== 'your_iamhc_api_key_here') {
    try {
      const research = await researchAirdrops();
      console.log(`[RESEARCH] Found ${research.opportunities.length} airdrops`);
      dynamicClaims = research.opportunities
        .filter(a => a.status === 'active')
        .map((a: AirdropOpportunity) => ({
          chain: (a.chain.toLowerCase() as keyof typeof CHAINS) || 'eth',
          contractAddress: a.contract, method: a.method || 'claim', abi: CLAIM_ABI,
        }));
      const reportDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
      fs.writeFileSync(path.join(reportDir, `research-${new Date().toISOString().slice(0,10)}.json`), JSON.stringify(research, null, 2));
    } catch (err) { console.error('[RESEARCH] Failed:', err); }
  }

  const allClaims = [...STATIC_CLAIMS, ...dynamicClaims];
  if (allClaims.length === 0) {
    console.log('[SKIP] No claims. Add known contracts or configure IAMHC_API_KEY.');
    process.exit(0);
  }
  console.log(`[CLAIMS] ${allClaims.length} claim(s) to attempt\n`);
  console.log('CLAIMING...\n');
  const results = await claimAll(wallets, allClaims);
  console.log('\n' + generateClaimSummary(results));

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, `claims-${new Date().toISOString().slice(0,10)}.json`), JSON.stringify(results, null, 2));
  console.log(`\n[SAVED] data/claims-${new Date().toISOString().slice(0,10)}.json`);
}

main().catch(console.error);
