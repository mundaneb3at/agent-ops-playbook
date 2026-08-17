# templates/

The artifacts you actually copy into your own project. Each one exists because a real run failed
without it — see [LOOPS.md](../LOOPS.md) for the loops these plug into.

| File | Use it for |
|---|---|
| [burn-contract-template.md](burn-contract-template.md) | The full contract shape for an unattended overnight run. Read the italic "why" notes before deleting any section — each one closes a specific failure. |
| [ledger-template.md](ledger-template.md) | A findings ledger with a real status lifecycle (`proposed → approved → applied → superseded`, plus `refuted` and `owner-ruled ignore`). Copy this into any research/audit folder the moment it's created. |
| [job-prompt-skeleton.md](job-prompt-skeleton.md) | The 8-step shape for any job you dispatch to a worker or contractor. |
| [deep-research-prompts.md](deep-research-prompts.md) | Ready-to-paste prompts for the manual outside-advisor step. |
| [capture-receipt-schema.md](capture-receipt-schema.md) | The provenance/receipt format for capturing outside-advisor output so it's auditable later. |
| [evidence-integrity/](evidence-integrity/) | A small runnable library + test suite for deduplicating citations by DOI/PMID/PMCID/URL/title, used by the contract's `SOURCES.tsv`/`CLAIMS.tsv` mechanism. |

Read [PORTING.md](../PORTING.md) before assuming any of this drops into your own setup unchanged
— the templates carry the mechanism; you still have to supply the things listed there.
