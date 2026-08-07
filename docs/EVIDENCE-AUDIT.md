# Evidence audit · dated 2026-08-07

This file records what changed in the claim registry and why, so the
corrections are not silently lost. [SOURCES.md](SOURCES.md) carries
current state only: what each claim says today, its source, sample,
cohort, method, evidence class, confidence, and access date. Everything
historical lives here: prior wording, magnitude corrections, demotions,
domains that stopped resolving, and numbers that failed to trace.

Read this before re-adding a number the registry dropped.

---

## Pass 1 · 2026-08-05 verification

Every URL in the registry was fetched and read on this date. Eleven
claims failed verification and were demoted or rewritten. Six claims
verified at a materially different magnitude than the prior registry
stated.

Two corrections matter enough for a board conversation: dial-to-meeting
(MO-3) was off by roughly a factor of ten, and visitor deanonymization
(ABM-1) conflated company-level match with person-level match.

### Magnitude corrections

| ID | Prior registry said | Verified state | Why it matters |
|---|---|---|---|
| MO-3 | Dial-to-meeting runs 2 to 3 percent, coached teams 5 to 8 percent | Belkins measures about 0.27 percent on 175,000+ dials, roughly 370 dials per booked meeting | Any plan built on 2 to 3 percent overstates cold-calling capacity by an order of magnitude |
| ABM-1 | RB2B-class tools resolve 40 to 70 percent of B2B office traffic | 40 to 70 percent is the company-level match rate. RB2B is person-level and resolves 8 to 15 percent | Planning outreach volume off the company-level number overstates reachable contacts by four to seven times |
| MO-1 | Average connect rate about 5 percent, top quartile 13 on verified mobiles, attributed to Cognism | Cognism publishes neither figure. Belkins measures 9.9 percent per dial and 24.5 percent per prospect | The attribution was wrong and the numbers were wrong in both directions |
| MO-2 | About eight attempts to reach one person | Belkins measures three | Eight attempts is a data-quality finding, not a benchmark |
| PM-1 | Thought Leader Ads deliver roughly double the click-through at about half the cost per qualified lead | The published CTR gap is about seven times, and no cost-per-qualified-lead figure exists anywhere | Half the claim was understated and half of it was invented |
| SC-1 | Personal profiles get roughly three times the engagement of company pages | 1.5x on engagement rate and parity on impressions, from the largest cross-account dataset available | The direction holds. The magnitude does not |
| EV-3 | Booth-first runs $8K to $12K per opportunity, ICP-first with pre-booking runs $2.5K to $5K | Published bands are $5K to $15K disciplined and $10K to $25K average, cut by program discipline rather than by booth versus pre-book | The prior split had no source and the low end sat below every published band |
| SEO-3 | Most AI-referred traffic shows up as Direct | The mechanism is real. No resolvable source quantifies "most" | Keep the mechanism, drop the quantifier |
| PLG-1 | Filed as an industry report | Self-reported survey answers from 200 operators, not instrumented product data | Class downgrade only. The 8 percent median verified |
| AO-2 | Verify emails at 95 percent plus | The operating bar is bounce under 2 percent; a 95 percent verification bar still permits a 5 percent bounce | The prior bar sits above the deliverability line |
| PM-4 | Sourced to a vendor page, with a 1,500-account upper bound | LinkedIn's own documentation gives the 300 floor. The 1,500 bound has no source and is now an operator heuristic | Platform documentation beats a vendor relay |
| PM-6 | Sourced to an unresolvable vendor speed-to-lead page | The primary is the 2007 MIT Lead Response Management Study that every vendor page relays | Source upgrade, with the 2007 date and the co-author conflict now disclosed |
| AO-3 | 4 to 6 weeks of domain warmup | Verified at 4 to 6 weeks. Smartlead's independent guidance is 2 to 3 weeks of pure warmup then a ramp to full volume by week 4, so 4 to 6 weeks is the conservative end of a real range | No change to the operating rule |
| CP-1 | Wiz integration count | Verified at 300. The integrations feed the Wiz Security Graph as external connections; they are not features built inside the product | Interpretation correction, not a number correction |
| ABM-3 | Vague "awareness-stage operating system" citation | Replaced with the 6sense 2025 Buyer Experience Report, approximately 4,766 buyers | Source upgrade |
| AO-5 | Bare assertion that a tight 300-account list beats a loose 3,000 | Still Andrew's number, now corroborated in direction by two platform datasets showing reply rate falling monotonically with list size | Heuristic kept, corroboration added |
| EV-1 | Sourced to a vendor page | Replaced with the RSA Conference organizer's own closing release | Source upgrade. The "under 2,000 real targets" reduction was and remains a heuristic |
| SEO-2 | AI-referred traffic converts around five times better than organic | 1.05x for B2B SaaS, effectively parity. See the attribution chain below | The five-times claim is not supportable for this repo's audience |

