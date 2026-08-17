import { createHash } from 'node:crypto';

const DOI_PATTERN = /\b10\.\d{4,9}\/[\-._;()/:a-z0-9]+/gi;
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/gi;
const TRACKING_PARAMETERS = new Set([
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref_src', 'ref_url',
]);
const PLACEHOLDER_IDENTIFIERS = /^(?:none|n\/?a|na|unknown|unresolved|not[_ -]?retained)$/i;

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

const READ_ONLY_AUDIT_STATES = new Set(['PREFLIGHT', 'RUNNING', 'FROZEN', 'INCOMPLETE', 'BLOCKED']);

export function isAuditableBurnState(state) {
  return READ_ONLY_AUDIT_STATES.has(state);
}

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function stripUnbalancedClosingParentheses(value) {
  let result = value;
  while (result.endsWith(')')) {
    const opens = (result.match(/\(/g) ?? []).length;
    const closes = (result.match(/\)/g) ?? []).length;
    if (closes <= opens) break;
    result = result.slice(0, -1);
  }
  return result;
}

function cleanDoi(value) {
  let result = safeDecode(String(value ?? '').trim())
    .replace(/^[`'"(<\[]+/, '')
    .replace(/^doi\s*:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/[.,;:'"`>\]}]+$/g, '');
  result = stripUnbalancedClosingParentheses(result);
  return /^10\.\d{4,9}\/[\-._;()/:a-z0-9]+$/i.test(result) ? result.toLowerCase() : null;
}

function extractDoiValues(value) {
  const text = safeDecode(String(value ?? ''));
  const matches = text.match(DOI_PATTERN) ?? [];
  const direct = cleanDoi(text);
  return uniqueSorted([direct, ...matches.map(cleanDoi)]);
}

function extractPmidValues(value, inferBare = false) {
  const text = String(value ?? '');
  const values = [];
  for (const match of text.matchAll(/\bPMID\s*:?\s*[`*_~]*(\d{5,9})\b/gi)) values.push(match[1]);
  for (const match of text.matchAll(/pubmed(?:\.ncbi\.nlm\.nih\.gov)?\/(\d{5,9})(?:\/|\b)/gi)) values.push(match[1]);
  if (inferBare && /^\s*\d{5,9}\s*$/.test(text)) values.push(text.trim());
  return uniqueSorted(values);
}

function extractPmcidValues(value) {
  return uniqueSorted([...String(value ?? '').matchAll(/\bPMC\s*:?\s*[`*_~]*(\d{4,10})\b/gi)].map((match) => `PMC${match[1]}`));
}

function extractRegistryValues(value) {
  const text = String(value ?? '');
  return uniqueSorted([
    ...[...text.matchAll(/\b(NCT\d{8})\b/gi)].map((match) => match[1].toUpperCase()),
    ...[...text.matchAll(/\b(ISRCTN\d{4,10})\b/gi)].map((match) => match[1].toUpperCase()),
    ...[...text.matchAll(/\b(ACTRN\d{14})\b/gi)].map((match) => match[1].toUpperCase()),
  ]);
}

