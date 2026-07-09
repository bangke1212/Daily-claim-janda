// Core: Multi-chain EVM wallet & contract interaction engine

import { ethers, Wallet, JsonRpcProvider, Contract, TransactionRequest } from 'ethers';

// ============== CHAIN CONFIG ==============

export interface ChainConfig {
  name: string;
  chainId: number;
  rpc: string;
  symbol: string;
  explorer: string;
}

export const CHAINS: Record<string, ChainConfig> = {
  eth: {
    name: 'Ethereum', chainId: 1,
    rpc: process.env.RPC_ETH_MAINNET || 'https://eth.llamarpc.com',
    symbol: 'ETH', explorer: 'https://etherscan.io',
  },
  bsc: {
    name: 'BNB Smart Chain', chainId: 56,
    rpc: process.env.RPC_BSC_MAINNET || 'https://bsc-dataseed.binance.org',
    symbol: 'BNB', explorer: 'https://bscscan.com',
  },
  arbitrum: {
    name: 'Arbitrum One', chainId: 42161,
    rpc: process.env.RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH', explorer: 'https://arbiscan.io',
  },
  base: {
    name: 'Base', chainId: 8453,
    rpc: process.env.RPC_BASE || 'https://mainnet.base.org',
    symbol: 'ETH', explorer: 'https://basescan.org',
  },
  polygon: {
    name: 'Polygon', chainId: 137,
    rpc: process.env.RPC_POLYGON || 'https://polygon-rpc.com',
    symbol: 'MATIC', explorer: 'https://polygonscan.com',
  },
};

// ============== WALLET MANAGER ==============

export function getWallets(): Wallet[] {
  const keys = (process.env.PRIVATE_KEYS || '').split(',').map(k => k.trim()).filter(k => k.length === 66 && k.startsWith('0x'));
  if (keys.length === 0) throw new Error('No valid private keys found in PRIVATE_KEYS env var');
  return keys.map(k => new Wallet(k));
}

export function getProvider(chain: keyof typeof CHAINS): JsonRpcProvider {
  return new JsonRpcProvider(CHAINS[chain].rpc, CHAINS[chain].chainId);
}

export function getSigner(wallet: Wallet, chain: keyof typeof CHAINS): Wallet {
  return wallet.connect(getProvider(chain));
}

// ============== GAS OPTIMIZER ==============

export async function getOptimalGas(provider: JsonRpcProvider): Promise<{ gasPrice: bigint; maxPriorityFeePerGas: bigint }> {
  const feeData = await provider.getFeeData();
  const maxGas = ethers.parseUnits(process.env.MAX_GAS_GWEI || '50', 'gwei');
  const multiplier = parseFloat(process.env.GAS_MULTIPLIER || '1.1');
  let gasPrice = (feeData.gasPrice || ethers.parseUnits('20', 'gwei')) * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
  if (gasPrice > maxGas) gasPrice = maxGas;
  const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas || ethers.parseUnits('1', 'gwei')) * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
  return { gasPrice, maxPriorityFeePerGas };
}

// ============== CLAIM ENGINE ==============

export interface ClaimConfig {
  chain: keyof typeof CHAINS;
  contractAddress: string;
  method: string;
  abi: string[];
  args?: unknown[];
  value?: string;
  gasLimit?: number;
}

export interface ClaimResult {
  wallet: string; chain: string; contract: string; method: string;
  txHash: string | null; status: 'success' | 'failed' | 'skipped';
  error?: string; timestamp: string;
}

export async function executeClaim(
  privateKey: string, chainKey: keyof typeof CHAINS, config: ClaimConfig
): Promise<ClaimResult> {
  const wallet = new Wallet(privateKey);
  const provider = getProvider(chainKey);
  const signer = wallet.connect(provider);
  const chain = CHAINS[chainKey];
  const baseResult = {
    wallet: wallet.address, chain: chain.name,
    contract: config.contractAddress, method: config.method,
    timestamp: new Date().toISOString(),
  };

  try {
    const balance = await provider.getBalance(wallet.address);
    const estimatedCost = ethers.parseUnits('0.005', 'ether');
    if (balance < estimatedCost) {
      return { ...baseResult, txHash: null, status: 'skipped',
        error: `Insufficient ${chain.symbol}: ${ethers.formatEther(balance)}` };
    }

    const contract = new Contract(config.contractAddress, config.abi, signer);
    const gas = await getOptimalGas(provider);
    const tx: TransactionRequest = {
      to: config.contractAddress,
      data: contract.interface.encodeFunctionData(config.method, config.args || []),
      gasPrice: gas.gasPrice, gasLimit: config.gasLimit || 300000,
    };
    if (config.value) tx.value = ethers.parseEther(config.value);

    try { await provider.call({ ...tx, from: wallet.address }); }
    catch (simErr: unknown) {
      const msg = simErr instanceof Error ? simErr.message : String(simErr);
      if (msg.includes('execution reverted'))
        return { ...baseResult, txHash: null, status: 'skipped', error: `Reverted: ${msg.slice(0,100)}` };
    }

    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    return { ...baseResult, txHash: receipt?.hash || response.hash, status: receipt?.status === 1 ? 'success' : 'failed' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ...baseResult, txHash: null, status: 'failed', error: msg.slice(0,200) };
  }
}

export async function claimAll(privateKeys: string[], claims: ClaimConfig[]): Promise<ClaimResult[]> {
  const results: ClaimResult[] = [];
  for (const pk of privateKeys) {
    for (const claim of claims) {
      console.log(`[CLAIM] ${pk.slice(0,10)}... -> ${claim.method} on ${claim.chain}`);
      const result = await executeClaim(pk, claim.chain, claim);
      results.push(result);
      console.log(`[RESULT] ${result.status.toUpperCase()}: ${result.txHash || result.error}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return results;
}

export function generateClaimSummary(results: ClaimResult[]): string {
  const success = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  return [
    `=== Daily Claim Summary ===`,
    `Total: ${results.length} | OK ${success} | FAIL ${failed} | SKIP ${skipped}`,
    ...results.map(r => `${r.status==='success'?'OK':r.status==='failed'?'FAIL':'SKIP'} ${r.chain} | ${r.wallet.slice(0,8)}... | ${r.method} | ${r.txHash||r.error}`),
  ].join('\n');
}
