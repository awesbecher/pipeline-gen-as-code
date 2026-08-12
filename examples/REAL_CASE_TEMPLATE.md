# Real-company case template

TEMPLATE ONLY. Do not fill this with a made-up company and label it
real. Acme Security in `examples/acme/` is the illustrative fixture.
This file is the shape ROADMAP v1 criterion 1 requires when a real,
anonymized case exists.

Copy to `examples/<anon-name>/` and replace every placeholder. Strip
customer names, emails, and anything that identifies the company. Keep
the numbers that the model actually saw.

## 1. Parameters as entered

Link or paste the anonymized `params.yaml` the operator ran, schema v1,
with the same field groups the runner validates. Note the date and the
`params_hash` from the output.

    examples/<anon-name>/params.yaml
    generated_on: YYYY-MM-DD
    params_hash: ____________

## 2. Model output

Commit the JSON, the board memo, and the 90-day plan the runner and the
skill produced on those parameters. Do not edit the numbers after the
fact to match what happened.

    examples/<anon-name>/output.json
    examples/<anon-name>/BOARD.md
    examples/<anon-name>/PLAN.md

Record versions: model, mix, params schema, output schema.

## 3. Overrides, with rationale and approver

Every management override, persisted in full:

- Engine:
- Model recommendation: (verdict at $X)
- Approved verdict: (verdict at $Y)
- Approved budget:
- Rationale: (one sentence the approver would still sign)
- Approver:
- Date:

If there were no overrides, say so. Silence is not an override log.

## 4. Decisions the team actually made

What shipped after the memo: which engines ran, who owned them, what
budget was spent, which hires were approved or slipped. This is the
operator record, not the model.

## 5. What the model did not know

A plain section. Name the facts that were missing at run time (demand
that did not arrive, cash that could not fund the payroll run rate,
an engine already failing, a hire that slipped) and how much that
mattered relative to the memo. Demand coverage and cash/runway are
permanently out of scope in this product line; if those were the miss,
say so here rather than implying the model should have predicted them.

Do not invent outcomes. If you do not have a real case, leave this
template empty and keep using `examples/acme/`.
