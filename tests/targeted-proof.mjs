// TARGETED jury-free proof run for the GMV steward ask (no GEN retained on
// rejected creation/funding). Against an EXISTING deployment; never deploys,
// never assesses, never triggers a jury verdict.
// Run from tests/: node targeted-proof.mjs
// Keys come only from the three wallet files below (never printed/committed).
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, writeFileSync } from 'fs';

const ADDR = '0x5EFB40d03933c83db1b0649141D0ef7743b69641';
const LOGF = './results/targeted-proof-2026-10-25.log';
const GEN = 10n ** 18n;

const wA = JSON.parse(readFileSync('/home/hatch/workspace/waybill-test/test-wallet.json'));
const wB = JSON.parse(readFileSync('/home/hatch/workspace/waybill-test/carrier-wallet.json'));
const wC = JSON.parse(readFileSync('/home/hatch/workspace/cascade-fault-court/tests/wallets/outsider-wallet.json'));
const acctA = privateKeyToAccount(wA.privateKey);
const acctB = privateKeyToAccount(wB.privateKey);
const acctC = privateKeyToAccount(wC.privateKey);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isTransportError = (e) => /DOCTYPE|not valid JSON|fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|terminated| 502| 503| 504/i.test(String((e && (e.message || e)) || ''));

let logText = '';
const log = (...a) => { const line = a.map((x) => String(x)).join(' '); console.log(line); logText += line + '\n'; writeFileSync(LOGF, logText); };
const step = (name, pass, info) => log(`[${pass ? 'PASS' : 'FAIL'}] ${name} :: ${info}`);

const harden = (client) => {
  const w = client.writeContract.bind(client);
  client.writeContract = async (tx) => {
    for (let i = 0; i < 8; i++) {
      try { return await w(tx); }
      catch (e) { if (!isTransportError(e)) throw e; log(`  transport error on write, retry ${i + 1}/8 in 20s`); await sleep(20000); }
    }
    throw new Error('writeContract: RPC still failing after 8 retries');
  };
  const rc = client.readContract.bind(client);
  client.readContract = async (args) => {
    for (let i = 0; i < 8; i++) {
      try { return await rc(args); }
      catch (e) { if (!isTransportError(e)) throw e; await sleep(15000); }
    }
    throw new Error('readContract: RPC still failing after 8 retries');
  };
  return client;
};
const A = harden(createClient({ chain: studionet, account: acctA }));
const B = harden(createClient({ chain: studionet, account: acctB }));
const C = harden(createClient({ chain: studionet, account: acctC }));
const ro = harden(createClient({ chain: studionet }));

const bal = async (a) => {
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch('https://studio.genlayer.com/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [a, 'latest'] }) });
      const j = await r.json();
      if (typeof j.result === 'string') return BigInt(j.result);
      throw new Error('no result');
    } catch (e) { if (!isTransportError(e) && i > 0) throw e; log(`  transport error reading balance, retry ${i + 1}/8`); await sleep(15000); }
  }
  throw new Error('bal: RPC still failing after 8 retries');
};
const waitAcc = async (client, hash) => {
  for (let i = 0; i < 10; i++) {
    try { return await client.waitForTransactionReceipt({ hash, status: 'ACCEPTED', retries: 240, interval: 5000 }); }
    catch (e) { if (!isTransportError(e)) throw e; log(`  transport error waiting ACCEPTED, retry ${i + 1}/10 in 20s`); await sleep(20000); }
  }
  throw new Error('waitForTransactionReceipt: RPC still failing after 10 retries');
};
const stName = (t) => (t && (t.statusName || String(t.status))) || 'NONE';
// FINALIZED wait: poll getTransaction until FINALIZED (or numeric 7).
const waitFin = async (hash, label) => {
  const deadline = Date.now() + 25 * 60 * 1000;
  let last = 'NONE';
  while (Date.now() < deadline) {
    try { const t = await ro.getTransaction({ hash }); last = stName(t); }
    catch (e) { if (!isTransportError(e)) last = 'ERR'; }
    if (last === 'FINALIZED' || last === '7') { log(`  FINALIZED ${label} tx=${hash}`); return last; }
    await sleep(15000);
  }
  throw new Error(`tx ${label} ${hash} did not FINALIZE within 25 min (last=${last})`);
};
const execResult = (r) => r.consensus_data?.leader_receipt?.[0]?.execution_result;
const readGrant = async (id) => JSON.parse(await ro.readContract({ address: ADDR, functionName: 'get_grant', args: [id] }));
const overview = async () => JSON.parse(await ro.readContract({ address: ADDR, functionName: 'get_protocol_overview', args: [] }));
const ms = (spec, wei) => ({ spec, amount_wei: wei.toString() });
// send a write, wait ACCEPTED (for execResult) then FINALIZED (before any balance read)
const send = async (client, fn, args, value) => {
  const tx = { address: ADDR, functionName: fn, args };
  if (value !== undefined) tx.value = value;
  const h = await client.writeContract(tx);
  const rc = await waitAcc(client, h);
  await waitFin(h, fn);
  return { hash: h, exec: execResult(rc) };
};
const tryCreate = async (builder, title, milestonesJson) => {
  try {
    const h = await A.writeContract({ address: ADDR, functionName: 'create_grant', args: [builder, title, milestonesJson] });
    const rr = await waitAcc(A, h);
    await waitFin(h, 'create_grant-reject');
    return { rejected: execResult(rr) === 'ERROR', hash: h, exec: execResult(rr) };
  } catch (e) { return { rejected: true, hash: null, exec: 'THREW:' + String(e.message || e).slice(0, 120) }; }
};

