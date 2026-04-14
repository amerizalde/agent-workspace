const assert = require("node:assert/strict");
const path = require("node:path");

const { parsePolicyDiscriminatorOutput } = require("../output-parsers");
const fixtures = require("./policy-discriminator-cases.json");

function runExpectedPassCases() {
  for (const fixture of fixtures.expectedPass || []) {
    const result = parsePolicyDiscriminatorOutput(fixture.text);

    assert.equal(
      result.ok,
      true,
      `expectedPass case '${fixture.name}' should parse successfully. reason=${result.reason || "n/a"}`,
    );
    assert.ok(result.data, `expectedPass case '${fixture.name}' returned no parsed data`);

    if (fixture.expected) {
      assert.equal(result.data.verdict, fixture.expected.verdict, `${fixture.name}: verdict mismatch`);
      assert.equal(result.data.confidence, fixture.expected.confidence, `${fixture.name}: confidence mismatch`);
      assert.equal(result.data.failedCheckCount, fixture.expected.failedCheckCount, `${fixture.name}: failedCheckCount mismatch`);
      assert.equal(result.data.fixDirectiveCount, fixture.expected.fixDirectiveCount, `${fixture.name}: fixDirectiveCount mismatch`);
    }
  }
}

function runExpectedFailCases() {
  for (const fixture of fixtures.expectedFail || []) {
    const result = parsePolicyDiscriminatorOutput(fixture.text);

    assert.equal(result.ok, false, `expectedFail case '${fixture.name}' should fail parse`);
    assert.ok(result.reason, `expectedFail case '${fixture.name}' should include a failure reason`);

    if (fixture.expectedReasonIncludes) {
      assert.ok(
        String(result.reason).includes(fixture.expectedReasonIncludes),
        `${fixture.name}: expected reason to include '${fixture.expectedReasonIncludes}', got '${result.reason}'`,
      );
    }
  }
}

function run() {
  runExpectedPassCases();
  runExpectedFailCases();

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "policy-discriminator-cases.json"));
  console.log(`Policy discriminator oracle checks passed using ${fixturePath}`);
}

run();
