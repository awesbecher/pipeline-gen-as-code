# Pipeline plan for the board · Acme Security

> Illustrative fixture. Acme Security is a made-up company used to show the output shape. Numbers below are computed from the committed example parameters, not from a real business.

## The ask, in one paragraph

Reach $7,000,000 ARR from $1,200,000 in 12 months. Net of 6 percent churn and $1,000,000 expansion, that requires $4,872,000 in net-new ARR, which is $6,960,000 gross bookings capacity at the model's 30 percent haircut.

Status by layer: AE bookings capacity clears, BDR support clears, overall staffing clears.

The staffing plan below clears the target with modeled capacity of $6,991,639, and the support build covers the 1,166 first meetings it implies.

## Engine bets (starting allocation, argue with it)

| Engine | Verdict | Monthly | Share | Why |
|--------|---------|--------:|------:|-----|
| Automated Outbound | run now | $5,312 | 21.3% | The baseline layer: one GTM engineer, waterfall enrichment, warmed domains, human-approved sends. |
| Product-Led Growth | defer | – | – | No self-serve surface. Revisit when a free tier or trial exists. |
| Manual Outbound + Cold Calling | run now | $7,970 | 31.9% | ACV clears the bar for tiered, rep-led outbound. The deep-dive program is the operating manual. Already running per your intake; this verdict applies to continued funding. |
| ABM | run now | $5,312 | 21.3% | Enterprise ACV and reps to route to: named list, signal architecture, stage scoring. |
| Community + Partner Led | instrument now | $1,875 | 7.5% | Partner lane only: marketplace listing plus two or three co-sell relationships; the 25 percent channel bar is the graduation gate. |
| Paid Media | defer | – | – | Qualifies on ICP and budget, but the split funds it at $1,932 a month against its own $8,000 floor: below the learning threshold, paid spend fragments across audiences and teaches nothing. Not funded this cycle; raise the pipeline budget or concentrate it here deliberately. |
| SEO + AEO | instrument now | $1,875 | 7.5% | Start the clusters and versus pages now; the flywheel pays months from now (see the source registry for the conversion claim). |
| Social Content | run now | $2,655 | 10.6% | Three founder posts a week plus daily comments; capture engaged accounts into outbound. |
| Events | defer | – | – | Qualifies on ICP and budget, but the split funds it at $4,250 a month against its own $15,000 floor: below a sponsorship-grade program, the spend buys a booth and no pipeline. Not funded this cycle; raise the pipeline budget or concentrate it here deliberately. |

Cash: $24,999 allocated of $25,000 a month; $1 unallocated (rounding remainder).

This split is a management starting hypothesis from fixed 85/15 weights. It is not a forecast, and engine spend is not converted into meetings or bookings in this model version.

## Hires and timing

- New AEs: 7 (months 1, 1, 2, 2, 3, 3, 5)
- New BDRs: 5 (months 1, 1, 2, 3, 5); new SEs: 3 (months 1, 2, 5)
- BDR hiring takes the larger of two requirements, the AE coverage ratio and the meeting plan. Here it is bound by meeting volume: 4 hire(s) from the ratio plus 1 to source the meeting plan.
- Leadership adds: Sales leader (Area VP) month 1, BDR manager month 1, SE lead (Field CTO) month 1. Carried leadership priced in this plan: 0 sales leader(s), 0 BDR manager(s), 0 SE lead(s).
- Sales payroll run rate at full build: $6,585,000; year-1 sales comp: $4,986,829
- Meetings the plan implies: 1,166 first meetings across the year, of which BDRs source 777; BDR capacity utilization 99.7 percent (prorated for hire months)

## Sensitivity on the approved plan

The hiring schedule above is held fixed. This is the risk the board is actually approving.

