# Benchmark source registry

Every quantitative claim in this repository is indexed here with its
source, evidence class, and confidence. Claims with no external source
are labeled ANDREW OPERATOR HEURISTIC: numbers Andrew Wesbecher uses to
run pipeline, offered as defensible starting points, not published
research. A board reader should treat evidence classes accordingly:

- industry report: aggregated data from a named vendor report
- vendor content: a tool vendor's published playbook or benchmark
- case study: a named company's published result
- operator heuristic: Andrew's operating number; no external source

Sources were collected on 2026-08-04 during the research pass for
wesbecher.llc/pipeline. Publication dates are listed where the source
states one; n.d. otherwise. Every market statistic expires for
planning purposes on 2027-08-04 and should be revalidated before reuse.

Model constants (funnel rates, ramp vector, steady-state anchor,
thresholds, the 85/15 split) are Andrew's operating model, tested for
reproducibility in `engine/`, and are heuristics by definition. Argue
with them; they are knobs.

## Engine 01 · Automated Outbound

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| AO-1 | Enriched, signal-led campaigns reply at 6 to 12 percent; unenriched merge-tag volume at 1 to 3 | levityleads.com reply benchmarks (n.d., accessed 2026-08-04) | vendor content | medium |
| AO-2 | Waterfall enrichment verifies emails at 95 percent plus | scalingtechnologypartners.com waterfall guide (n.d., accessed 2026-08-04) | vendor content | medium |
| AO-3 | Four to six weeks of domain warmup before campaigns | coldicp.com deliverability rules (n.d., accessed 2026-08-04) | vendor content | medium |
| AO-4 | One operator runs 400 to 500 sends a day across the system | levityleads.com two-person stack (n.d., accessed 2026-08-04) | vendor content | medium |
| AO-5 | A tight 300-account list beats a loose 3,000 | ANDREW OPERATOR HEURISTIC | operator heuristic | stated as judgment |

## Engine 02 · Product-Led Growth

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| PLG-1 | Median free-to-paid is 8 percent | ChartMogul SaaS Conversion Report 2026 (accessed 2026-08-04) | industry report | medium-high |
| PLG-2 | PQL-to-enterprise runs 10 to 25 percent when sales works the queue | udit.co PQL analysis (n.d., accessed 2026-08-04) | vendor content | medium |
| PLG-3 | Airtable runs a reverse trial (14 days paid tier, then free) | growthunhinged.com Airtable breakdown (n.d., accessed 2026-08-04) | case study | medium |
| PLG-4 | Cursor free-to-paid ran roughly ten times the freemium norm | gtmnow.com (reported 36 percent, n.d., accessed 2026-08-04) | case study | medium |
| PLG-5 | Seat velocity of 15 to 20 seats a quarter signals a forming company | udit.co PQL signals (n.d., accessed 2026-08-04) | vendor content | medium |

## Engine 03 · Manual Outbound + Cold Calling

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| MO-1 | Average connect rate about 5 percent; top quartile 13 on verified mobiles | Cognism State of Outbound 2026 (accessed 2026-08-04) | industry report | medium-high |
| MO-2 | About eight attempts to reach one person | saleshive.com benchmarks (n.d., accessed 2026-08-04) | vendor content | medium |
| MO-3 | Dial-to-meeting 2 to 3 percent; coached teams on clean data 5 to 8 | saleshive.com benchmarks (n.d., accessed 2026-08-04) | vendor content | medium |
| MO-4 | Dream-150 / T1 / T2 / T3 tier ladder | growthunhinged.com outbound playbook (n.d., accessed 2026-08-04) plus ANDREW OPERATOR HEURISTIC | vendor content + heuristic | stated as judgment |
| MO-5 | $25K ACV floor for a rep-led motion | ANDREW OPERATOR HEURISTIC (mix.js threshold, a knob) | operator heuristic | stated as judgment |

## Engine 04 · ABM

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| ABM-1 | RB2B-class tools resolve 40 to 70 percent of B2B office traffic | abmatic.ai deanonymization data (n.d., accessed 2026-08-04) | vendor content | medium |
| ABM-2 | 25 to 40 percent of a named list engages within 90 days | hightouch.com ABM playbook (n.d., accessed 2026-08-04) | vendor content | medium |
| ABM-3 | Awareness-stage operating system (Identified through Selecting) | hightouch.com; 6sense.com ABM guide (n.d., accessed 2026-08-04) | vendor content | medium |
| ABM-4 | $75K ACV floor for ABM | ANDREW OPERATOR HEURISTIC (mix.js threshold, a knob) | operator heuristic | stated as judgment |

## Engine 05 · Community + Partner Led

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| CP-1 | Wiz grew its integration network past 300 partners inside product | wiz.io Partner Alliance pages (n.d., accessed 2026-08-04) | case study | medium |
| CP-2 | dbt marketplace transactions grew 190 percent in a year | dbt Labs partner ecosystem reporting (n.d., accessed 2026-08-04) | case study | medium |
| CP-3 | Channel clearing 25 percent of new business as the graduation bar | ANDREW OPERATOR HEURISTIC | operator heuristic | stated as judgment |

