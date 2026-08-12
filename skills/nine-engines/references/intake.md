# The intake interview

Ask in three batches, not one at a time. Offer the defaults so the user
can answer with one word per item. Write the result to
`company/params.yaml` in the shape of `company/params.example.yaml`.

## Batch 1 · The company and the number

1. Company name and one line on the product. (No default; two seconds to
   answer.)
2. Stage: pre-seed, seed, series-a, or series-b-plus. Default: seed.
3. ARR today and the 12-month target. Default: whatever they said in
   conversation; never guess a target for them.

## Batch 2 · The machine

4. Team today: AEs fully ramped, AEs still ramping, BDRs, and whether
   anyone can own the automation stack (a GTM engineer, by any title).
   Default: 0/0/0 and no GTM engineer; a founder-led motion is a valid
   answer.
5. Product surface: can a stranger use it without talking to sales?
   "yes", "partial", or "no". Default: "no". If partial or yes, ask
   whether it is developer-facing.
6. Deal shape: ACV in dollars and median cycle in days. Defaults: the
   user's numbers; if they only know one, cycle defaults by ACV band
   (under $25K: 45 days; $25K to $75K: 90; over $75K: 178).

## Batch 3 · Fuel and limits

7. Monthly cash for pipeline generation: tools, data, ads, events, not
   payroll. Default: none; this one they must answer, the budget split
   depends on it.
8. ICP in one line and the two or three buying personas.
9. Engines already running, if any (use the keys below). This is
   narrative context: it is annotated on the matching verdicts and does
   not change them. Current performance is not modeled.
10. Hard constraints, from the vocabulary below. Default: none.

## Constraint vocabulary

These are the only strings the mix engine reads; anything else goes in
prose next to the verdict instead.

| Key | Meaning |
|-----|---------|
| no_email | Email outbound is off the table (policy, deliverability history) |
| no_phone | No phone coverage for cold calling |
| no_paid_budget | No ad spend allowed |
| no_events_budget | No event sponsorship budget |
| no_community_capacity | Nobody available to host a community |
| founder_wont_post | The founder will not write social content |

## Engine keys

automated_outbound · plg · manual_outbound · abm · community_partner ·
paid_media · seo_aeo · social_content · events

## The optional capacity block

If the user wants the plan tied to seats and payroll (they should), also
collect: base ARR being carried, expected annual gross churn on it
(default 6 percent), and expected expansion ARR (default $0 if
unknown). Also worth collecting when known: current SEs (team.ses),
current sales leaders (team.sales_leaders), and each ramping AE's
tenure in months (team.aes_ramping_tenure_months); the model derives
and discloses assumptions when these are absent.
Write these under `capacity:` in the params file; `engine/run.cjs` then
appends the seat math, hiring schedule, and payroll run rate to the
verdicts.

## Advanced calibration

Most CAP and MIX knobs are code constants, not params.yaml fields.
Unknown keys are rejected. Recalibrate in the order in
`docs/MODEL_CARD.md` (CAP-1 funnel, CAP-2 steady override, CAP-3 ramp
tenures, CAP-4 haircut, CAP-5 support ratios, MIX-1 floors).

Params fields that exist today:

- `team.aes_ramping_tenure_months`: real ramp cohorts (CAP-3). One
  whole-month tenure per ramping AE.
- `team.ses`, `team.bdrs`, `team.sales_leaders`, `team.bdr_managers`,
  `team.se_leads`: real headcount so the model does not derive from
  the default 2.5 ratios (CAP-5).
- `acv` and `cycle_days`: the inputs the steady-state formula reads
  (CAP-2). There is no `steadyOverride` field in this schema.

To change funnel rates (CAP-1), the haircut (CAP-4), AE-per-SE or
AE-per-BDR ratios (CAP-5), or paid-media and events spend floors
(MIX-1), edit `engine/engine.cjs` or `engine/mix.cjs`, bump the matching
version, and add a CHANGELOG entry. Do not invent schema fields for
those knobs.