| Scenario | Assumption delta | Gross capacity | Exit ARR | Gap to target | BDR utilization |
|----------|------------------|---------------:|---------:|--------------:|----------------:|
| Downside | rep productivity 15 percent below plan | $5,942,893 | $6,288,025 | MISSES by $1,017,107 | 84.7 percent |
| Base | plan assumptions as entered | $6,991,639 | $7,022,147 | clears | 99.7 percent |
| Upside | rep productivity 10 percent above plan | $7,690,803 | $7,511,562 | clears | 109.7 percent |

## Recovery plans, if you reopen hiring

Each row re-solves the schedule for that scenario. The headcount and payroll columns are the cost of holding the target.

| Scenario | New AEs | Hire months | BDRs | SEs | Leaders added | Payroll run rate | Year-1 comp | Exit ARR | BDR utilization |
|----------|--------:|-------------|-----:|----:|--------------:|-----------------:|------------:|---------:|----------------:|
| Downside | 12 | 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 9 | 7 | 7 | 4 | $9,245,000 | $6,233,646 | $7,011,939 | 95.1 percent |
| Base | 7 | 1, 1, 2, 2, 3, 3, 5 | 6 | 5 | 3 | $6,585,000 | $4,986,829 | $7,022,147 | 99.7 percent |
| Upside | 6 | 1, 1, 2, 2, 3, 8 | 6 | 4 | 3 | $5,995,000 | $4,578,558 | $7,030,314 | 99.8 percent |

Read the downside row as the real ask: holding $7,000,000 through a 15 percent productivity miss costs 5 more AEs and $2,660,000 more payroll run rate than the base plan.

## Risks

- Downside sensitivity: with the approved plan unchanged, rep productivity 15 percent below plan misses the target by $1,017,107 of gross capacity.
- Upside support strain: the same plan runs BDR support at 109.7 percent because more bookings mean more meetings to source.
- The engine allocation is a starting hypothesis, not a demand forecast. Nothing above converts engine spend into meetings.

## Assumptions this output rests on

- Ramping AE tenure not supplied; assumed a 4/3-month stagger (set team.aes_ramping_tenure_months to use real cohorts).
- Current SE count not supplied; derived 2 from the 2.5 AE-per-SE ratio (set team.ses to use the real number).
- BDR hiring is set by the meeting plan, not the 2.5 AE-per-BDR ratio: 1 of 5 new BDRs exist to source the 777 first meetings the bookings plan implies.
- Current sales leadership not supplied; the plan assumes none is in place and prices every leader it adds (set team.sales_leaders to carry existing leaders).
- Current BDR management not supplied; the plan hires and prices a BDR manager (set team.bdr_managers if one is already in seat).
- Current SE leadership not supplied; the plan hires and prices an SE lead (set team.se_leads if one is already in seat).
- Board sensitivities move one stated input: steady-state productivity per ramped AE at downside 0.85x, base 1.00x, upside 1.10x. Fixed-plan rows hold the approved hiring schedule constant; reoptimized rows re-solve it and report the headcount and payroll that change.
- Portfolio verdicts use only the published portfolio drivers: acv, cash_monthly_pipeline, team.aes_ramped, team.aes_ramping, team.gtm_engineer, product.self_serve, product.developer_facing, constraints. Stage, funding, ICP, and personas are narrative context and drive no verdict.

## Evidence

Benchmark claims in the playbook are indexed in docs/SOURCES.md with source, evidence class, sample, and confidence. Numbers without a resolvable source are labeled Andrew Wesbecher operator heuristics. Model math is tested; run `node engine/test-engine.cjs` and `node engine/test-mix.cjs`.

## Decisions required

1. Approve or amend the engine allocation above; record overrides with rationale in plan/review.md.
1. Name the owner for Automated Outbound.
1. Name the owner for Manual Outbound + Cold Calling.
1. Name the owner for ABM.
1. Name the owner for Social Content.
1. Approve the hiring schedule (7 AEs plus support) or set a different target.

## Next review

First Monday operating loop after approval (plan/monday.md), then weekly. Re-run this memo when budget, team, ACV, or target changes.

A human approves every external send, in every engine, always.
