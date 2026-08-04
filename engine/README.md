# engine/

Deterministic, dependency-free math. mix.js maps company params to the
nine-engine portfolio (verdicts, reasons, budget split). engine.js is
the sales capacity model, ported from the workbook and verified to the
dollar. run.cjs is the CLI over both (`node engine/run.cjs`). The two
test files (test-mix.cjs, test-engine.cjs) must stay green; run them
after any change here.