writeFileSync(LOGF, '');
log('TARGETED PROOF RUN 2026-10-25 :: contract', ADDR);
log('grantor', acctA.address, '| builder', acctB.address, '| outsider', acctC.address);
const ov0 = await overview();
log('start overview:', JSON.stringify(ov0));

// ---------- Check 1: s7a/s7b formal re-run ----------
log('--- CHECK 1: malformed create_grant rejections ---');
const balA0 = await bal(acctA.address);
const balC0 = await bal(ADDR);
const gc0 = parseInt(ov0.grant_count, 10);
log('before: grantor_wei=', balA0.toString(), 'contract_wei=', balC0.toString(), 'grant_count=', gc0);
const badBuilders = [
  ['too short', '0x1234'],
  ['non-hex chars', '0x' + 'g'.repeat(40)],
  ['missing 0x prefix', acctB.address.slice(2)],
  ['too long', acctB.address + '00'],
  ['zero address', '0x' + '0'.repeat(40)],
];
let s7aOk = true;
for (const [label, bad] of badBuilders) {
  const r = await tryCreate(bad, 'Bad builder grant', JSON.stringify([ms('Do a thing.', GEN / 4n)]));
  log(`  s7a [${label}] rejected=${r.rejected} exec=${r.exec} tx=${r.hash}`);
  if (!r.rejected) s7aOk = false;
}
const badMilestones = [
  ['bad JSON', 'not json at all'],
  ['zero amount', JSON.stringify([ms('Do a thing.', 0n)])],
  ['empty spec', JSON.stringify([ms('', GEN / 4n)])],
  ['empty list', JSON.stringify([])],
];
let s7bOk = true;
for (const [label, bad] of badMilestones) {
  const r = await tryCreate(acctB.address, 'Bad milestones grant', bad);
  log(`  s7b [${label}] rejected=${r.rejected} exec=${r.exec} tx=${r.hash}`);
  if (!r.rejected) s7bOk = false;
}
const balA1 = await bal(acctA.address);
const balC1 = await bal(ADDR);
const gc1 = parseInt((await overview()).grant_count, 10);
step('check1_s7a_builders', s7aOk && gc1 === gc0 && balA1 === balA0 && balC1 === balC0,
  `5 malformed builders all rejected; grant_count ${gc0}->${gc1}; grantor delta=${(balA1 - balA0).toString()} wei; contract delta=${(balC1 - balC0).toString()} wei`);
step('check1_s7b_milestones', s7bOk && gc1 === gc0 && balA1 === balA0 && balC1 === balC0,
  `4 malformed milestone sets all rejected; grant_count ${gc0}->${gc1}; grantor delta=${(balA1 - balA0).toString()} wei; contract delta=${(balC1 - balC0).toString()} wei`);

// ---------- Check 2: N1' mismatch refund -> exact fund -> cancel ----------
log('--- CHECK 2: N1 prime — funding mismatch refunds, exact fund, cancel ---');
const c2 = await send(A, 'create_grant', [acctB.address, 'Targeted proof N1', JSON.stringify([ms('Deliver the targeted proof report.', GEN / 4n)])]);
log('  N1 create tx=', c2.hash, 'exec=', c2.exec);
let g = await readGrant(8);
log('  grant 8 after create: status=', g.status, 'total_escrow_wei=', g.total_escrow_wei);
const n1CreateOk = g.status === 'PENDING_FUNDING' && g.total_escrow_wei === (GEN / 4n).toString();
const balA2 = await bal(acctA.address);
const balC2 = await bal(ADDR);
const fMis = await send(A, 'fund_grant', [8], GEN);
log('  N1 mismatch fund tx=', fMis.hash, 'exec=', fMis.exec);
g = await readGrant(8);
const balA3 = await bal(acctA.address);
const balC3 = await bal(ADDR);
log('  grant 8 after mismatch: status=', g.status, '| grantor delta=', (balA3 - balA2).toString(), 'wei | contract delta=', (balC3 - balC2).toString(), 'wei');
step('check2_mismatch_refund', fMis.exec !== 'ERROR' && g.status === 'PENDING_FUNDING' && balA3 === balA2 && balC3 === balC2,
  `1.0 GEN mismatch returned (exec=${fMis.exec}, not ERROR), grant still PENDING_FUNDING, grantor delta=0 wei, contract delta=0 wei`);
