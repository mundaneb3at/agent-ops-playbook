# Capture-receipt schema — for outside-advisor output

When you capture a report from the manual outside-advisor step (see
[deep-research-prompts.md](deep-research-prompts.md)), the capture contract is: the report itself,
a sibling "thinking trace" file if the tool exposes one, a provenance header, and a receipt. This
is what makes a piece of third-party model output into something you can actually audit later,
instead of just a pasted blob of text.

**Match report and trace by content, never by filename.** Filenames drift across a long project —
match them by what they're actually about, or by an explicit ID you assign at capture time.

## The provenance receipt (`<report-id>-PROVIDER-RECEIPT.json`)

```json
{
  "report_id": "<REPORT-ID>",
  "requested_product": "<what you asked the tool for, e.g. 'Deep Research, extended thinking'>",
  "observed_provider": "<the actual tool/account used>",
  "observed_model": "<model selected in the UI, or 'NOT_OBSERVABLE' if no channel exposes it>",
  "started": "true",
  "captured_utc": "<ISO-8601 UTC timestamp>",
  "request_sha256": "<sha256 of the exact prompt you sent>",
  "raw_sha256": "<sha256 of the captured raw report file>",
  "completion_state": "COMPLETE",
  "capture_method": "<how the text got from the tool's UI into this file, verbatim>",
  "encoding_note": "<any normalisation applied — e.g. CRLF->LF only, no content changes>"
}
```

Why each field earns its place:
- `request_sha256` / `raw_sha256` — lets you prove later that neither the prompt nor the captured
  output was silently edited after the fact.
- `observed_model` explicitly allows `"NOT_OBSERVABLE"` — many consumer UIs don't expose which
  model actually served a request, and pretending otherwise is worse than saying so.
- `capture_method` — a human export-then-paste is a different evidentiary weight than an API
  response; record which one happened.

## The thinking-trace header (top of `<report-id>-TRACE.md`, if the tool exposes a trace)

```markdown
<!-- provenance
artifact_class: <tool name> thinking trace (provider evidence, unadjudicated)
report: <report-id>-RAW.md
source_export: <original export filename from the tool, if different>
source_size_bytes: <size of the original export>
source_mtime_local: <local timestamp of the export>
source_lines: <line range extracted, of total lines in the original export>
capture_method: owner-export
normalisation: <e.g. CRLF -> LF only; content otherwise verbatim>
-->
```

**Treat the trace as provenance, not product.** It's what tells you whether an `UNVERIFIABLE`
verdict on a claim was a genuine retrieval failure (the trace shows it never actually found a
source) versus a real negative finding (the trace shows it looked and came back empty on purpose).
It is never itself an adjudication — a companion/reviewer step still has to actually judge the
claims inside the report.

## Rules

- Every `<id>-RAW.md` is third-party model output, captured **verbatim, including its errors**. It
  is an input to your own adjudication, not a finding you can cite directly.
- A `-SUPERSEDED` trace or raw file belongs to a report that was replaced — keep it as evidence
  about the run (what actually happened, what got fixed), not as a live input.
- Record explicitly which product you *requested* vs which one was *actually observed* — some
  tools have been seen silently drifting their model selection mid-session; recording both lets
  you catch that after the fact instead of trusting the request line.
