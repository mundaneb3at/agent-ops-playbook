import test from 'node:test';
import assert from 'node:assert/strict';
import {
  b11GateBeforeRound,
  canonicalIdentityKeys,
  canonicalRetrievalSystem,
  extractSeedInventory,
  identitiesIntersect,
  isAuditableBurnState,
  normalizeCanonicalUrl,
  normalizeDoi,
  normalizePmcid,
  normalizePmid,
  normalizeTitle,
  parseResultSet,
  primaryCanonicalIdentity,
} from '../evidence-integrity.mjs';

test('canonical identities normalize DOI, PMID, PMCID, URLs, and titles', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1001/JAMA.288.7.835?x=1'), '10.1001/jama.288.7.835');
  assert.equal(normalizePmid('PMID: 31433334'), '31433334');
  assert.equal(normalizePmcid('pmcid pmc9297132'), 'PMC9297132');
  assert.equal(
    normalizeCanonicalUrl('http://www.Example.com:80/paper/?utm_source=x&b=2&a=1#result'),
    'https://example.com/paper?a=1&b=2',
  );
  assert.equal(normalizeTitle('Near & Far-Transfer: Café results!'), 'near and far transfer cafe results');

  const doiLabel = canonicalIdentityKeys({ stable_id: 'DOI:10.1001/jama.288.7.835', title: 'A title' });
  const doiUrl = canonicalIdentityKeys({ url: 'https://doi.org/10.1001/JAMA.288.7.835', title: 'Different mirror title' });
  assert.equal(primaryCanonicalIdentity(doiLabel), 'doi:10.1001/jama.288.7.835');
  assert.equal(identitiesIntersect(doiLabel, doiUrl), true);

  const pmidLabel = canonicalIdentityKeys({ stable_id: 'PMID 31433334' });
  const pmidUrl = canonicalIdentityKeys({ url: 'https://pubmed.ncbi.nlm.nih.gov/31433334/' });
  assert.equal(identitiesIntersect(pmidLabel, pmidUrl), true);

  const titleOnly = canonicalIdentityKeys({ title: 'A unique title-only seed identity' });
  const resolvedResult = canonicalIdentityKeys({ stable_id: 'DOI:10.1000/resolved', title: 'A unique title-only seed identity' });
  assert.equal(identitiesIntersect(titleOnly, resolvedResult), true);
  const conflictingStrongIds = canonicalIdentityKeys({ stable_id: 'DOI:10.1000/different', title: 'A unique title-only seed identity' });
  assert.equal(identitiesIntersect(resolvedResult, conflictingStrongIds), false);
  const doiSurface = canonicalIdentityKeys({ stable_id: 'DOI:10.1000/crosswalk', title: 'A sufficiently descriptive cross namespace article' });
  const pmidSurface = canonicalIdentityKeys({ stable_id: 'PMID:31433334', title: 'A sufficiently descriptive cross namespace article' });
  assert.equal(identitiesIntersect(doiSurface, pmidSurface), true);
  assert.equal(identitiesIntersect(
    canonicalIdentityKeys({ stable_id: 'PMID:11111', title: 'A sufficiently descriptive shared article title' }),
    canonicalIdentityKeys({ stable_id: 'PMID:22222', title: 'A sufficiently descriptive shared article title' }),
  ), false);
  assert.equal(identitiesIntersect(
    canonicalIdentityKeys({ stable_id: 'DOI:10.1000/one', readable_url: 'https://example.org/shared' }),
    canonicalIdentityKeys({ stable_id: 'DOI:10.1000/two', readable_url: 'https://example.org/shared' }),
  ), false);
});

test('extracts a seed inventory from an inline seed table, including a correction overlay', () => {
  const table = [
    '| seed_id | stratum | known item |',
    '|---|---|---|',
    '| K1 | S1 | *A sufficiently descriptive first seed title*; DOI 10.1000/one |',
    '| K2 | S1 | *A sufficiently descriptive second seed title*; PMID 31433334 |',
  ].join('\n');
  const inventory = extractSeedInventory(table, { burnId: 'DEMO', scope: { L1: ['S1'] } });
  assert.equal(inventory.seeds.length, 2);
  assert.match(inventory.sha256, /^[0-9a-f]{64}$/);
  assert.equal(inventory.byId.K1.lane, 'L1');
  assert.ok(inventory.byId.K1.effectiveIdentityKeys.includes('doi:10.1000/one'));

  const corrected = extractSeedInventory(table, {
    burnId: 'DEMO', scope: { L1: ['S1'] },
    corrections: { K1: { correctedStableId: 'DOI:10.1000/corrected' } },
  });
  assert.ok(corrected.byId.K1.originalIdentityKeys.includes('doi:10.1000/one'));
  assert.deepEqual(corrected.byId.K1.effectiveIdentityKeys, ['doi:10.1000/corrected']);
});

