# Pipeline plan for the board · Acme Security

> Illustrative fixture. Acme Security is a made-up company used to show the output shape. Numbers below are computed from the committed example parameters, not from a real business.

## The ask, in one paragraph

Reach $7,000,000 ARR from $1,200,000 in 12 months. Net of 6 percent churn and $1,000,000 expansion, that requires $4,872,000 in net-new ARR, which is $6,960,000 gross bookings capacity at the model's 30 percent haircut. The staffing plan below clears it with modeled capacity of $6,991,639.

## Engine bets (starting allocation, argue with it)

| Engine | Verdict | Monthly | Share | Why |
|--------|---------|--------:|------:|-----|
| Automated Outbound | run now | $3,865 | 15.5% | The baseline layer: one GTM engineer, waterfall enrichment, warmed domains, human-approved sends. |
| Product-Led Growth | defer | – | – | No self-serve surface. Revisit when a free tier or trial exists. |
| Manual Outbound + Cold Calling | run now | $5,795 | 23.2% | ACV clears the bar for tiered, rep-led outbound. The deep-dive program is the operating manual. Already running per your intake; this verdict applies to continued funding. |
| ABM | run now | $3,862 | 15.4% | Enterprise ACV and reps to route to: named list, signal architecture, stage scoring. |
| Community + Partner Led | instrument now | $1,875 | 7.5% | Partner lane only: marketplace listing plus two or three co-sell relationships; the 25 percent channel bar is the graduation gate. |
| Paid Media | run now | $1,932 | 7.7% | Named list exists and budget clears the floor: full-funnel creative, demo asks only at warm retargeting. |
| SEO + AEO | instrument now | $1,875 | 7.5% | Start the clusters and versus pages now; the flywheel pays months from now (see the source registry for the conversion claim). |
| Social Content | run now | $1,932 | 7.7% | Three founder posts a week plus daily comments; capture engaged accounts into outbound. |
| Events | run now | $3,862 | 15.4% | Enterprise ICP: one or two ICP-dense events a quarter, list built six weeks out, half the meetings pre-booked. |

Cash: $24,998 allocated of $25,000 a month; $2 unallocated (rounding remainder).

This split is a management starting hypothesis from fixed 85/15 weights. It is not a forecast, and engine spend is not converted into meetings or bookings in this model version.

## Hires and timing

- New AEs: 7 (months 1, 1, 2, 2, 3, 3, 5)
- New BDRs: 4 (months 1, 1, 2, 5); new SEs: 3 (months 1, 2, 5)
- Leadership adds: Sales leader (Area VP) month 1, BDR manager month 1, SE lead (Field CTO) month 1
- Sales payroll run rate at full build: $6,465,000; year-1 sales comp: $4,895,579
- Meetings the plan implies: 1166 first meetings across the year; BDR capacity utilization 118 percent (prorated for hire months)

## Scenarios (same model, stated input deltas)

| Scenario | Assumption delta | Gross capacity | Exit ARR | Target |
|----------|------------------|---------------:|---------:|--------|
| Downside | rep productivity 15 percent below plan | $6,977,055 | $7,011,939 | clears |
| Base | plan assumptions as entered | $6,991,639 | $7,022,147 | clears |
| Upside | rep productivity 10 percent above plan | $7,003,305 | $7,030,314 | clears |

## Assumptions this output rests on

- Ramping AE tenure not supplied; assumed a 4/3-month stagger (set team.aes_ramping_tenure_months to use real cohorts).
- Current SE count not supplied; derived 2 from the 2.5 AE-per-SE ratio (set team.ses to use the real number).
- Current sales leadership not supplied; derived from AE count (set team.sales_leaders to use the real number). Carried leadership is only priced when supplied.
- Portfolio verdicts use only the published portfolio drivers: acv, cash_monthly_pipeline, team.aes_ramped, team.aes_ramping, team.gtm_engineer, product.self_serve, product.developer_facing, constraints. Stage, funding, ICP, and personas are narrative context and drive no verdict.

## Evidence

Benchmark claims in the playbook are indexed in docs/SOURCES.md with source, evidence class, and confidence. Numbers without a source are labeled as Andrew Wesbecher operator heuristics. Model math is tested; run `node engine/test-engine.cjs` and `node engine/test-mix.cjs`.

## Decisions required

1. Approve or amend the engine allocation above; record overrides with rationale in plan/review.md.
1. Name the owner for Automated Outbound.
1. Name the owner for Manual Outbound + Cold Calling.
1. Name the owner for ABM.
1. Name the owner for Paid Media.
1. Name the owner for Social Content.
1. Name the owner for Events.
1. Approve the hiring schedule (7 AEs plus support) or set a different target.

## Next review

First Monday operating loop after approval (plan/monday.md), then weekly. Re-run this memo when budget, team, ACV, or target changes.

A human approves every external send, in every engine, always.
