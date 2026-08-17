# evidence-integrity

A small, dependency-free Node module for one specific job inside the burn contract's
`SOURCES.tsv` / `CLAIMS.tsv` mechanism (see
[../burn-contract-template.md](../burn-contract-template.md)): given messy, inconsistently-formatted
citation data (DOIs in various encodings, PMIDs, PMCIDs, URLs with tracking parameters, titles
decorated with a discovery surface's own branding), decide whether two citations actually identify
the **same underlying source** — so a burn can't silently double-count a source it found through
two different search paths, and can't be tricked into treating a real duplicate as two independent
pieces of corroborating evidence.

It also implements the "preflight readiness gate" pattern from
[LOOPS.md](../../LOOPS.md)'s "widen" step (`b11GateBeforeRound`): before an unattended burn is
allowed to widen into another search round, this checks that enough real, already-verified
evidence exists from *before* the round started — never counting anything the round itself is
about to produce.

## Run the tests

```
node --test
```

No dependencies, no build step — this is plain ES modules on Node's built-in test runner
(`node:test` + `node:assert/strict`), available in any reasonably current Node (18+).

## What's genuinely reusable here vs what to rewrite

The identity-normalization logic (DOI/PMID/PMCID/URL canonicalization, title-decoration stripping,
transitive identity-cluster merging) is domain-general for any burn that verifies citations —
ship it as-is. The specific regex list of known discovery-surface providers and retrieval-system
aliases (`DISCOVERY_SURFACE_PROVIDERS`, `RETRIEVAL_RULES` near the bottom of
`evidence-integrity.mjs`) is a living list you'll want to extend for whatever sources your own
burns actually touch — treat it as a starting point, not a closed set.
