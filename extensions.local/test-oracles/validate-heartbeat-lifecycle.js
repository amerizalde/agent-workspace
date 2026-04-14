const assert = require("node:assert/strict");
const path = require("node:path");

const lifecycleCases = require("./heartbeat-lifecycle-cases.json");

const HEARTBEAT_STATE_ENTRY_TYPE = "heartbeat-agent-state";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMockContext(seedEntries) {
  const entries = Array.isArray(seedEntries) ? [...seedEntries] : [];
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
    entries,
    notifications,
    statuses,
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
  const userMessages = [];

  return {
    handlers,
    commands,
    appendedEntries,
    userMessages,
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
    sendUserMessage(text, options) {
      userMessages.push({ text: String(text), options: options || {} });
    },
  };
}

async function initAgentWithState(initialStateData) {
  const heartbeatModule = require(path.resolve(__dirname, "../heartbeat-agent.ts"));
  const initAgent = heartbeatModule.default || heartbeatModule;

  const pi = createMockPi();
  initAgent(pi);

  const seedEntries = initialStateData
    ? [{ type: "custom", customType: HEARTBEAT_STATE_ENTRY_TYPE, data: deepClone(initialStateData) }]
    : [];
  const contextBundle = createMockContext(seedEntries);

  const sessionStartHandlers = pi.handlers.session_start || [];
  for (const handler of sessionStartHandlers) {
    await handler({}, contextBundle.ctx);
  }

  return {
    pi,
    ctx: contextBundle.ctx,
    notifications: contextBundle.notifications,
    statuses: contextBundle.statuses,
  };
}

function lastPersistedState(pi) {
  const relevant = pi.appendedEntries.filter((entry) => entry.customType === HEARTBEAT_STATE_ENTRY_TYPE);
  assert.ok(relevant.length > 0, "expected heartbeat state persistence to occur");
  return relevant[relevant.length - 1].data;
}

function getCommand(pi, name) {
  const command = pi.commands.get(name);
  assert.ok(command, `missing command registration: ${name}`);
  return command;
}

function assertHistoryTail(state, expectedAction, expectedDecision) {
  assert.ok(Array.isArray(state.history), "state history should be an array");
  assert.ok(state.history.length > 0, "state history should have at least one entry");
  const tail = state.history[state.history.length - 1];
  assert.equal(tail.action, expectedAction, `expected tail action '${expectedAction}', got '${tail.action}'`);
  if (expectedDecision) {
    assert.equal(
      tail.approvalDecision,
      expectedDecision,
      `expected tail approval decision '${expectedDecision}', got '${tail.approvalDecision}'`,
    );
  }
}

async function runDecisionCase(caseName, fixture) {
  const { pi, ctx } = await initAgentWithState(fixture.initialState);

  const commandName = fixture.decision === "approved"
    ? "heartbeat-approve"
    : fixture.decision === "deferred"
      ? "heartbeat-defer"
      : "heartbeat-reject";

  const command = getCommand(pi, commandName);
  await command.handler("", ctx);

  const state = lastPersistedState(pi);
  assert.equal(state.lastApprovalDecision, fixture.expected.lastApprovalDecision, `${caseName}: wrong approval decision`);
  assert.equal(state.pendingApproval, fixture.expected.pendingApproval, `${caseName}: pendingApproval should be cleared`);
  assert.ok(
    String(state.lastOutcome || "").includes(fixture.expected.lastOutcomeIncludes),
    `${caseName}: lastOutcome mismatch '${state.lastOutcome}'`,
  );
  assert.equal(
    pi.userMessages.length,
    fixture.expected.sendUserMessageCount,
    `${caseName}: unexpected dispatched handoff count`,
  );
  assertHistoryTail(state, fixture.expected.historyAction, fixture.expected.historyApprovalDecision);
}

async function runTimeoutCase(fixture) {
  const { pi, ctx } = await initAgentWithState(fixture.initialState);

  const command = getCommand(pi, "heartbeat-run-once");
  await command.handler("", ctx);

  const state = lastPersistedState(pi);
  assert.equal(state.lastApprovalDecision, fixture.expected.lastApprovalDecision);
  assert.equal(state.pendingApproval, fixture.expected.pendingApproval);

  const hasTimeoutHistory = state.history.some(
    (entry) => entry && entry.trigger === fixture.expected.historyTrigger && entry.approvalDecision === fixture.expected.historyApprovalDecision,
  );
  assert.ok(hasTimeoutHistory, "timeout case should include deferred timeout history entry");
}

async function runReloadRecoveryCase(fixture) {
  const { pi, ctx, notifications } = await initAgentWithState(fixture.initialState);

  const pendingCommand = getCommand(pi, "heartbeat-pending");
  await pendingCommand.handler("", ctx);

  const pendingMessage = notifications.map((item) => item.message).find((msg) => msg.includes("pending cycle="));
  assert.ok(pendingMessage, "reload recovery should expose pending approval details");
  assert.ok(pendingMessage.includes(fixture.expected.pendingNotifyIncludes));
  assert.ok(pendingMessage.includes(fixture.expected.pendingNotifyRiskIncludes));
}

async function run() {
  await runDecisionCase("approve", lifecycleCases.approve);
  await runDecisionCase("defer", lifecycleCases.defer);
  await runDecisionCase("reject", lifecycleCases.reject);
  await runTimeoutCase(lifecycleCases.timeout);
  await runReloadRecoveryCase(lifecycleCases.reloadRecovery);

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "heartbeat-lifecycle-cases.json"));
  console.log(`Heartbeat lifecycle oracle checks passed using ${fixturePath}`);
}

run().catch((error) => {
  console.error("Heartbeat lifecycle oracle checks failed:", error);
  process.exitCode = 1;
});