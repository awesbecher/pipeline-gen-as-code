# Plan templates

Three artifacts, all in `plan/`. Dates and owners are mandatory; a plan
without them is a wish. Generated files are gitignored except this
folder's README, so the user's numbers never end up in a public fork by
accident.

## plan/PLAN.md

    # Pipeline plan · {company} · {date}

    Target: {arr_now} to {arr_target} in 12 months.
    Monthly pipeline budget: {cash}. Team: {aes_ramped} ramped AEs,
    {aes_ramping} ramping, {bdrs} BDRs, GTM engineer: {yes/no}.

    ## The portfolio

    {the verdict table from engine/run.cjs, verbatim}

    {one short paragraph: why this mix, in plain language, referencing
    the two or three parameters that drove it}

    ## Engine plans

    One block per run_now engine, in budget order:

    ### {NN} {Engine name} · {monthly budget}
    Owner: {name}. Why it is on: {reason from the verdict}.
    First 90 days: {the three phases from the engine's operating card,
    adapted to this company's specifics; steal the card's language}
    The bar: {the engine's KPI range, quoted}
    Tripwire: {the engine's tripwire, adapted}

    One block per instrument_now engine, shorter:

    ### {NN} {Engine name} · {monthly budget}
    Owner: {name}. What gets built this quarter: {from the card}.
    Graduation gate: {when it converts to run_now}

    ## Deferred and blocked

    {engine}: {reason}. Revisit: {the named gate}.

    ## The capacity check

    {the capacity section from engine/run.cjs when params include the
    capacity block: steady-state, bridge, hires by month, payroll}

    ## The standing rule

    A human approves every external send, in every engine, always.

    Benchmark ranges are directional, drawn from operating experience;
    the 2026 market data is industry-reported.

## plan/monday.md

Overwrite weekly; the review file carries history.

    # Monday plan · week of {date}

    ## This week, per engine

    ### {Engine name}
    - {two to four concrete touches: lists to build, sequences to
      draft for approval, calls to make, posts to write, pages to ship}
    - Friday number: {the one metric that gets inspected}

    ## Waiting on
    - {approvals, data, budget decisions blocking an engine}

## plan/review.md

Append weekly; newest on top.

    ## Review · week of {date}

    | Engine | Friday number | Plan said | Verdict |
    |--------|---------------|-----------|---------|
    | {name} | {actual} | {planned} | held / missed / beat |

    What moved: {two sentences maximum}
    What changes next week: {one decision, not a list}
    Tripwires checked: {any engine near its tripwire, or "none near"}
