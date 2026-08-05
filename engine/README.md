# engine/

Deterministic, dependency-free math.

- `mix.cjs` maps company params to the nine-engine portfolio:
  verdicts, reasons, minimum-spend floors, and the exact budget split.
- `engine.cjs` is the sales capacity model ported from the workbook:
  seats, ramp, hiring schedule, BDR and SE support, payroll.
- `params.cjs` is the schema. Invalid input fails closed with field
  names; nothing fails open.
- `run.cjs` is the CLI over all three.

All four are CommonJS. They were renamed from `.js` in 0.3.1 so an
ancestor `package.json` carrying `"type": "module"` cannot break them.

## Running it

The runner takes a params path or `--example`. Calling
`node engine/run.cjs` with no arguments exits 2; there is no fallback
to sample data.

```bash
node engine/run.cjs company/params.yaml           # verdicts + capacity
node engine/run.cjs company/params.yaml --json    # machine-readable
node engine/run.cjs company/params.yaml --board   # BOARD.md memo
node engine/run.cjs --example                     # the Acme fixture
node engine/run.cjs --help
node engine/run.cjs --version
```

## Tests

Five suites. Run all five after any change in this directory.

```bash
node engine/test-engine.cjs      # capacity model against named, pinned fixtures
node engine/test-mix.cjs         # verdict logic, thresholds, floors, constraint sweep
node engine/test-params.cjs      # schema: every fail-open case fails closed
node engine/test-docs.cjs        # docs publish the same numbers as the fixtures
node engine/test-packaging.cjs   # package layout, bin, and manifest agreement
```

`fixtures.json` holds the exact pins. Regenerating it
(`node engine/gen-fixtures.cjs`) is a deliberate, reviewed act. The
workbook-schedule fixture carries a stated $50 parity tolerance
because the source workbook rounds monthly cells; the model's own
numbers are pinned exactly.