function trimUrlCandidate(value) {
  let result = String(value ?? '').replace(/[.,;:'"`>\]}]+$/g, '');
  result = stripUnbalancedClosingParentheses(result);
  return result;
}

export function normalizeCanonicalUrl(value) {
  const candidate = trimUrlCandidate(value);
  let parsed;
  try { parsed = new URL(candidate); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  parsed.protocol = 'https:';
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if ((parsed.protocol === 'https:' && parsed.port === '443') || parsed.port === '80') parsed.port = '';
  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(key.toLowerCase())) parsed.searchParams.delete(key);
  }
  parsed.searchParams.sort();
  parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString().replace(/\?$/, '').replace(/\/$/, parsed.pathname === '/' ? '/' : '');
}

function extractUrls(value) {
  const text = String(value ?? '');
  return uniqueSorted((text.match(URL_PATTERN) ?? []).map(normalizeCanonicalUrl));
}

export function normalizeDoi(value) {
  return extractDoiValues(value)[0] ?? null;
}

export function normalizePmid(value) {
  return extractPmidValues(value, true)[0] ?? null;
}

export function normalizePmcid(value) {
  return extractPmcidValues(value)[0] ?? null;
}

function decodeBasicEntities(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function normalizeTitle(value) {
  return decodeBasicEntities(value)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Search and bibliographic discovery surfaces commonly append their own name
// to an otherwise exact article title. These decorations are not part of the
// work title and must not prevent DOI/PMID/PMCID mirrors from crosswalking.
// Keep this list explicit and suffix-anchored so ordinary title subtitles are
// never stripped speculatively.
const DISCOVERY_SURFACE_PROVIDERS = [
  'pubmed',
  'pmc',
  'plos\\s+one',
  'springer\\s+nature\\s+link',
  'sciencedirect',
  'wiley\\s+online\\s+library',
  'oxford\\s+academic',
  'cambridge\\s+core',
  'taylor\\s*(?:&|and)\\s*francis\\s+online',
  'sage\\s+journals?',
  'cochrane\\s+library',
];
const DISCOVERY_SURFACE_TITLE_SUFFIX = new RegExp(
  `(?:\\s+(?:-|\\|)\\s+(?:${DISCOVERY_SURFACE_PROVIDERS.join('|')}))$`,
  'iu',
);

function normalizeIdentityTitle(value) {
  let undecorated = decodeBasicEntities(value).trim();
  while (DISCOVERY_SURFACE_TITLE_SUFFIX.test(undecorated)) {
    undecorated = undecorated.replace(DISCOVERY_SURFACE_TITLE_SUFFIX, '').trim();
  }
  return normalizeTitle(undecorated);
}

function stringValues(input) {
  if (typeof input === 'string') return [{ key: 'raw', value: input }];
  if (!input || typeof input !== 'object') return [];
  return Object.entries(input)
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .map(([key, value]) => ({ key, value }));
}

function isStableField(key) {
  return /(?:stable|identifier|doi|pmid|pmcid|registry|id$)/i.test(key);
}

function isTitleField(key) {
  return /title/i.test(key);
}

export function canonicalIdentityKeys(input, options = {}) {
  const pairs = stringValues(input);
  const keys = [];
  for (const { key, value } of pairs) {
    for (const doi of extractDoiValues(value)) keys.push(`doi:${doi}`);
    for (const pmid of extractPmidValues(value, isStableField(key))) keys.push(`pmid:${pmid}`);
    for (const pmcid of extractPmcidValues(value)) keys.push(`pmcid:${pmcid}`);
    for (const registry of extractRegistryValues(value)) keys.push(`registry:${registry}`);
    for (const url of extractUrls(value)) keys.push(`url:${url}`);
  }
  const strong = uniqueSorted(keys);
  if (options.includeTitle !== false) {
    const titleValues = pairs.filter(({ key }) => isTitleField(key)).map(({ value }) => value);
    if (typeof input === 'string' && strong.length === 0) titleValues.push(input);
    for (const titleValue of titleValues) {
      const title = normalizeIdentityTitle(titleValue);
      if (title) keys.push(`title:${title}`);
    }
  }
  return uniqueSorted(keys);
}

const IDENTITY_PRIORITY = ['doi:', 'pmid:', 'pmcid:', 'registry:', 'url:', 'title:'];

export function primaryCanonicalIdentity(input) {
  const keys = Array.isArray(input) ? input : canonicalIdentityKeys(input);
  for (const prefix of IDENTITY_PRIORITY) {
    const match = keys.find((key) => key.startsWith(prefix));
    if (match) return match;
  }
  return null;
}

export function identitiesIntersect(left, right) {
  const leftKeys = Array.isArray(left) ? left : canonicalIdentityKeys(left);
  const rightKeys = Array.isArray(right) ? right : canonicalIdentityKeys(right);
  const leftStrong = leftKeys.filter((key) => !key.startsWith('title:'));
  const rightStrong = rightKeys.filter((key) => !key.startsWith('title:'));
  // A DOI on one surface and a PMID/PMCID on another can identify the same
  // work. Exact descriptive title fallback is therefore allowed across
  // namespaces, but never across conflicting values in the same authoritative
  // namespace. Different landing URLs alone are not an identity conflict.
  for (const prefix of ['doi:', 'pmid:', 'pmcid:', 'registry:']) {
    const leftValues = leftStrong.filter((key) => key.startsWith(prefix));
    const rightValues = rightStrong.filter((key) => key.startsWith(prefix));
    if (leftValues.length > 0 && rightValues.length > 0) {
      const rightValuesSet = new Set(rightValues);
      return leftValues.some((key) => rightValuesSet.has(key));
    }
  }
  const rightStrongSet = new Set(rightStrong);
  if (leftStrong.some((key) => rightStrongSet.has(key))) return true;
  const rightTitles = new Set(rightKeys.filter((key) => key.startsWith('title:')));
  return leftKeys.some((key) => key.startsWith('title:')
    && usableTitle(key.slice('title:'.length))
    && rightTitles.has(key));
}

function stripMarkdownCell(value) {
  return decodeBasicEntities(value)
    .replace(/\\\|/g, '|')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return [];
  const body = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return body.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function normalizeHeader(value) {
  return decodeBasicEntities(value)
    .replace(/[`*~]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDividerRow(cells, expectedLength) {
  return cells.length === expectedLength && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function extractSeedTitle(rawTarget) {
  const italic = String(rawTarget ?? '').match(/(?:^|[^*])\*([^*]+)\*/);
  if (italic) return stripMarkdownCell(italic[1]);
  let title = stripMarkdownCell(rawTarget)
    .replace(/\s*[;,]\s*(?:DOI|PMID|PMCID|article)\b[\s\S]*$/i, '')
    .replace(/^[\p{L}'-]+(?:\s+et\s+al\.)?\s*\(\d{4}\)\s*,\s*/iu, '')
    .trim();
  return title;
}

function usableTitle(title) {
  const normalized = normalizeTitle(title);
  return normalized.length >= 16 && normalized.split(' ').length >= 3;
}

function laneByStratum(scope = {}) {
  const result = new Map();
  for (const [lane, strata] of Object.entries(scope ?? {})) {
    if (!Array.isArray(strata)) throw new Error(`scope lane ${lane} is not an array`);
    for (const stratum of strata) {
      if (result.has(stratum)) throw new Error(`scope duplicates stratum ${stratum}`);
      result.set(stratum, lane);
    }
  }
  return result;
}

function normalizedCorrection(seedId, correction) {
  if (!correction) return null;
  const stableId = correction.correctedStableId ?? correction.corrected_stable_id ?? correction.stableId ?? correction.stable_id;
  const title = correction.correctedTitle ?? correction.corrected_title ?? null;
  const identityKeys = canonicalIdentityKeys({ stable_id: stableId ?? '', title: title ?? '' });
  if (!stableId || identityKeys.filter((key) => !key.startsWith('title:')).length === 0) {
    throw new Error(`seed correction ${seedId} lacks a canonical stable identity`);
  }
  return { stableId, title, identityKeys };
}

function inventoryDigest(seeds) {
  const canonical = seeds.map((seed) => ({
    seedId: seed.seedId,
    lane: seed.lane,
    stratum: seed.stratum,
    title: seed.title,
    originalIdentityKeys: seed.originalIdentityKeys,
    effectiveIdentityKeys: seed.effectiveIdentityKeys,
    correction: seed.correction,
  }));
  return createHash('sha256').update(JSON.stringify(canonical), 'utf8').digest('hex');
}

export function extractSeedInventory(contractText, options = {}) {
  const lines = String(contractText ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const strataToLane = laneByStratum(options.scope ?? {});
  const expectedSeedMap = options.seedMap ?? null;
  const corrections = options.corrections ?? {};
  const seeds = [];
  const seen = new Set();

  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerCells = splitMarkdownRow(lines[index]);
    const dividerCells = splitMarkdownRow(lines[index + 1]);
    if (!headerCells.length || !isDividerRow(dividerCells, headerCells.length)) continue;
    const headers = headerCells.map(normalizeHeader);
    const seedIndex = headers.indexOf('seed id');
    const stratumIndex = headers.indexOf('stratum');
    const laneIndex = headers.indexOf('lane');
    const targetIndex = headers.findIndex((header) => ['known item', 'bibliographic target'].includes(header));
    const stableIndex = headers.indexOf('stable id seed');
    if (seedIndex < 0 || stratumIndex < 0 || targetIndex < 0) continue;

    let rowIndex = index + 2;
    while (rowIndex < lines.length) {
      const cells = splitMarkdownRow(lines[rowIndex]);
      if (cells.length !== headers.length) break;
      const seedId = stripMarkdownCell(cells[seedIndex]);
      const stratum = stripMarkdownCell(cells[stratumIndex]);
      if (!seedId || !stratum) break;
      if (seen.has(seedId)) throw new Error(`duplicate seed row ${seedId}`);
      seen.add(seedId);
      const explicitLane = laneIndex >= 0 ? stripMarkdownCell(cells[laneIndex]) : null;
      const derivedLane = strataToLane.get(stratum) ?? null;
      if (explicitLane && derivedLane && explicitLane !== derivedLane) throw new Error(`seed ${seedId} lane/stratum mismatch`);
      const lane = explicitLane || derivedLane;
      if (Object.keys(options.scope ?? {}).length && !lane) throw new Error(`seed ${seedId} has unknown stratum ${stratum}`);
      if (expectedSeedMap && !(seedId in expectedSeedMap)) throw new Error(`contract has unexpected seed ${seedId}`);
      if (expectedSeedMap && expectedSeedMap[seedId] !== stratum) throw new Error(`seed ${seedId} stratum differs from frozen map`);

      const rawTarget = cells[targetIndex];
      const stableSeed = stableIndex >= 0 ? cells[stableIndex] : '';
      const title = extractSeedTitle(rawTarget);
      const originalIdentityKeys = canonicalIdentityKeys({ raw_target: rawTarget, stable_id: stableSeed, title });
      if (!originalIdentityKeys.some((key) => !key.startsWith('title:')) && !usableTitle(title)) {
        throw new Error(`seed ${seedId} lacks a usable identity`);
      }
      const correction = normalizedCorrection(seedId, corrections[seedId]);
      const effectiveIdentityKeys = correction ? correction.identityKeys : originalIdentityKeys;
      seeds.push({
        seedId, lane, stratum, title,
        target: stripMarkdownCell(rawTarget),
        stableIdSeed: stripMarkdownCell(stableSeed),
        originalIdentityKeys,
        effectiveIdentityKeys,
        correction,
        sourceLine: rowIndex + 1,
      });
      rowIndex += 1;
    }
    index = Math.max(index, rowIndex - 1);
  }

  seeds.sort((left, right) => left.seedId.localeCompare(right.seedId));
  if (expectedSeedMap) {
    for (const seedId of Object.keys(expectedSeedMap)) {
      if (!seen.has(seedId)) throw new Error(`frozen contract is missing seed ${seedId}`);
    }
  }
  for (const seedId of Object.keys(corrections)) {
    if (!seen.has(seedId)) throw new Error(`correction references absent seed ${seedId}`);
  }
  const byId = Object.fromEntries(seeds.map((seed) => [seed.seedId, seed]));
  return {
    burnId: options.burnId ?? null,
    seeds,
    byId,
    sha256: inventoryDigest(seeds),
  };
}

function firstStrongIdentity(keys) {
  return keys.find((key) => !key.startsWith('title:')) ?? null;
}

function legacyTitle(raw) {
  return String(raw ?? '')
    .replace(URL_PATTERN, ' ')
    .replace(DOI_PATTERN, ' ')
    .replace(/\b(?:PMID|PMCID)\s*:?\s*(?:PMC)?\d+\b/gi, ' ')
    .replace(/[|;,]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseJsonResultItem(item, index, options = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`result item ${index + 1} is not an object`);
  const rank = Number(item.rank);
  if (!Number.isInteger(rank) || rank < 1) throw new Error(`result item ${index + 1} has invalid rank`);
  const title = String(item.title ?? '').trim();
  if (options.requireTitle !== false && !title) throw new Error(`result item ${index + 1} lacks title`);
  const url = normalizeCanonicalUrl(item.url);
  if (!url) throw new Error(`result item ${index + 1} lacks canonical HTTP(S) URL`);
  const stableId = String(item.stable_id ?? item.stableId ?? '').trim();
  if (stableId && PLACEHOLDER_IDENTIFIERS.test(stableId)) throw new Error(`result item ${index + 1} has placeholder stable identity`);
  const identityKeys = canonicalIdentityKeys({ ...item, stable_id: stableId, url, title });
  const primaryIdentity = primaryCanonicalIdentity(identityKeys);
  if (!primaryIdentity) throw new Error(`result item ${index + 1} lacks canonical identity`);
  return { rank, title, url, stableId: stableId || null, identityKeys, primaryIdentity, raw: item };
}

function parseLegacyResultItem(raw, index) {
  const text = String(raw ?? '').trim();
  const urls = extractUrls(text);
  const title = legacyTitle(text) || text;
  const identityKeys = canonicalIdentityKeys({ raw: text, title });
  const primaryIdentity = primaryCanonicalIdentity(identityKeys);
  if (!primaryIdentity || (!firstStrongIdentity(identityKeys) && !usableTitle(title))) {
    throw new Error(`legacy result item ${index + 1} lacks reconstructible identity`);
  }
  return {
    rank: index + 1,
    title,
    url: urls[0] ?? null,
    stableId: firstStrongIdentity(identityKeys),
    identityKeys,
    primaryIdentity,
    raw: text,
  };
}

export function parseResultSet(value, options = {}) {
  let rawItems;
  let format;
  if (Array.isArray(value)) {
    rawItems = value;
    format = 'json';
  } else {
    const text = String(value ?? '').trim();
    if (!text || /^(?:NONE|\[\])$/i.test(text)) return [];
    if (text.startsWith('[')) {
      try { rawItems = JSON.parse(text); } catch (error) { throw new Error(`malformed JSON result_set: ${error.message}`); }
      if (!Array.isArray(rawItems)) throw new Error('JSON result_set must be an array');
      format = 'json';
    } else {
      rawItems = text.split(/\s*\|\|\s*/).filter(Boolean);
      format = 'legacy';
    }
  }
  const items = rawItems.map((item, index) => (format === 'json' ? parseJsonResultItem(item, index, options) : parseLegacyResultItem(item, index)));
  for (const [index, item] of items.entries()) {
    if (item.rank !== index + 1) throw new Error(`result ranks must be unique and sequential from 1; item ${index + 1} has rank ${item.rank}`);
  }
  const identityClusters = [];
  for (const item of items) {
    const matchingIndexes = identityClusters
      .map((cluster, index) => (identitiesIntersect(cluster.identityKeys, item.identityKeys) ? index : -1))
      .filter((index) => index >= 0);
    if (matchingIndexes.length > 0 && options.allowDuplicateIdentities !== true) {
      const duplicate = identityClusters[matchingIndexes[0]].firstItem;
      throw new Error(`duplicate canonical result identity at ranks ${duplicate.rank} and ${item.rank}`);
    }
    if (matchingIndexes.length === 0) {
      identityClusters.push({ firstItem: item, identityKeys: [...item.identityKeys] });
      continue;
    }
    const firstIndex = matchingIndexes[0];
    const mergedKeys = new Set([...identityClusters[firstIndex].identityKeys, ...item.identityKeys]);
    for (const index of matchingIndexes.slice(1).toReversed()) {
      for (const key of identityClusters[index].identityKeys) mergedKeys.add(key);
      identityClusters.splice(index, 1);
    }
    identityClusters[firstIndex].identityKeys = [...mergedKeys];
  }
  Object.defineProperty(items, 'uniqueIdentityCount', { value: identityClusters.length, enumerable: false });
  if (options.expectedUniqueCount !== undefined) {
    const expected = Number(options.expectedUniqueCount);
    const observed = options.allowDuplicateIdentities === true ? identityClusters.length : items.length;
    if (!Number.isInteger(expected) || expected < 0 || expected !== observed) {
      throw new Error(`unique_result_count ${options.expectedUniqueCount} does not match ${observed} canonical results`);
    }
  }
  return items;
}

const RETRIEVAL_RULES = [
  ['NCBI', /\b(?:pubmed|pub med|pmc|ncbi|medline)\b/i],
  ['CROSSREF', /\bcrossref\b/i],
  ['OPENALEX', /\bopen\s*alex\b/i],
  ['SEMANTIC_SCHOLAR', /\bsemantic\s+scholar\b/i],
  ['GOOGLE_SCHOLAR', /\bgoogle\s+scholar\b/i],
  ['WEB_OF_SCIENCE', /\b(?:web\s+of\s+science|clarivate)\b/i],
  ['SCOPUS', /\bscopus\b/i],
  ['PSYCINFO', /\b(?:psycinfo|apa\s+psycnet)\b/i],
  ['COCHRANE', /\bcochrane\b/i],
  ['ERIC', /\bERIC\b/],
  ['CLINICALTRIALS_GOV', /\bclinical\s*trials?\.gov\b/i],
  ['WHO_ICTRP', /\b(?:WHO\s+)?ICTRP\b/i],
  ['ISRCTN', /\bISRCTN\b/i],
  ['GENERAL_WEB', /\b(?:google\s*(?:web\s*)?search|bing(?:\s*search)?|general\s*web(?:\s*search)?|web\s*search)\b/i],
  ['DOI_RESOLVER', /\b(?:doi\.org|doi\s+resolver)\b/i],
  ['PUBLISHER:sciencedirect.com', /\b(?:science\s*direct|elsevier)\b/i],
  ['PUBLISHER:springer.com', /\b(?:springer\s*link|springerlink)\b/i],
  ['PUBLISHER:nature.com', /\bnature(?:\.com|\s+portfolio)?\b/i],
  ['PUBLISHER:wiley.com', /\bwiley(?:\s+online\s+library)?\b/i],
  ['PUBLISHER:tandfonline.com', /\b(?:taylor\s*(?:&|and)\s*francis|tandf\s*online)\b/i],
  ['PUBLISHER:sagepub.com', /\bsage(?:pub|\s+journals)?\b/i],
  ['JSTOR', /\bjstor\b/i],
  ['ARXIV', /\barxiv\b/i],
];

function explicitHostFamily(text) {
  const match = text.match(/^\s*(publisher|repository)\s*:\s*(\S+)\s*$/i);
  if (!match) return null;
  const kind = match[1].toUpperCase();
  const rawHost = match[2].includes('://') ? match[2] : `https://${match[2]}`;
  const url = normalizeCanonicalUrl(rawHost);
  if (!url) throw new Error(`invalid ${match[1]} retrieval host`);
  return `${kind}:${new URL(url).hostname}`;
}

function familyFromHost(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'pubmed.ncbi.nlm.nih.gov' || host === 'ncbi.nlm.nih.gov') return 'NCBI';
  if (host === 'scholar.google.com') return 'GOOGLE_SCHOLAR';
  if (host === 'google.com' || host.endsWith('.google.com') || host === 'bing.com') return 'GENERAL_WEB';
  if (host.endsWith('crossref.org')) return 'CROSSREF';
  if (host.endsWith('openalex.org')) return 'OPENALEX';
  if (host.endsWith('semanticscholar.org')) return 'SEMANTIC_SCHOLAR';
  if (host.endsWith('clinicaltrials.gov')) return 'CLINICALTRIALS_GOV';
  if (host.endsWith('doi.org')) return 'DOI_RESOLVER';
  return `HOST:${host}`;
}

export function canonicalRetrievalSystem(value, options = {}) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error('retrieval system is empty');
  const explicit = explicitHostFamily(text);
  if (explicit) return explicit;
  const matches = uniqueSorted(RETRIEVAL_RULES.filter(([, pattern]) => pattern.test(text)).map(([family]) => family));
  if (matches.length > 1) throw new Error(`ambiguous retrieval system ${text}: ${matches.join(', ')}`);
  if (matches.length === 1) return matches[0];
  const urls = extractUrls(text);
  if (urls.length === 1) return familyFromHost(new URL(urls[0]).hostname);
  if (urls.length > 1) {
    const families = uniqueSorted(urls.map((url) => familyFromHost(new URL(url).hostname)));
    if (families.length === 1) return families[0];
    throw new Error(`ambiguous retrieval system URLs: ${families.join(', ')}`);
  }
  if (options.allowUnknown === true) return `OTHER:${normalizeTitle(text).replace(/ /g, '_').toUpperCase()}`;
  throw new Error(`unknown retrieval system ${text}`);
}

export function b11GateBeforeRound(row, context = {}) {
  const startedAt = Date.parse(row?.started_at);
  if (!Number.isFinite(startedAt)) throw new Error('B11 gate round has invalid started_at');
  const completedBefore = (event) => event?.round_id !== row.round_id
    && Number.isFinite(Date.parse(event?.ended_at))
    && Date.parse(event.ended_at) <= startedAt;
  const qualifyingSources = (context.sources ?? []).filter((source) =>
    source.lane === row.lane
    && source.first_seen_round_id !== row.round_id
    && Number.isFinite(Date.parse(source.first_seen_ended_at))
    && Date.parse(source.first_seen_ended_at) <= startedAt
    && Number.isFinite(Date.parse(source.checked_at))
    && Date.parse(source.checked_at) <= startedAt);
  const primarySources = qualifyingSources.filter((source) => source.primary_eligible === true);
  const seedIds = new Set((context.seedEvents ?? [])
    .filter((event) => event.lane === row.lane && completedBefore(event))
    .map((event) => event.seed_id));
  const requiredSeedIds = context.requiredSeedIds ?? [];
  const seedsComplete = requiredSeedIds.every((seedId) => seedIds.has(seedId));
  const vectorFamilies = new Set((context.vectorEvents ?? [])
    .filter((event) => event.stratum === row.stratum && completedBefore(event))
    .map((event) => event.family)
    .filter(Boolean));
  return {
    ready: qualifyingSources.length >= 18 && primarySources.length >= 8
      && seedsComplete && vectorFamilies.size >= 3,
    qualifyingSources: qualifyingSources.length,
    primarySources: primarySources.length,
    seedsComplete,
    vectorFamilies: [...vectorFamilies].sort(),
  };
}