test('seed extraction fails closed on duplicates, frozen-map drift, and orphan corrections', () => {
  const duplicate = [
    '| seed_id | stratum | known item |',
    '|---|---|---|',
    '| K1 | S1 | *A sufficiently descriptive first seed title*; DOI 10.1000/one |',
    '| K1 | S1 | *A sufficiently descriptive second seed title*; DOI 10.1000/two |',
  ].join('\n');
  assert.throws(() => extractSeedInventory(duplicate, { scope: { L1: ['S1'] } }), /duplicate seed row K1/);

  const single = [
    '| seed_id | stratum | known item |',
    '|---|---|---|',
    '| K1 | S1 | *A sufficiently descriptive seed title*; DOI 10.1000/one |',
  ].join('\n');
  assert.throws(() => extractSeedInventory(single, { scope: { L1: ['S1'] }, seedMap: { K1: 'S2' } }), /stratum differs/);
  assert.throws(() => extractSeedInventory(single, { scope: { L1: ['S1'] }, corrections: { K2: { correctedStableId: 'DOI:10.1000/two' } } }), /absent seed K2/);
});

test('result-set parser requires sequential ranks, canonical URLs, and unique identities', () => {
  const valid = JSON.stringify([
    { rank: 1, title: 'First article', url: 'https://publisher.example/a?utm_source=test', stable_id: 'DOI:10.1000/ABC' },
    { rank: 2, title: 'Second article', url: 'https://pubmed.ncbi.nlm.nih.gov/31433334/', stable_id: 'PMID:31433334' },
  ]);
  const parsed = parseResultSet(valid, { expectedUniqueCount: 2 });
  assert.equal(parsed[0].primaryIdentity, 'doi:10.1000/abc');
  assert.equal(parsed[1].primaryIdentity, 'pmid:31433334');
  assert.equal(parsed[0].url, 'https://publisher.example/a');

  const skippedRank = JSON.stringify([
    { rank: 1, title: 'First', url: 'https://example.org/1', stable_id: '' },
    { rank: 3, title: 'Third', url: 'https://example.org/3', stable_id: '' },
  ]);
  assert.throws(() => parseResultSet(skippedRank), /sequential from 1/);

  const duplicateIdentity = JSON.stringify([
    { rank: 1, title: 'One copy', url: 'https://example.org/one', stable_id: 'DOI:10.1000/same' },
    { rank: 2, title: 'Another copy', url: 'https://doi.org/10.1000/SAME', stable_id: '' },
  ]);
  assert.throws(() => parseResultSet(duplicateIdentity), /duplicate canonical result identity/);
  assert.throws(() => parseResultSet(valid, { expectedUniqueCount: 3 }), /does not match 2/);
});

test('result-set parser supports the legacy pipe-separated format deterministically', () => {
  const parsed = parseResultSet([
    'DOI:10.1000/one | First sufficiently descriptive result | https://example.org/one',
    'PMID:31433334 | Second sufficiently descriptive result | https://pubmed.ncbi.nlm.nih.gov/31433334/',
  ].join(' || '));
  assert.deepEqual(parsed.map((item) => item.rank), [1, 2]);
  assert.equal(parsed[0].primaryIdentity, 'doi:10.1000/one');
  assert.equal(parsed[1].primaryIdentity, 'pmid:31433334');
});

test('result receipts may omit titles when stable identities and URLs are present', () => {
  const receipt = '[{"rank":1,"stable_id":"DOI:10.1000/example","url":"https://doi.org/10.1000/example"}]';
  const parsed = parseResultSet(receipt, { expectedUniqueCount: 1, requireTitle: false });
  assert.equal(parsed[0].primaryIdentity, 'doi:10.1000/example');
  assert.throws(() => parseResultSet(receipt), /lacks title/);
});

test('Markdown-wrapped PMID seeds and alternate result identifiers remain identity-visible', () => {
  assert.deepEqual(canonicalIdentityKeys({ raw_target: 'Target title, PMID `31433334`' }), ['pmid:31433334']);
  const receipt = '[{"rank":1,"stable_id":"DOI:10.1000/wrong","alternate_id":"DOI:10.1000/correct","url":"https://pubmed.ncbi.nlm.nih.gov/31433334/"}]';
  const parsed = parseResultSet(receipt, { requireTitle: false });
  assert.equal(parsed[0].identityKeys.includes('doi:10.1000/correct'), true);
});

