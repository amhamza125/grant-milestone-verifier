// Grant Milestone Verifier finalization + payout verification.
// Run from tests/ AFTER run.mjs:  node finalize.mjs
// Reads ./results/results.json, waits for the payout txs to FINALIZE,
// then checks every wei moved exactly as the contract recorded.
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { readFileSync, writeFileSync } from 'fs';

const R = JSON.parse(readFileSync('./results/results.json'));
const ADDR = R.contract;
const ro = createClient({ chain: studionet });
const bal = async (a) => { const r = await fetch('https://studio.genlayer.com/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [a, 'latest'] }) }); return BigInt((await r.json()).result); };
const gen = (wei) => (Number(wei) / 1e18).toFixed(4);
const stName = (t) => (t && (t.statusName || String(t.status))) || 'NONE';

// Wait for every payout-affecting tx to finalize
const watch = [
  R.txs.s1_release0, R.txs.s1_release1, R.txs.s1_release2,
  R.txs.s2_release, R.txs.s6_release, R.txs.s6_cancel, R.txs.s10_release,
  R.txs.cleanup_2, R.txs.cleanup_3, R.txs.cleanup_5, R.txs.cleanup_7,
].filter(Boolean);
const deadline = Date.now() + 25 * 60 * 1000;
let statuses = {};
while (Date.now() < deadline) {
  let allFin = true;
  for (const h of watch) {
    if (statuses[h] === 'FINALIZED' || statuses[h] === '7') continue;
    try { const t = await ro.getTransaction({ hash: h }); statuses[h] = stName(t); } catch { statuses[h] = 'ERR'; }
    if (statuses[h] !== 'FINALIZED' && statuses[h] !== '7') allFin = false;
  }
  console.log('statuses:', JSON.stringify(statuses));
  if (allFin) break;
  await new Promise(r => setTimeout(r, 20000));
}

// Expected deltas derived from on-chain grant records
let grantCount = 0;
try {
  const ps = JSON.parse(await ro.readContract({ address: ADDR, functionName: 'get_protocol_overview', args: [] }));
  grantCount = parseInt(ps.grant_count, 10);
} catch { /* ignore */ }
let escrowTotal = 0n, builderPaid = 0n, grantorRefunded = 0n;
for (let gid = 0; gid < grantCount; gid++) {
  const g = JSON.parse(await ro.readContract({ address: ADDR, functionName: 'get_grant', args: [gid] }));
  escrowTotal += BigInt(g.total_escrow_wei);
  for (const m of g.milestones) builderPaid += BigInt(m.paid_wei || '0');
  if (g.status === 'CANCELLED') grantorRefunded += BigInt(g.total_escrow_wei) - BigInt(g.released_wei);
}
const grantorAfter = await bal(R.grantor); const builderAfter = await bal(R.builder);
const grantorBefore = BigInt(R.balances.grantor_start); const builderBefore = BigInt(R.balances.builder_start);
// S7 sent 1.0 GEN with 0.5 GEN of milestones and reverted with ESCROW_MISMATCH.
// GenVM rolls back storage on UserError, but the EVM msg.value stays in the
// contract balance — so it left the grantor's wallet without creating a grant.
const s7RevertedValue = R.txs.s7_create ? (10n ** 18n) : 0n;
const expGrantor = grantorBefore - escrowTotal - s7RevertedValue + grantorRefunded;
const expBuilder = builderBefore + builderPaid;
const expContractBal = s7RevertedValue;
const ok = grantorAfter === expGrantor && builderAfter === expBuilder;
const contractBal = await bal(ADDR);
const balOk = contractBal === expContractBal;
const out = {
  payouts_ok: ok && balOk,
  grantor_before: gen(grantorBefore), grantor_after: gen(grantorAfter), grantor_expected: gen(expGrantor),
  builder_before: gen(builderBefore), builder_after: gen(builderAfter), builder_expected: gen(expBuilder),
  escrow_total_gen: gen(escrowTotal), builder_paid_gen: gen(builderPaid), grantor_refunded_gen: gen(grantorRefunded),
  s7_reverted_value_gen: gen(s7RevertedValue),
  contract_balance_wei: contractBal.toString(),
  expected_contract_balance_wei: expContractBal.toString(),
  tx_statuses: statuses,
};
writeFileSync('./results/finalize.json', JSON.stringify(out, null, 2));
console.log('FINALIZE CHECK:', JSON.stringify(out, null, 2));
process.exit(ok && balOk ? 0 : 1);