## Engine 06 · Paid Media

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| PM-1 | Thought-leader ads run roughly double the click-through at about half the cost per qualified lead | steerads.com and nicodigital.com LinkedIn ABM playbooks (n.d., accessed 2026-08-04) | vendor content | medium |
| PM-2 | Run well against a named list, paid accelerates cycles 15 to 30 percent | steerads.com (n.d., accessed 2026-08-04) | vendor content | low-medium |
| PM-3 | Paid carries 5 to 15 percent of pipeline | nicodigital.com (n.d., accessed 2026-08-04) | vendor content | low-medium |
| PM-4 | Matched audiences of 300 to 1,500 accounts | steerads.com LinkedIn guidance (n.d., accessed 2026-08-04) | vendor content | medium |
| PM-5 | About $8K a month as the spend floor before fragmentation | ANDREW OPERATOR HEURISTIC (mix.js threshold, a knob) | operator heuristic | stated as judgment |
| PM-6 | Instant meeting booking converts several times better than day-later follow-up | chilipiper.com speed-to-lead data (n.d., accessed 2026-08-04) | vendor content | medium |

## Engine 07 · SEO + AEO

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| SEO-1 | Versus pages are the strongest predictor of AI-search traffic; 21 plus comparison pages see roughly nine times median AI referrals | siegemedia.com versus-page study (n.d., accessed 2026-08-04) | industry report | medium |
| SEO-2 | AI-referred visitors convert around five times organic search | authoricy.com benchmarks (reported 14.2 vs 2.8 percent, n.d., accessed 2026-08-04) | vendor content | medium |
| SEO-3 | Most AI-referred traffic shows up as Direct in analytics | growthengineer.ai measurement stack (n.d., accessed 2026-08-04) | vendor content | medium |
| SEO-4 | Vanta topic-cluster architecture as the reference case | foundationinc.co Vanta breakdown (n.d., accessed 2026-08-04) | case study | medium |

## Engine 08 · Social Content

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| SC-1 | Personal profiles pull roughly three times the engagement of company pages | averi.ai founder-led content system (n.d., accessed 2026-08-04) | vendor content | low-medium |
| SC-2 | Consistent founder-led programs see inbound conversations roughly triple inside 60 days | connectsafely.ai founder inbound data (n.d., accessed 2026-08-04) | vendor content | low-medium |
| SC-3 | Inbound closes an order of magnitude better than cold | connectsafely.ai close-rate gap plus ANDREW OPERATOR HEURISTIC | vendor content + heuristic | stated as judgment |

## Engine 09 · Events

| ID | Claim | Source | Class | Confidence |
|----|-------|--------|-------|------------|
| EV-1 | RSA's 43,000 badges reduce to under 2,000 real targets | luminik.io RSA program breakdown (n.d., accessed 2026-08-04) | vendor content | medium |
| EV-2 | Generic pre-event notes reply at 2 percent; session-specific near 10 | luminik.io (n.d., accessed 2026-08-04) | vendor content | medium |
| EV-3 | Booth-first programs run $8K to $12K per opportunity; ICP-first with pre-booking $2.5K to $5K | luminik.io cybersecurity event ROI guide (n.d., accessed 2026-08-04) | vendor content | medium |
| EV-4 | Best programs pre-book half their meetings (reference program: 40 of 85) | luminik.io five-stage RSA program (n.d., accessed 2026-08-04) | case study | medium |
| EV-5 | Executive-hosted dinners outperform the booth; host title decides acceptance | samaaro.com (n.d., accessed 2026-08-04) | vendor content | low-medium |
| EV-6 | 24-hour hot-lead and 48-hour full follow-up SLA | luminik.io plus ANDREW OPERATOR HEURISTIC | vendor content + heuristic | stated as judgment |

## Model constants (all Andrew's operating model)

| ID | Constant | Where | Class |
|----|----------|-------|-------|
| CAP-1 | Funnel: 16 percent meeting-to-qual, 27 percent qual-to-POV, 81 percent POV-to-win | engine.js FUNNEL | operator heuristic, tested for reproducibility |
| CAP-2 | Steady-state anchor: $1.0M per ramped AE at $120K ACV on a 178-day cycle | engine.js ANCHOR | operator heuristic, tested |
| CAP-3 | Ramp vector: $0 / $125K / $225K / $250K per tenure quarter | engine.js RATES x profile | operator heuristic, tested |
| CAP-4 | 30 percent haircut from gross capacity to net-new ARR | engine.js DEFAULTS.adv.haircut | operator heuristic |
| CAP-5 | Support ratios: 2.5 AEs per SE and per BDR; leadership thresholds | engine.js DEFAULTS.adv | operator heuristic |
| MIX-1 | 85/15 run/instrument budget split and every ACV or cash threshold | mix.js | operator heuristic, knobs by design |

## What this registry does not claim

None of these figures are predictions for your company. The vendor and
report numbers describe other cohorts at other times; the heuristics
describe how Andrew operates. Validate against your own funnel before
building a forecast on any of them.