---

## Pass 2 · 2026-08-07 demotions applied

The 2026-08-05 pass marked several rows UNVERIFIED and recommended a
demotion without carrying it out. A registry that recommends its own
corrections is not a registry. Every recommendation is now applied: the
evidence class reads ANDREW OPERATOR HEURISTIC, the implied external
authority is gone from the wording, and the operating guidance survives
intact. Claim IDs did not change, so existing citations still resolve.

Eleven rows demoted:

| ID | Was | Now | What the row keeps |
|---|---|---|---|
| AO-4 | UNVERIFIED, framed against a vendor benchmark that does not exist | operator heuristic, with a sourced constraint | 400 to 500 sends a day for one operator, with Smartlead's 30 to 50 per warmed mailbox as the real constraint |
| PLG-2 | vendor content, low, with a pending recommendation | operator heuristic | The 10 to 25 percent PQL band as Andrew's number, explicitly barred from board-facing plans |
| PLG-5 | UNVERIFIED with a pending recommendation | operator heuristic | 15 to 20 seats a quarter as a line Andrew watches |
| ABM-2 | survey, low, with a pending recommendation | operator heuristic | 25 to 40 percent account engagement in 90 days as an operating target |
| PM-2 | survey, low, pointing at event data for a paid-media claim | operator heuristic | The cycle-compression mechanism, stated with no number attached |
| PM-3 | UNVERIFIED with a pending recommendation | operator heuristic | Paid at 5 to 15 percent of pipeline as a budget-allocation opinion |
| SC-2 | UNVERIFIED with a pending recommendation | operator heuristic | The founder-led tripling claim, barred from board-facing plans |
| SC-3 | UNVERIFIED, half-labeled as a heuristic | operator heuristic | Inbound closing better than cold, entirely as Andrew's number. The vendor half of the old label is gone |
| EV-2 | survey, low, with a pending recommendation | operator heuristic | Session-specific outreach beating generic, with no numbers attached. AO-1 measures the personalization effect in a different channel |
| EV-4 | UNVERIFIED as a rate, with a pending recommendation | operator heuristic, with a sourced absolute count | Pre-book at least half the meetings. The unsourced "40 of 85" reference program is gone |
| EV-5 | vendor content, low, split in the notes but not in the class | operator heuristic, with a sourced price band | Dinners priced against Tier 1 sponsorship, with the overlap of the two published bands stated plainly, and the host-title claim named as a heuristic |

Also fixed in the same pass:

- **Stale filenames.** MO-5, ABM-4, PM-5 and MIX-1 cited `engine/mix.js`
  and CAP-1 through CAP-5 cited `engine/engine.js`. The files are
  `engine/mix.cjs` and `engine/engine.cjs`. Nine occurrences corrected.
- **CAC ordering cost basis.** The PLG, then community, then SEO
  ordering now carries claim ID MIX-2 with an explicit basis: marginal
  cash cost only, excluding product engineering, founder time,
  editorial labor and community ownership. It is labeled an operator
  ranking, not a measured CAC study, and it carries a kill criterion.