const fOk = await send(A, 'fund_grant', [8], GEN / 4n);
log('  N1 exact fund tx=', fOk.hash, 'exec=', fOk.exec);
g = await readGrant(8);
const balC4 = await bal(ADDR);
log('  grant 8 after exact fund: status=', g.status, '| contract delta vs pre-fund=', (balC4 - balC3).toString(), 'wei (expect 250000000000000000)');
step('check2_exact_fund', g.status === 'FUNDED' && balC4 - balC3 === GEN / 4n,
  `exact 0.25 GEN fund -> FUNDED, contract +0.25 GEN exactly`);
const balA4 = await bal(acctA.address);
const can1 = await send(A, 'cancel_grant', [8]);
log('  N1 cancel tx=', can1.hash, 'exec=', can1.exec);
g = await readGrant(8);
const balA5 = await bal(acctA.address);
const balC5 = await bal(ADDR);
log('  grant 8 after cancel: status=', g.status, '| grantor delta=', (balA5 - balA4).toString(), 'wei (expect 250000000000000000) | contract delta=', (balC5 - balC4).toString(), 'wei');
step('check2_cancel_exact', g.status === 'CANCELLED' && balA5 - balA4 === GEN / 4n && balC5 - balC4 === -(GEN / 4n),
  `cancel refunded exactly 0.25 GEN to grantor, contract -0.25 GEN`);

// ---------- Check 3: N2' outsider funding refunded, unfunded cancel ----------
log('--- CHECK 3: N2 prime — outsider funding refunded, unfunded cancel ---');
const c3 = await send(A, 'create_grant', [acctB.address, 'Targeted proof N2', JSON.stringify([ms('Deliver the targeted proof appendix.', GEN / 4n)])]);
log('  N2 create tx=', c3.hash, 'exec=', c3.exec);
g = await readGrant(9);
log('  grant 9 after create: status=', g.status, 'total_escrow_wei=', g.total_escrow_wei);
const balO0 = await bal(acctC.address);
const balC6 = await bal(ADDR);
const fOut = await send(C, 'fund_grant', [9], GEN / 4n);
log('  N2 outsider fund tx=', fOut.hash, 'exec=', fOut.exec);
g = await readGrant(9);
const balO1 = await bal(acctC.address);
const balC7 = await bal(ADDR);
log('  grant 9 after outsider fund: status=', g.status, '| outsider delta=', (balO1 - balO0).toString(), 'wei | contract delta=', (balC7 - balC6).toString(), 'wei');
step('check3_outsider_refund', fOut.exec !== 'ERROR' && g.status === 'PENDING_FUNDING' && balO1 === balO0 && balC7 === balC6,
  `outsider 0.25 GEN rejected + refunded in full (exec=${fOut.exec}), grant still PENDING_FUNDING, outsider delta=0 wei, contract delta=0 wei`);
const balA6 = await bal(acctA.address);
const can2 = await send(A, 'cancel_grant', [9]);
log('  N2 cancel tx=', can2.hash, 'exec=', can2.exec);
g = await readGrant(9);
const balA7 = await bal(acctA.address);
const balC8 = await bal(ADDR);
log('  grant 9 after cancel: status=', g.status, '| grantor delta=', (balA7 - balA6).toString(), 'wei (expect 0) | contract delta=', (balC8 - balC7).toString(), 'wei (expect 0)');
step('check3_unfunded_cancel', g.status === 'CANCELLED' && balA7 === balA6 && balC8 === balC7,
  `never-funded grant CANCELLED, zero refund owed, both deltas 0 wei`);

// ---------- Check 4: drain every still-open grant ----------
log('--- CHECK 4: drain/cleanup — cancel all still-open grants ---');
let drainOk = true;
for (let gid = 0; gid < parseInt((await overview()).grant_count, 10); gid++) {
  const gg = await readGrant(gid);
  if (gg.status !== 'FUNDED') { log(`  grant ${gid}: status=${gg.status}, skipping`); continue; }
  const esc = BigInt(gg.total_escrow_wei);
  const rel = BigInt(gg.released_wei);
  const expectRefund = esc - rel;
  const bBefore = await bal(acctA.address);
  const cc = await send(A, 'cancel_grant', [gid]);
  const gg2 = await readGrant(gid);
  const bAfter = await bal(acctA.address);
  const got = bAfter - bBefore;
  log(`  drain grant ${gid}: escrow=${esc.toString()} released=${rel.toString()} expect_refund=${expectRefund.toString()} got=${got.toString()} tx=${cc.hash} status_after=${gg2.status}`);
  if (gg2.status !== 'CANCELLED' || got !== expectRefund) drainOk = false;
}
const ovF = await overview();
const balCF = await bal(ADDR);
log('final overview:', JSON.stringify(ovF), '| final contract_wei=', balCF.toString());
step('check4_drain_zero', drainOk && balCF === 0n,
  `all open grants cancelled with exact refunds; final contract balance=${balCF.toString()} wei (expect 0)`);
log('DONE');
