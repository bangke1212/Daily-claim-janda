// LLM Research Agent — uses IAMHC API to discover airdrops

interface AirdropOpportunity {
  name: string; chain: string; contract: string; method: string;
  status: 'active' | 'upcoming' | 'ended'; reward: string;
  requirements: string[]; risk: 'low' | 'medium' | 'high';
  url: string; deadline?: string;
}

interface ResearchResult {
  opportunities: AirdropOpportunity[];
  analysis: string; timestamp: string;
}

const IAMHC_BASE_URL = process.env.IAMHC_BASE_URL || 'https://api.iamhc.cn';
const IAMHC_API_KEY = process.env.IAMHC_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'Qwen3.5-397B-A17B';

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(`${IAMHC_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${IAMHC_API_KEY}` },
    body: JSON.stringify({ model: AI_MODEL, messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], temperature: 0.3, max_tokens: 4000 }),
  });
  if (!response.ok) { const err = await response.text(); throw new Error(`IAMHC API error (${response.status}): ${err}`); }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

const RESEARCH_SYSTEM_PROMPT= `You are a crypto airdrop research agent. Find ACTIVE and UPCOMING airdrops on EVM chains (Ethereum, BSC, Arbitrum, Base, Polygon).
For each airdrop provide: name, chain, contract address, claim method, status, reward estimate, requirements, risk level, URL, deadline.
Only return REAL verifiable airdrops. Format as valid JSON array.`;

export async function researchAirdrops(): Promise<ResearchResult> {
  console.log('[RESEARCH] Querying IAMHC LLM...');
  const userMessage = `Find active and upcoming EVM airdrops as of ${new Date().toISOString().slice(0,10)}. Focus on Ethereum, Arbitrum, Base, BSC, Polygon. Return 5-10 opportunities.`;
  try {
    const raw = await callLLM(RESEARCH_SYSTEM_PROMPT, userMessage);
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { opportunities: [], analysis: raw, timestamp: new Date().toISOString() };
    const opportunities: AirdropOpportunity[] = JSON.parse(jsonMatch[0]);
    console.log(`[RESEARCH] Found ${opportunities.length} airdrops`);
    return { opportunities, analysis: raw, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('[RESEARCH] Failed:', err);
    return { opportunities: [], analysis: '', timestamp: new Date().toISOString() };
  }
}

export type { AirdropOpportunity, ResearchResult };
