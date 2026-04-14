const assert = require("node:assert/strict");
const path = require("node:path");

const {
  parseHeartbeatMaintainerOutput,
  parsePolicyDiscriminatorOutput,
  parseOrchestratorResultPayload,
} = require("../output-parsers");
const fixtures = require("./parser-cases.json");

function validateCases(cases, parseFn, expectedOk, categoryName) {
  for (const fixture of cases) {
    const result = parseFn(fixture.text);
    assert.equal(
      result.ok,
      expectedOk,
      `${categoryName} case '${fixture.name}' expected ok=${expectedOk} but got ${result.ok}. reason=${result.reason || "n/a"}`,
    );

    if (expectedOk) {
      assert.ok(result.data, `${categoryName} case '${fixture.name}' returned no data`);
    } else {
      assert.ok(result.reason, `${categoryName} case '${fixture.name}' returned no failure reason`);
    }
  }
}

function run() {
  validateCases(fixtures.heartbeat.valid, parseHeartbeatMaintainerOutput, true, "heartbeat.valid");
  validateCases(fixtures.heartbeat.invalid, parseHeartbeatMaintainerOutput, false, "heartbeat.invalid");

  validateCases(fixtures.policy.valid, parsePolicyDiscriminatorOutput, true, "policy.valid");
  validateCases(fixtures.policy.invalid, parsePolicyDiscriminatorOutput, false, "policy.invalid");

  validateCases(fixtures.orchestrator.valid, parseOrchestratorResultPayload, true, "orchestrator.valid");
  validateCases(fixtures.orchestrator.invalid, parseOrchestratorResultPayload, false, "orchestrator.invalid");

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "parser-cases.json"));
  console.log(`Parser oracle checks passed using ${fixturePath}`);
}

run();
