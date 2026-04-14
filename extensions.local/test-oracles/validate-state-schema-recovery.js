const assert = require("node:assert/strict");
const path = require("node:path");

const fixtures = require("./state-schema-recovery-cases.json");

const HEARTBEAT_STATE_ENTRY_TYPE = "heartbeat-agent-state";
const CODER_POLICY_STATE_ENTRY_TYPE = "coder-policy-state";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createContext(seedEntries) {
  const entries = Array.isArray(seedEntries) ? seedEntries.map((entry) => deepClone(entry)) : [];
  const notifications = [];
  const statuses = [];

  return {
    ctx: {
      hasUI: true,
      sessionManager: {
        getEntries() {
          return entries;
        },
      },
      ui: {
        notify(message, level) {
          notifications.push({ message: String(message), level: String(level || "info") });
        },
        setStatus(id, message) {
          statuses.push({ id: String(id), message: String(message) });
        },
      },
    },
    notifications,
    statuses,
  };
}

function createPi() {
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

async function initAgent(moduleFile, seedEntries) {
  const modulePath = path.resolve(__dirname, moduleFile);
  const loaded = require(modulePath);
  const init = loaded.default || loaded;

  const pi = createPi();
  init(pi);

  const contextBundle = createContext(seedEntries);
  for (const handler of pi.handlers.session_start || []) {
    await handler({}, contextBundle.ctx);
  }

  return {
    pi,
    ctx: contextBundle.ctx,
    notifications: contextBundle.notifications,
  };
}

function lastStateEntry(pi, customType) {
  const relevant = pi.appendedEntries.filter((entry) => entry.customType === customType);
  assert.ok(relevant.length > 0, `expected at least one persisted entry for ${customType}`);
  return relevant[relevant.length - 1].data;
}

function assertMessageIncludes(message, expectedTokens, label) {
  for (const token of expectedTokens) {
    assert.ok(
      message.includes(token),
      `${label}: expected message to include '${token}', got '${message}'`,
    );
  }
}

async function runHeartbeatCase(caseName, fixture) {
  const { pi, ctx, notifications } = await initAgent("../heartbeat-agent.ts", fixture.entries);

  const statusCommand = pi.commands.get("heartbeat");
  assert.ok(statusCommand, "missing heartbeat status command");
  await statusCommand.handler("", ctx);

  const statusLine = notifications.map((item) => item.message).find((message) => message.includes("enabled="));
  assert.ok(statusLine, `${caseName}: expected heartbeat status notification`);
  assertMessageIncludes(statusLine, fixture.expectedStatusIncludes, `heartbeat/${caseName}`);

  const persistCommand = pi.commands.get("heartbeat-pause");
  assert.ok(persistCommand, "missing heartbeat pause command");
  await persistCommand.handler("", ctx);

  const persisted = lastStateEntry(pi, HEARTBEAT_STATE_ENTRY_TYPE);
  assert.equal(persisted.schemaVersion, 1, `${caseName}: heartbeat persisted schemaVersion mismatch`);
}

async function runCoderPolicyCase(caseName, fixture) {
  const { pi, ctx, notifications } = await initAgent("../coder-policy.ts", fixture.entries);

  const statusCommand = pi.commands.get("coder-policy");
  assert.ok(statusCommand, "missing coder-policy status command");
  await statusCommand.handler("", ctx);

  const statusLine = notifications.map((item) => item.message).find((message) => message.includes("coder-policy strict="));
  assert.ok(statusLine, `${caseName}: expected coder-policy status notification`);
  assertMessageIncludes(statusLine, fixture.expectedStatusIncludes, `coder-policy/${caseName}`);

  const persistCommand = pi.commands.get("coder-policy-repair");
  assert.ok(persistCommand, "missing coder-policy-repair command");
  await persistCommand.handler("on", ctx);

  const persisted = lastStateEntry(pi, CODER_POLICY_STATE_ENTRY_TYPE);
  assert.equal(persisted.schemaVersion, 1, `${caseName}: coder-policy persisted schemaVersion mismatch`);
}

async function run() {
  for (const [caseName, fixture] of Object.entries(fixtures.heartbeat || {})) {
    await runHeartbeatCase(caseName, fixture);
  }

  for (const [caseName, fixture] of Object.entries(fixtures.coderPolicy || {})) {
    await runCoderPolicyCase(caseName, fixture);
  }

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "state-schema-recovery-cases.json"));
  console.log(`State schema recovery oracle checks passed using ${fixturePath}`);
}

run().catch((error) => {
  console.error("State schema recovery oracle checks failed:", error);
  process.exitCode = 1;
});