test('canonical result dedup closes transitive identifier bridges', () => {
  const receipt = JSON.stringify([
    { rank: 1, title: 'DOI-only discovery surface', url: 'https://doi.org/10.1000/bridge', stable_id: 'DOI:10.1000/bridge' },
    { rank: 2, title: 'Crosswalk record', url: 'https://example.org/crosswalk', stable_id: 'DOI:10.1000/bridge', alternate_id: 'PMID:31433334' },
    { rank: 3, title: 'PMID-only discovery surface', url: 'https://pubmed.ncbi.nlm.nih.gov/31433334/', stable_id: 'PMID:31433334' },
  ]);
  const parsed = parseResultSet(receipt, { expectedUniqueCount: 1, allowDuplicateIdentities: true });
  assert.equal(parsed.length, 3);
  assert.equal(parsed.uniqueIdentityCount, 1);
  assert.throws(() => parseResultSet(receipt), /duplicate canonical result identity/);
});

test('provider-decorated discovery titles crosswalk mirrors without weakening ID conflicts', () => {
  const doiSeed = canonicalIdentityKeys({
    stable_id: 'DOI:10.1371/journal.pone.0058338',
    title: 'A sufficiently descriptive article title for a decorated mirror',
  });
  const pubmedResult = canonicalIdentityKeys({
    stable_id: 'PMID:23484020',
    title: 'A sufficiently descriptive article title for a decorated mirror - PubMed',
  });
  assert.equal(identitiesIntersect(doiSeed, pubmedResult), true);
  assert.equal(identitiesIntersect(
    canonicalIdentityKeys({ stable_id: 'PMID:11111', title: 'Exact Work Title - PubMed' }),
    canonicalIdentityKeys({ stable_id: 'PMID:22222', title: 'Exact Work Title - PMC' }),
  ), false);
});

test('B11-style gate uses only completed, checked, prior-round evidence', () => {
  const row = { round_id: 'R4', lane: 'L1', stratum: 'S1', started_at: '2026-08-12T10:00:00Z' };
  const sources = Array.from({ length: 18 }, (_, index) => ({
    lane: 'L1', checked_at: '2026-08-12T09:59:00Z',
    first_seen_round_id: `R${index + 10}`, first_seen_ended_at: '2026-08-12T09:58:00Z',
    primary_eligible: index < 8,
  }));
  const context = {
    sources,
    requiredSeedIds: ['K1', 'K2'],
    seedEvents: [
      { seed_id: 'K1', lane: 'L1', round_id: 'R1', ended_at: '2026-08-12T09:55:00Z' },
      { seed_id: 'K2', lane: 'L1', round_id: 'R2', ended_at: '2026-08-12T09:56:00Z' },
    ],
    vectorEvents: ['CLINICAL_DOMAIN', 'ADJACENT_MECHANISM', 'IMPLEMENTATION_HCI'].map((family, index) => ({
      stratum: 'S1', family, round_id: `V${index}`, ended_at: `2026-08-12T09:5${index}:00Z`,
    })),
  };
  assert.equal(b11GateBeforeRound(row, context).ready, true);
  const checkedLater = structuredClone(context);
  checkedLater.sources[0].checked_at = '2026-08-12T10:01:00Z';
  assert.equal(b11GateBeforeRound(row, checkedLater).ready, false);
  const seedInCurrentRound = structuredClone(context);
  seedInCurrentRound.seedEvents[1] = { seed_id: 'K2', lane: 'L1', round_id: 'R4', ended_at: '2026-08-12T10:00:00Z' };
  assert.equal(b11GateBeforeRound(row, seedInCurrentRound).ready, false);
});

test('retrieval-system families collapse aliases and reject ambiguous labels', () => {
  assert.equal(canonicalRetrievalSystem('PubMed'), 'NCBI');
  assert.equal(canonicalRetrievalSystem('PubMed/PMC via NCBI'), 'NCBI');
  assert.equal(canonicalRetrievalSystem('https://pubmed.ncbi.nlm.nih.gov/?term=attention'), 'NCBI');
  assert.equal(canonicalRetrievalSystem('Google Scholar'), 'GOOGLE_SCHOLAR');
  assert.equal(canonicalRetrievalSystem('Google web search'), 'GENERAL_WEB');
  assert.equal(canonicalRetrievalSystem('GeneralWeb'), 'GENERAL_WEB');
  assert.equal(canonicalRetrievalSystem('publisher:nature.com'), 'PUBLISHER:nature.com');
  assert.equal(canonicalRetrievalSystem('repository:https://repository.example.edu'), 'REPOSITORY:repository.example.edu');
  assert.throws(() => canonicalRetrievalSystem('PubMed and Google Scholar'), /ambiguous retrieval system/);
  assert.throws(() => canonicalRetrievalSystem('My bespoke index'), /unknown retrieval system/);
});

test('read-only audit selection includes terminal blocked burns and excludes closed states', () => {
  for (const state of ['PREFLIGHT', 'RUNNING', 'FROZEN', 'INCOMPLETE', 'BLOCKED']) {
    assert.equal(isAuditableBurnState(state), true);
  }
  for (const state of ['RELEASED', 'REJECTED', 'REPAIRING', null, undefined]) {
    assert.equal(isAuditableBurnState(state), false);
  }
});
