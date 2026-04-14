const assert = require("node:assert/strict");
const path = require("node:path");

const fixtures = require("./adapter-cases.json");
const {
  collectDirectSignalsFromPayload,
  chooseDirectThenProbeThenFallback,
} = require("../signal-adapters");

function runDirectExtractionCases() {
  for (const fixture of fixtures.directExtraction || []) {
    const result = collectDirectSignalsFromPayload(fixture.payload);

    assert.equal(result.hasAny, fixture.expected.hasAny, `${fixture.name}: unexpected hasAny`);

    if (fixture.expected.diagnostics === null) {
      assert.equal(result.diagnostics, null, `${fixture.name}: diagnostics should be null`);
    } else {
      assert.deepEqual(result.diagnostics, fixture.expected.diagnostics, `${fixture.name}: diagnostics mismatch`);
    }

    if (fixture.expected.tests === null) {
      assert.equal(result.tests, null, `${fixture.name}: tests should be null`);
    } else {
      assert.deepEqual(result.tests, fixture.expected.tests, `${fixture.name}: tests mismatch`);
    }

    if (fixture.expected.git === null) {
      assert.equal(result.git, null, `${fixture.name}: git should be null`);
    } else {
      assert.deepEqual(result.git, fixture.expected.git, `${fixture.name}: git mismatch`);
    }
  }
}

function runPrecedenceCases() {
  for (const fixture of fixtures.precedence || []) {
    const result = chooseDirectThenProbeThenFallback(fixture.input);

    assert.equal(result.sourceTier, fixture.expected.sourceTier, `${fixture.name}: sourceTier mismatch`);
    assert.equal(
      result.diagnostics.errorCount,
      fixture.expected.diagnosticsErrorCount,
      `${fixture.name}: diagnostics errorCount mismatch`,
    );
    assert.equal(
      result.tests.failedCount,
      fixture.expected.testsFailedCount,
      `${fixture.name}: tests failedCount mismatch`,
    );
    assert.equal(result.git.branch, fixture.expected.gitBranch, `${fixture.name}: git branch mismatch`);
  }
}

function run() {
  runDirectExtractionCases();
  runPrecedenceCases();

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "adapter-cases.json"));
  console.log(`Signal adapter oracle checks passed using ${fixturePath}`);
}

run();
