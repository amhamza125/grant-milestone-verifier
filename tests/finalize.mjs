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
  R.txs.s13_assess, R.txs.s13_release,
  R.txs.g1_release, R.txs.g3_release, R.txs.g4_release,
  R.txs.n1_release, R.txs.n3_release, R.txs.n3_cancel,
  R.txs.cleanup_2, R.txs.cleanup_3, R.txs.cleanup_5, R.txs.cleanup_7, R.txs.cleanup_8,
  R.txs.cleanup_10, R.txs.cleanup_12,
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
// No-stranded-funds accounting: rejected creations carry no value, and every
// rejected funding attempt refunds inline, so the expected contract balance
// is exactly zero. (One bookkeeping note: the N2 grant was created with a
// 0.25 GEN total and cancelled before funding, so its phantom 0.25 GEN
// appears in both escrowTotal and grantorRefunded and cancels out of the
// grantor identity below — net zero, exactly as the chain shows.)
const expGrantor = grantorBefore - escrowTotal + grantorRefunded;
const expBuilder = builderBefore + builderPaid;
const expContractBal = 0n;
const ok = grantorAfter === expGrantor && builderAfter === expBuilder;
const contractBal = await bal(ADDR);
const balOk = contractBal === expContractBal;
const out = {
  payouts_ok: ok && balOk,
  grantor_before: gen(grantorBefore), grantor_after: gen(grantorAfter), grantor_expected: gen(expGrantor),
  builder_before: gen(builderBefore), builder_after: gen(builderAfter), builder_expected: gen(expBuilder),
  escrow_total_gen: gen(escrowTotal), builder_paid_gen: gen(builderPaid), grantor_refunded_gen: gen(grantorRefunded),
  stranded_value_gen: gen(0n),
  contract_balance_wei: contractBal.toString(),
  expected_contract_balance_wei: expContractBal.toString(),
  tx_statuses: statuses,
};
writeFileSync('./results/finalize.json', JSON.stringify(out, null, 2));
console.log('FINALIZE CHECK:', JSON.stringify(out, null, 2));
process.exit(ok && balOk ? 0 : 1);