- **Absolute phrases narrowed.** "Nearly free," "pays forever" and
  "beats bursts every time" now sit in the registry as three
  falsifiable operating hypotheses, each with a kill criterion, under
  the MIX-2 cost basis. The playbook cards that carried those phrases
  were rewritten to match: `playbook/00-portfolio.md` (the engine table
  and the CAC verdict), `playbook/07-seo-aeo.md` (opening, budget note,
  tripwire), `playbook/08-social-content.md` (opening, cadence, run-it
  test) and `skills/nine-engines/references/engines.md` (the framing
  line). All four now cite MIX-2 and state the marginal-cash basis, so
  the cards and the registry vouch for the same thing.
- **History split out.** SOURCES.md lost its Correction column, its
  "what changed in this pass" narrative, its dead-domain list and its
  "numbers that collapse under one hop" section. All of it is in this
  file.

---

## Sources that did not resolve

These domains were cited in the pre-2026-08-05 registry and produced no
fetchable page supporting the claim attributed to them:

levityleads.com, scalingtechnologypartners.com, coldicp.com, udit.co,
saleshive.com (for the specific attempt and dial-to-meeting figures),
abmatic.ai, steerads.com, nicodigital.com, growthengineer.ai, averi.ai,
connectsafely.ai, luminik.io, samaaro.com.

Every claim resting on one of them was re-sourced, rewritten, or
demoted.

---

## Numbers that collapse under one hop

Three widely repeated figures in this space fail on the first check.
They are recorded here so nobody re-adds them.

**AI conversion of 14.2 percent versus 2.8 percent, attributed to
Stackmatix.** Stackmatix never published it. Full chain below.

**Cold call dial-to-meeting at 2 to 3 percent.** Repeated across vendor
blogs with no primary source. Belkins' 175,000-dial study measures about
0.27 percent.

**Person-level visitor identification at 40 to 70 percent.** That is the
company-level match rate. Person-level runs 8 to 15 percent.

### The 14.2 versus 2.8 attribution chain

Authoricy's page at https://authoricy.com/blog/ai-search-statistics-2026
states "AI search traffic converts at 14.2% versus 2.8% for Google
organic, a 5.1x advantage" and attributes it to "Stackmatix, 2025
(analysis of 12 million visits)." That attribution does not hold.
Following it produced three findings:

1. **Stackmatix does not publish that number.** Stackmatix's own AEO
   conversion benchmark page at
   https://www.stackmatix.com/blog/aeo-conversion-rate (published
   2026-03-11) reports 6.8 percent average conversion for AI answer
   citations against 2 to 3 percent for traditional organic. It cites
   "early industry data," discloses no sample size, no period, and no
   conversion definition, and makes no reference to a 12-million-visit
   analysis.
2. **The 12-million-visit figure belongs to a different party.**
   RankScience's "Why Google Still Matters: The Real Data Behind AI
   Search Hype," Dana Davis, 2025-10-09, at
   https://www.rankscience.com/blog/ai-search-vs-google-traffic-data,
   reports 14.2 percent against 2.8 percent and attributes the 12
   million visits to a Superprompt analysis. RankScience discloses no
   site count, no period, and no statistical controls, and labels its
   own extrapolations "back-of-the-envelope."
3. **There is one resolvable primary behind the pair, and it is not
   Stackmatix.** Opollo's "The 2026 AI Search Benchmark Report," Steven
   Morey, published 2026-02-22 and modified 2026-03-08, at
   https://opollo.com/blog/the-2026-ai-search-benchmark-report/, is the
   origin. Its cohort is 312 IT and technology services firms, which is
   a different funnel from B2B SaaS. Sample and method are in the SEO-2
   note in SOURCES.md.

Two things got fused into one citation: a number from Opollo and a
study attribution belonging to nobody. The Authoricy relay is vendor
content, confidence low, and should not be cited.

One more detail on the pair of papers: Siege Media frames its rebuttal
against Similarweb's 7x claim, not against the 5x figure, so the two
papers are not arguing with each other directly.

### What the initiating brief got right

The Siege Media summary that triggered this check was accurate on every
point: 120+ properties screened, 78 with usable data, 1.26x median
overall, 1.05x for B2B SaaS. The Authoricy summary was accurate that the
page relays 14.2 versus 2.8 and credits Stackmatix with a
12-million-visit analysis. The error is at the source, not in the
summary.
