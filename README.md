# Daily Claim Janda 🚀

**Multi-wallet EVM airdrop auto-claim bot with AI research agent.**

> 먏️ **Educational purposes only.** Use at your own risk. Never share private keys.

---

## 🔥 Features

| Feature | Description |
|---------|--------------------|
| **AI Research Agent** | Uses IAMHC LLM to find & analyze trending airdrops across EVM chains |
| **Multi-Wallet** | Claim with unlimited wallets from one config |
| **Multi-Chain** | Ethereum, BSC, Arbitrum, Base, Polygon |
| **Gas Optimizer** | Auto-detect optimal gas + max gas cap |
| **Simulation** | Dry-run claims before sending real tx |
| **Dashboard UI** | Next.js dashboard to monitor airdrops, wallets & claim history |
| **Daily Report** | Auto-save claim results to `/data/` |

---

## 🏎‏ Architecture

```
┌────────────────────┌
│  Dashboard (Next.js)  │  ← Monitor airdrops, wallets, history
┒───────────────────━
         |
┌───────╼────────────━
         ▜          
┌───────╼────────────━
│  Research Agent     │  ← IAMHC LLM → discover trending airdrops
┒  lib/research)     │
└───────────────────━
         |
┌───────╼────────────━
         ▜          
┌───────╼────────────━
│  Claim Engine       │  ← ethers.js + viem → execute claims
┒  (lib/claim-engine) │     Multi-wallet, multi-chain
└────────────────────│
         |
┌───────╼────────────│
         ▜          
┌───────╼────────────│
│ DVM Chains         │
│  ETH | BSC | ARB    │
│  BASE | POLYGON     │
└────────────────────│
```

---

## 📦 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/bangke1212/Daily-claim-janda.git
cd Daily-claim-janda
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values:
```

**Required:**
- `PRIVATE_KEYS` — comma-separated private keys
- `IAMHC_API_KEY` — for AI research agent (get at https://api.iamhc.cn/console/personal)

**Optional:**
- `AI_MODEL` — default: `Qwen3.5-397B-A17B` (PUB tier)
- `MAX_GAS_GWEI` — max gas in gwei (default: 50)

### 3. Research Airdrops (AI Agent)
```bash
npm run research
```

### 4. Run Auto-Claim
```bash
npm run claim
```

### 5. Dashboard
```bash
npm run dev
```

---

## 🦦 Supported Chains

| Chain | Chain ID | Symbol |
|-------|---------|-------|
| Ethereum | 1 | ETH |
| BNB Smart Chain | 56 | BNB |
| Arbitrum One | 42161 | ETH |
| Base | 8453 | ETH |
| Polygon | 137 | MATIC |

---

## 📱 Project Structure

```
daily-claim-janda/
├── app/                    # Next.js dashboard
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/                    # Core engine
│   ├── claim-engine.ts     # Wallet, chain, claim execution
│   └── research-agent.ts   # IAMHC LLM research agent
├── scripts/                # CLI scripts
│   ├── claim.ts            # Auto-claim script
│   └── research.ts         # Research-only script
├── data/                   # Auto-generated reports
└── .env.example
```

---

## 📡 License

MIT -- use at your own risk.

## 🙏 Credits

- `**LLM API**`: [IAMHC (幻城丹网安科技)](https://api.iamhc.cn)
- `**Web3 Library**`: [ethers.js v6](https://ethers.org/) + [viem](https://viem.sh/)
- `**Dashboard**`: [Next.js 14](https://nextjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
