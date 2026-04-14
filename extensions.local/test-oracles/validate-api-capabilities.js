const assert = require("node:assert/strict");
const path = require("node:path");

const capabilityCases = require("./api-capability-cases.json");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMockContext(seedEntries, missing) {
  const entries = Array.isArray(seedEntries) ? deepClone(seedEntries) : [];
  const notifications = [];
  const statuses = [];

  const missingSet = new Set(Array.isArray(missing) ? missing : []);

  const sessionManager = missingSet.has("ctx.sessionManager.getEntries")
    ? {}
    : {
        getEntries() {
          return entries;
        },
      };

  const ui = {};
  if (!missingSet.has("ctx.ui.notify")) {
    ui.notify = (message, level) => {
      notifications.push({ message: String(message), level: String(level || "info") });
    };
  }
  if (!missingSet.has("ctx.ui.setStatus")) {
    ui.setStatus = (id, message) => {
      statuses.push({ id: String(id), message: String(message) });
    };
  }

  return {
    ctx: {
      hasUI: true,
      sessionManager,
      ui,
    },
    notifications,
    statuses,
  };
}

function createMockPi(missing) {
  const missingSet = new Set(Array.isArray(missing) ? missing : []);
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

  const pi = {
    handlers,
    commands,
    appendedEntries,
    userMessages,
    on(eventName, handler) {
      if (!handlers[eventName]) handlers[eventName] = [];
      handlers[eventName].push(handler);
    },
  };

  if (!missingSet.has("pi.registerCommand")) {
    pi.registerCommand = (name, commandDef) => {
      commands.set(name, commandDef);
    };
  }

  if (!missingSet.has("pi.appendEntry")) {
    pi.appendEntry = (customType, data) => {
      appendedEntries.push({ customType, data: deepClone(data) });
    };
  }

  if (!missingSet.has("pi.sendUserMessage")) {
    pi.sendUserMessage = (text, options) => {
      userMessages.push({ text: String(text), options: options || {} });
    };
  }

  return pi;
}

async function runCase(fixture) {
  const heartbeatModule = require(path.resolve(__dirname, "../heartbeat-agent.ts"));
  const initAgent = heartbeatModule.default || heartbeatModule;

  const pi = createMockPi(fixture.missing);
  const contextBundle = createMockContext(fixture.seedEntries, fixture.missing);

  assert.doesNotThrow(() => {
    initAgent(pi);
  }, `${fixture.name}: initialization should not throw`);

  const sessionStartHandlers = pi.handlers.session_start || [];
  for (const handler of sessionStartHandlers) {
    await assert.doesNotReject(
      Promise.resolve(handler({}, contextBundle.ctx)),
      `${fixture.name}: session_start handler should not reject`,
    );
  }

  const turnStartHandlers = pi.handlers.turn_start || [];
  for (const handler of turnStartHandlers) {
    await assert.doesNotReject(
      Promise.resolve(handler({}, contextBundle.ctx)),
      `${fixture.name}: turn_start handler should not reject`,
    );
  }

  for (const commandName of fixture.commands || []) {
    const command = pi.commands.get(commandName);
    assert.ok(command, `${fixture.name}: missing command registration: ${commandName}`);
    await assert.doesNotReject(
      Promise.resolve(command.handler("", contextBundle.ctx)),
      `${fixture.name}: command '${commandName}' should not reject`,
    );
  }

  const stopCommand = pi.commands.get("heartbeat-stop");
  if (stopCommand) {
    await assert.doesNotReject(
      Promise.resolve(stopCommand.handler("", contextBundle.ctx)),
      `${fixture.name}: cleanup command 'heartbeat-stop' should not reject`,
    );
  }

  const shouldRegisterCommands = Boolean(fixture.expect?.shouldRegisterCommands);
  if (shouldRegisterCommands) {
    assert.ok(pi.commands.size > 0, `${fixture.name}: expected commands to be registered`);
  } else {
    assert.equal(pi.commands.size, 0, `${fixture.name}: expected no registered commands`);
  }

  const shouldPersist = Boolean(fixture.expect?.shouldPersist);
  if (shouldPersist) {
    assert.ok(pi.appendedEntries.length > 0, `${fixture.name}: expected state persistence entries`);
  } else {
    assert.equal(pi.appendedEntries.length, 0, `${fixture.name}: expected no persisted entries`);
  }

  const statusCountMin = Number(fixture.expect?.statusCountMin || 0);
  assert.ok(
    contextBundle.statuses.length >= statusCountMin,
    `${fixture.name}: expected at least ${statusCountMin} status updates`,
  );

  const notificationsText = contextBundle.notifications.map((item) => item.message).join("\n");
  for (const expectedFragment of fixture.expect?.notificationIncludes || []) {
    assert.ok(
      notificationsText.includes(expectedFragment),
      `${fixture.name}: expected notification fragment '${expectedFragment}'`,
    );
  }
}

async function run() {
  for (const fixture of capabilityCases.scenarios || []) {
    await runCase(fixture);
  }

  const fixturePath = path.relative(process.cwd(), path.resolve(__dirname, "api-capability-cases.json"));
  console.log(`API capability oracle checks passed using ${fixturePath}`);
}

run().catch((error) => {
  console.error("API capability oracle checks failed:", error);
  process.exitCode = 1;
});
