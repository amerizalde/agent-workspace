const assert = require("node:assert/strict");
const path = require("node:path");

const lifecycleCases = require("./heartbeat-lifecycle-enrichment-cases.json");

const HEARTBEAT_STATE_ENTRY_TYPE = "heartbeat-agent-state";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMockContext(seedEntries) {
  const entries = Array.isArray(seedEntries) ? [...seedEntries] : [];

  return {
    ctx: {
      hasUI: true,
      sessionManager: {
        getEntries() {
          return entries;
        },
      },
      ui: {
        notify() {},
        setStatus() {},
      },
    },
    entries,
  };
}

function createMockPi() {
  const handlers = {
    session_start: [],
    turn_start: [],
    before_agent_start: [],
    tool_call: [],
    tool_result: [],
  };

  const commands = new Map();
  const appendedEntries = [];

  return {
    handlers,
    commands,
    appendedEntries,
    on(eventName, handler) {
      if (!handlers[eventName]) handlers[eventName] = [];
      handlers[eventName].push(handler);
    },
    registerCommand(name, commandDef) {
      commands.set(name, commandDef);
    },
    appendEntry(customType, data) {
      appendedEntries.push({ customType, data: deepClone(data) });
    },
    sendUserMessage() {},
  };
}

async function initAgentWithEntries(seedEntries) {
  const heartbeatModule = require(path.resolve(__dirname, "../heartbeat-agent.ts"));
  const initAgent = heartbeatModule.default || heartbeatModule;

  const pi = createMockPi();
  initAgent(pi);

  const contextBundle = createMockContext(seedEntries);

  for (const handler of pi.handlers.session_start || []) {
    await handler({}, contextBundle.ctx);
  }

  return {
    pi,
    ctx: contextBundle.ctx,
  };
}

function lastPersistedState(pi) {
  const relevant = pi.appendedEntries.filter((entry) => entry.customType === HEARTBEAT_STATE_ENTRY_TYPE);
  assert.ok(relevant.length > 0, "expected heartbeat state persistence to occur");
  return relevant[relevant.length - 1].data;
}

async function runOrchestratorEnrichmentCase(fixture) {
  const seedEntries = [
    { type: "custom", customType: HEARTBEAT_STATE_ENTRY_TYPE, data: deepClone(fixture.initialState) },
    deepClone(fixture.assistantEntry),
  ];

  const { pi, ctx } = await initAgentWithEntries(seedEntries);

  for (const handler of pi.handlers.turn_start || []) {
    await handler({}, ctx);
  }

  const state = lastPersistedState(pi);
  assert.ok(state.lastOrchestratorAudit, "expected lastOrchestratorAudit to be persisted");
  assert.equal(state.lastOrchestratorAudit.status, fixture.expected.status);
  assert.equal(state.lastOrchestratorAudit.verdict, fixture.expected.verdict);
  assert.equal(state.lastOrchestratorAudit.attemptsUsed, fixture.expected.attemptsUsed);
  assert.equal(state.lastOrchestratorAudit.retryCount, fixture.expected.retryCount);
  assert.ok(
    Array.isArray(state.lastOrchestratorAudit.filesTouched)
      && state.lastOrchestratorAudit.filesTouched.includes(fixture.expected.filesTouchedIncludes),
    "expected filesTouched to contain expected file",
  );
  assert.ok(
    String(state.lastOrchestratorAudit.policySummary || "").includes(fixture.expected.policySummaryIncludes),
    "expected policySummary to include expected text",
  );
  assert.equal(state.lastOrchestratorAudit.nextAction, fixture.expected.nextAction);

  const tail = state.history[state.history.length - 1];
  assert.ok(tail && tail.orchestratorAudit, "expected history tail to include orchestratorAudit");
  assert.equal(tail.orchestratorAudit.status, fixture.expected.status);
  assert.equal(tail.orchestratorAudit.attemptsUsed, fixture.expected.attemptsUsed);
}

async function run() {
  await runOrchestratorEnrichmentCase(lifecycleCases.orchestratorEnrichment);

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "heartbeat-lifecycle-enrichment-cases.json"));
  console.log(`Heartbeat lifecycle enrichment oracle checks passed using ${fixturePath}`);
}

run().catch((error) => {
  console.error("Heartbeat lifecycle enrichment oracle checks failed:", error);
  process.exitCode = 1;
});
