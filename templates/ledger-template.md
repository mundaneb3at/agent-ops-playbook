<!--
LEDGER TEMPLATE

Copy this file to <research-folder>/LEDGER.md at the moment the folder is created — not after the
findings are written. A finding with no lifecycle structurally never reaches a ruling: measured
across one set of research folders, folders with no lifecycle ledger had zero of their
recommendations ever route anywhere real; every folder that shipped WITH a ledger from the start
had at least one row actually applied.
-->

# LEDGER.md — template

This is an audit output's actual deliverable — not a side-note describing the report, the report
IS this table plus its supporting artifacts. A finding that never gets written as a row here is a
finding that, in practice, never happened.

## Table

| id | finding | recommendation | status | closing artifact |
|---|---|---|---|---|
| F1 | Example: X was measured at N, contradicting the assumed value | Fix X in file Y | `proposed` | — |
| F2 | Example: a retrieval check returned 0/36 correct before a fix | Ship the fix | `approved` | — (queued, not yet built) |
| F3 | Example: a budget was exceeded by some amount | Restructure to fit, don't just delete entries | `applied` | `path/to/LEDGER.md` row D1, commit `<sha>` |
| F4 | Example: an old target number had no real basis | Replace it with a measured one | `superseded` | superseded by F3's applied fix |
| F5 | Example: a cheap-model scout claimed a script "cannot do X" | Re-probe before acting on it | `refuted` | a direct probe re-ran the script; it could — the finding was false, no action taken |
| F6 | Example: a known data-quality mismatch in one file | Relabel it | `owner-ruled ignore` | Owner: *"that's fine, worth ignoring"* — surfaced 2x — **DO NOT RAISE AGAIN** |

## Status vocabulary (exact strings — no synonyms)

`proposed` → `approved` → `applied` → `superseded`

Terminal states outside that chain:
- **`refuted`** — the evidence killed the finding. Keep the row; don't delete it, so the ledger
  records what was almost believed.
- **`owner-ruled ignore`** — the evidence still stands; the owner (a human) accepted the risk
  anyway. Requires all three: the ruling **quoted verbatim**, a **surfaced-count** (how many times
  this has now come up), and an explicit **do-not-raise-again marker**. This is different from
  `refuted` — nothing here was wrong, it was just consciously declined.

## Rules

- A row reaches `applied` only when a real path or commit is named in its **closing artifact**
  cell — a status flip with no artifact named is not actually applied.
- **Convert in the same sitting.** Any finding that's cheap and reversible gets fixed in the run
  that found it, not filed away for later. A findings document nobody routes is the exact failure
  this template exists to prevent.
- **Any number a ruling is about to freeze needs a durable, committed producer script** — never a
  one-off scratch calculation. If you can't hand someone the script that reproduces the number
  tomorrow, the row isn't ready to be ruled on yet.
- **Recon claims get re-probed before they change scope, sequence, or a severity rating.** A
  cheap-model or first-pass claim is evidence to verify, not a fact to build directly on.
- **At close, every `proposed` row must be cited in a real downstream tracker, or explicitly moved
  to a `no-action` status.** A `proposed` row that goes nowhere is the exact failure this template
  exists to catch — check for this explicitly before considering a piece of work finished.

## Doctrine-lifecycle rows (when a ledger row proposes changing a standing rule, not just a fact)

When a row proposes retiring or changing a piece of your own standing doctrine (a rule, a
convention, a process), these apply on top of the vocabulary above:

- **Deprecation is a human-readable record** (reason, successor, date, earliest sunset, evidence)
  — a timer never auto-removes doctrine on its own; removal takes a fresh, deliberate decision
  after notice.
- **A trial removal is reversible** (`trial-disabled`); a terminal `retired` state is a separate,
  final decision. A successful revert rehearsal is a precondition for either state.
- **Anything that loads automatically on every session can never be nominated dead from zero usage
  data** — a usage instrument that can't see automatic loading will always read it as unused.
