// @ts-nocheck
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  parseHeartbeatMaintainerOutput,
  parsePolicyDiscriminatorOutput,
  parseOrchestratorResultPayload,
} = require("./output-parsers");
const {
  collectDirectSignalsFromPayload,
  chooseDirectThenProbeThenFallback,
} = require("./signal-adapters");

type HeartbeatActionName = "idle" | "summarize" | "maintenance-pass" | "awaiting-approval";
type ApprovalDecision = "approved" | "deferred" | "rejected";

type DiagnosticsSignal = {
  available: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
};

type TestFailureSignal = {
  available: boolean;
  failedCount: number;
  hasFailures: boolean;
};

type GitStateSignal = {
  available: boolean;
  isDirty: boolean;
  stagedCount: number;
  unstagedCount: number;
  branch: string | null;
};

type HeartbeatSignals = {
  collectedAt: string;
  sourceTier: "session-typed" | "cached" | "external-probe" | "direct-adapter";
  recentEntryCount: number;
  userEntryCount: number;
  assistantEntryCount: number;
  textualErrorCount: number;
  failureMentionCount: number;
  fileMentionCount: number;
  diagnostics: DiagnosticsSignal;
  tests: TestFailureSignal;
  git: GitStateSignal;
};

type ExternalSignalProbe = {
  collectedAt: string;
  diagnostics?: Partial<DiagnosticsSignal>;
  tests?: Partial<TestFailureSignal>;
  git?: Partial<GitStateSignal>;
};

type HeartbeatRequestEnvelope = {
  cycle: number;
  trigger: string;
  dryRun: boolean;
  editEnabled: boolean;
  requireApproval: boolean;
  focusPrompt: string;
  reason: string;
  fingerprint: string;
  signals: HeartbeatSignals;
  allowedActions: string[];
};

type PendingApproval = {
  cycle: number;
  fingerprint: string;
  objective: string;
  riskLevel: "low" | "medium" | "high";
  request: HeartbeatRequestEnvelope;
  createdAt: string;
  expiresAt: string;
};

type ApprovalApplyResult = {
  applied: boolean;
  level: "info" | "warning";
  notification: string;
};

type OrchestratorAuditMetadata = {
  status?: "passed" | "failed" | null;
  verdict?: string | null;
  attemptsUsed?: number | null;
  retryCount?: number | null;
  filesTouched?: string[];
  policySummary?: string | null;
  nextAction?: string | null;
  handoffTarget?: string | null;
  capturedAt: string;
};

type HeartbeatHistoryEntry = {
  cycle: number;
  trigger: string;
  action: HeartbeatActionName;
  outcome: string;
  at: string;
  approvalDecision?: ApprovalDecision;
  orchestratorAudit?: OrchestratorAuditMetadata;
};

type HeartbeatState = {
  enabled: boolean;
  paused: boolean;
  dryRun: boolean;
  editEnabled: boolean;
  requireApproval: boolean;
  intervalSeconds: number;
  cycle: number;
  lastRunAt: string | null;
  lastAction: HeartbeatActionName;
  lastOutcome: string;
  focusPrompt: string;
  recentIssueFingerprint: string | null;
  lastSignalFingerprint: string | null;
  signalCacheTtlSeconds: number;
  externalProbeTtlSeconds: number;
  approvalTimeoutSeconds: number;
  lastSignals: HeartbeatSignals | null;
  lastExternalProbe: ExternalSignalProbe | null;
  pendingApproval: PendingApproval | null;
  lastApprovalDecision: ApprovalDecision | null;
  lastOrchestratorAudit: OrchestratorAuditMetadata | null;
  consecutiveFailures: number;
  backoffLevel: number;
  maxConsecutiveFailures: number;
  maxHistory: number;
  history: HeartbeatHistoryEntry[];
};

const STATE_ENTRY_TYPE = "heartbeat-agent-state";
const STATE_SCHEMA_VERSION = 1;
const STATUS_ID = "heartbeat-agent";
const DEFAULT_STATE: HeartbeatState = {
  enabled: false,
  paused: false,
  dryRun: true,
  editEnabled: false,
  requireApproval: true,
  intervalSeconds: 300,
  cycle: 0,
  lastRunAt: null,
  lastAction: "idle",
  lastOutcome: "idle",
  focusPrompt: "Keep the workspace healthy with one bounded maintenance objective per cycle.",
  recentIssueFingerprint: null,
  lastSignalFingerprint: null,
  signalCacheTtlSeconds: 120,
  externalProbeTtlSeconds: 300,
  approvalTimeoutSeconds: 3600,
  lastSignals: null,
  lastExternalProbe: null,
  pendingApproval: null,
  lastApprovalDecision: null,
  lastOrchestratorAudit: null,
  consecutiveFailures: 0,
  backoffLevel: 0,
  maxConsecutiveFailures: 3,
  maxHistory: 25,
  history: [],
};

let heartbeatState: HeartbeatState = cloneDefaultState();
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
let activeContext: any = null;
let cycleInFlight = false;

function noteDegraded(message: string): void {
  const normalized = String(message || "").trim();
  if (!normalized) return;
  const marker = `[degraded] ${normalized}`;
  if (String(heartbeatState.lastOutcome || "").includes(marker)) return;

  heartbeatState.lastOutcome = heartbeatState.lastOutcome && heartbeatState.lastOutcome !== "idle"
    ? `${heartbeatState.lastOutcome} | ${marker}`
    : marker;
}

function getSessionEntries(ctx: any, source: string): any[] {
  const getEntries = ctx?.sessionManager?.getEntries;
  if (typeof getEntries !== "function") {
    noteDegraded(`ctx.sessionManager.getEntries unavailable (${source})`);
    return [];
  }

  try {
    const entries = getEntries.call(ctx.sessionManager);
    if (!Array.isArray(entries)) {
      noteDegraded(`ctx.sessionManager.getEntries returned non-array (${source})`);
      return [];
    }
    return entries;
  } catch (error) {
    noteDegraded(`ctx.sessionManager.getEntries failed (${source}): ${String(error)}`);
    return [];
  }
}

function appendStateEntry(pi: ExtensionAPI, customType: string, data: unknown): boolean {
  const appendEntry = (pi as any)?.appendEntry;
  if (typeof appendEntry !== "function") {
    noteDegraded("pi.appendEntry unavailable");
    return false;
  }

  try {
    appendEntry.call(pi, customType, data);
    return true;
  } catch (error) {
    noteDegraded(`pi.appendEntry failed: ${String(error)}`);
    return false;
  }
}

function sendSteerMessage(pi: ExtensionAPI, text: string, reason: string): boolean {
  const sendUserMessage = (pi as any)?.sendUserMessage;
  if (typeof sendUserMessage !== "function") {
    noteDegraded(`pi.sendUserMessage unavailable (${reason})`);
    return false;
  }

  try {
    sendUserMessage.call(pi, text, { deliverAs: "steer" });
    return true;
  } catch (error) {
    noteDegraded(`pi.sendUserMessage failed (${reason}): ${String(error)}`);
    return false;
  }
}

function registerHeartbeatCommand(pi: ExtensionAPI, name: string, commandDef: any): boolean {
  const registerCommand = (pi as any)?.registerCommand;
  if (typeof registerCommand !== "function") {
    noteDegraded(`pi.registerCommand unavailable (${name})`);
    return false;
  }

  try {
    registerCommand.call(pi, name, commandDef);
    return true;
  } catch (error) {
    noteDegraded(`pi.registerCommand failed (${name}): ${String(error)}`);
    return false;
  }
}

function safeUiNotify(ctx: any, message: string, level: string): boolean {
  if (!ctx?.hasUI) return false;
  const notifyFn = ctx?.ui?.notify;
  if (typeof notifyFn !== "function") {
    noteDegraded("ctx.ui.notify unavailable");
    return false;
  }

  try {
    notifyFn.call(ctx.ui, message, level);
    return true;
  } catch (error) {
    noteDegraded(`ctx.ui.notify failed: ${String(error)}`);
    return false;
  }
}

function safeUiSetStatus(ctx: any, id: string, message: string): boolean {
  if (!ctx?.hasUI) return false;
  const setStatusFn = ctx?.ui?.setStatus;
  if (typeof setStatusFn !== "function") {
    noteDegraded("ctx.ui.setStatus unavailable");
    return false;
  }

  try {
    setStatusFn.call(ctx.ui, id, message);
    return true;
  } catch (error) {
    noteDegraded(`ctx.ui.setStatus failed: ${String(error)}`);
    return false;
  }
}

function cloneDefaultState(): HeartbeatState {
  return {
    ...DEFAULT_STATE,
    history: [],
    lastSignals: null,
    lastExternalProbe: null,
    pendingApproval: null,
    lastOrchestratorAudit: null,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function summarizeObjective(text: string, maxLength: number = 140): string {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "n/a";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatSecondsRemaining(expiresAt: string): string {
  const expiresAtMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) return "unknown";

  const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatPendingApprovalMessage(pending: PendingApproval): string {
  return [
    `pending cycle=${pending.cycle}`,
    `risk=${pending.riskLevel}`,
    `expiresIn=${formatSecondsRemaining(pending.expiresAt)}`,
    `objective=${summarizeObjective(pending.objective)}`,
    "actions=/heartbeat-approve | /heartbeat-defer | /heartbeat-reject",
  ].join(" ");
}

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function secondsSince(value: string | null): number {
  const parsed = toDate(value);
  if (!parsed) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - parsed.getTime()) / 1000);
}

function clampInterval(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_STATE.intervalSeconds;
  return Math.max(30, Math.min(3600, Math.floor(seconds)));
}

function clampSignalTtl(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_STATE.signalCacheTtlSeconds;
  return Math.max(15, Math.min(900, Math.floor(seconds)));
}

function clampExternalProbeTtl(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_STATE.externalProbeTtlSeconds;
  return Math.max(30, Math.min(3600, Math.floor(seconds)));
}

function clampApprovalTimeout(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_STATE.approvalTimeoutSeconds;
  return Math.max(60, Math.min(86_400, Math.floor(seconds)));
}

function clampOptionalNumber(
  value: unknown,
  fallback: number,
  clamp: (seconds: number) => number,
): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value) : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clampRangeInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function asHeartbeatAction(value: unknown, fallback: HeartbeatActionName): HeartbeatActionName {
  return value === "idle" || value === "summarize" || value === "maintenance-pass" || value === "awaiting-approval"
    ? value
    : fallback;
}

function asApprovalDecision(value: unknown, fallback: ApprovalDecision | null): ApprovalDecision | null {
  return value === "approved" || value === "deferred" || value === "rejected" ? value : fallback;
}

function normalizeHistoryEntries(value: unknown, maxHistory: number): HeartbeatHistoryEntry[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      const cycle = clampRangeInt(record.cycle, 0, Number.MAX_SAFE_INTEGER, 0);
      const trigger = typeof record.trigger === "string" ? record.trigger : "unknown";
      const action = asHeartbeatAction(record.action, "idle");
      const outcome = typeof record.outcome === "string" ? record.outcome : "unknown";
      const at = typeof record.at === "string" ? record.at : nowIso();
      const approvalDecision = asApprovalDecision(record.approvalDecision, null) ?? undefined;

      const historyEntry: HeartbeatHistoryEntry = {
        cycle,
        trigger,
        action,
        outcome,
        at,
      };

      if (approvalDecision) historyEntry.approvalDecision = approvalDecision;

      const orchestratorAudit = asRecord(record.orchestratorAudit);
      if (orchestratorAudit) {
        historyEntry.orchestratorAudit = normalizeOrchestratorAudit(orchestratorAudit);
      }

      return historyEntry;
    })
    .filter((item): item is HeartbeatHistoryEntry => Boolean(item));

  return normalized.slice(-maxHistory);
}

function readPersistedState(ctx: any): HeartbeatState {
  const restored = cloneDefaultState();
  const entries = getSessionEntries(ctx, "readPersistedState");

  for (const entry of entries) {
    if (entry?.type !== "custom") continue;
    if (entry?.customType !== STATE_ENTRY_TYPE) continue;

    const data = asRecord(entry?.data);
    if (!data) continue;

    const schemaVersion = typeof data.schemaVersion === "number" && Number.isFinite(data.schemaVersion)
      ? Math.floor(data.schemaVersion)
      : null;
    const isLegacy = schemaVersion === null;
    if (!isLegacy && schemaVersion !== STATE_SCHEMA_VERSION) continue;

    restored.enabled = typeof data.enabled === "boolean" ? data.enabled : restored.enabled;
    restored.paused = typeof data.paused === "boolean" ? data.paused : restored.paused;
    restored.dryRun = typeof data.dryRun === "boolean" ? data.dryRun : restored.dryRun;
    restored.editEnabled = typeof data.editEnabled === "boolean" ? data.editEnabled : restored.editEnabled;
    restored.requireApproval = typeof data.requireApproval === "boolean" ? data.requireApproval : restored.requireApproval;
    restored.intervalSeconds = clampOptionalNumber(data.intervalSeconds, restored.intervalSeconds, clampInterval);
    restored.cycle = clampRangeInt(data.cycle, 0, Number.MAX_SAFE_INTEGER, restored.cycle);
    restored.lastRunAt = typeof data.lastRunAt === "string" ? data.lastRunAt : restored.lastRunAt;
    restored.lastAction = asHeartbeatAction(data.lastAction, restored.lastAction);
    restored.lastOutcome = typeof data.lastOutcome === "string" ? data.lastOutcome : restored.lastOutcome;
    restored.focusPrompt = typeof data.focusPrompt === "string" && data.focusPrompt.trim()
      ? data.focusPrompt.trim()
      : restored.focusPrompt;
    restored.recentIssueFingerprint = typeof data.recentIssueFingerprint === "string"
      ? data.recentIssueFingerprint
      : restored.recentIssueFingerprint;
    restored.lastSignalFingerprint = typeof data.lastSignalFingerprint === "string"
      ? data.lastSignalFingerprint
      : restored.lastSignalFingerprint;
    restored.signalCacheTtlSeconds = clampOptionalNumber(
      data.signalCacheTtlSeconds,
      restored.signalCacheTtlSeconds,
      clampSignalTtl,
    );
    restored.externalProbeTtlSeconds = clampOptionalNumber(
      data.externalProbeTtlSeconds,
      restored.externalProbeTtlSeconds,
      clampExternalProbeTtl,
    );
    restored.approvalTimeoutSeconds = clampOptionalNumber(
      data.approvalTimeoutSeconds,
      restored.approvalTimeoutSeconds,
      clampApprovalTimeout,
    );
    restored.lastSignals = data.lastSignals && typeof data.lastSignals === "object" ? data.lastSignals : restored.lastSignals;
    restored.lastExternalProbe = data.lastExternalProbe && typeof data.lastExternalProbe === "object"
      ? data.lastExternalProbe
      : restored.lastExternalProbe;
    restored.pendingApproval = data.pendingApproval && typeof data.pendingApproval === "object"
      ? data.pendingApproval
      : restored.pendingApproval;
    restored.lastApprovalDecision = asApprovalDecision(data.lastApprovalDecision, restored.lastApprovalDecision);
    restored.lastOrchestratorAudit = data.lastOrchestratorAudit && typeof data.lastOrchestratorAudit === "object"
      ? data.lastOrchestratorAudit
      : restored.lastOrchestratorAudit;
    restored.consecutiveFailures = clampRangeInt(
      data.consecutiveFailures,
      0,
      Number.MAX_SAFE_INTEGER,
      restored.consecutiveFailures,
    );
    restored.backoffLevel = clampRangeInt(data.backoffLevel, 0, 5, restored.backoffLevel);
    restored.maxConsecutiveFailures = clampRangeInt(data.maxConsecutiveFailures, 1, 10, restored.maxConsecutiveFailures);
    restored.maxHistory = clampRangeInt(data.maxHistory, 1, 200, restored.maxHistory);
    restored.history = normalizeHistoryEntries(data.history, restored.maxHistory);
  }

  return restored;
}

function persistState(pi: ExtensionAPI): void {
  appendStateEntry(pi, STATE_ENTRY_TYPE, {
    schemaVersion: STATE_SCHEMA_VERSION,
    ...heartbeatState,
    history: heartbeatState.history.slice(-heartbeatState.maxHistory),
  });
}

function notify(ctx: any, message: string, level: string = "info"): void {
  safeUiNotify(ctx, message, level);
}

function updateStatus(ctx: any): void {
  if (!ctx?.hasUI) return;

  const mode = heartbeatState.enabled
    ? heartbeatState.paused
      ? "paused"
      : heartbeatState.dryRun
        ? "dry-run"
        : heartbeatState.editEnabled
          ? "edit-enabled"
          : "active"
    : "off";

  const pendingState = heartbeatState.pendingApproval ? " pending:yes" : " pending:no";
  safeUiSetStatus(
    ctx,
    STATUS_ID,
    `heartbeat ${mode} cycle:${heartbeatState.cycle} fail:${heartbeatState.consecutiveFailures}${pendingState}`,
  );
}

function clearScheduler(): void {
  if (!heartbeatTimer) return;
  clearTimeout(heartbeatTimer);
  heartbeatTimer = null;
}

function summarizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => summarizeText(item)).filter(Boolean).join(" ");
  }
  if (!value || typeof value !== "object") return "";

  const maybe = value as {
    text?: unknown;
    content?: unknown;
    message?: unknown;
    error?: unknown;
    data?: unknown;
  };

  return [maybe.text, maybe.content, maybe.message, maybe.error, maybe.data]
    .map((item) => summarizeText(item))
    .filter(Boolean)
    .join(" ");
}

function collectSessionSignals(ctx: any): {
  entries: any[];
  recentEntryCount: number;
  userEntryCount: number;
  assistantEntryCount: number;
  textualErrorCount: number;
  failureMentionCount: number;
  fileMentionCount: number;
} {
  const entries = getSessionEntries(ctx, "collectSessionSignals");
  const recentEntries = entries.slice(-30);
  let userEntryCount = 0;
  let assistantEntryCount = 0;
  let textualErrorCount = 0;
  let failureMentionCount = 0;
  let fileMentionCount = 0;

  for (const entry of recentEntries) {
    if (entry?.type === "user") userEntryCount += 1;
    if (entry?.type === "assistant") assistantEntryCount += 1;

    const text = summarizeText(entry).toLowerCase();
    if (!text) continue;
    if (/\berror\b|\bfailed\b|\bfailure\b|\btraceback\b/.test(text)) textualErrorCount += 1;
    if (/\bfix\b|\brepair\b|\bregression\b|\bdiagnostic\b|\btest\b/.test(text)) failureMentionCount += 1;
    if (/\b[a-z0-9_\-/]+\.(ts|tsx|js|jsx|py|md|json|yml|yaml)\b/.test(text)) fileMentionCount += 1;
  }

  return {
    entries: recentEntries,
    recentEntryCount: recentEntries.length,
    userEntryCount,
    assistantEntryCount,
    textualErrorCount,
    failureMentionCount,
    fileMentionCount,
  };
}

function collectDiagnosticsSignal(entries: any[]): DiagnosticsSignal {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const entry of entries) {
    const text = summarizeText(entry).toLowerCase();
    if (!text) continue;
    if (/\bdiagnostic\b|\bproblem\b|\bts\d{3,5}\b|\beslint\b/.test(text)) {
      errorCount += (text.match(/\berror\b|\bfailed\b|\bexception\b/g) ?? []).length;
      warningCount += (text.match(/\bwarning\b/g) ?? []).length;
      infoCount += (text.match(/\binfo\b|\bhint\b/g) ?? []).length;
    }
  }

  return {
    available: true,
    errorCount,
    warningCount,
    infoCount,
  };
}

function collectTestSignal(entries: any[]): TestFailureSignal {
  let failedCount = 0;
  for (const entry of entries) {
    const text = summarizeText(entry).toLowerCase();
    if (!text) continue;
    if (/\btest\b|\bpytest\b|\bvitest\b|\bjest\b|\bfailed\b/.test(text)) {
      failedCount += (text.match(/\bfailed\b|\bfailing\b|\berror\b/g) ?? []).length;
    }
  }

  return {
    available: true,
    failedCount,
    hasFailures: failedCount > 0,
  };
}

function collectGitSignal(entries: any[]): GitStateSignal {
  let stagedCount = 0;
  let unstagedCount = 0;
  let branch: string | null = null;

  for (const entry of entries) {
    const text = summarizeText(entry);
    if (!text) continue;
    const low = text.toLowerCase();
    if (low.includes("git status") || low.includes("modified:") || low.includes("changed files")) {
      unstagedCount += (low.match(/\bmodified\b|\bchanged\b|\bunstaged\b/g) ?? []).length;
      stagedCount += (low.match(/\bstaged\b|\bto be committed\b/g) ?? []).length;
    }
    const branchMatch = /on branch\s+([^\s]+)/i.exec(text);
    if (branchMatch) branch = branchMatch[1];
  }

  return {
    available: true,
    isDirty: stagedCount + unstagedCount > 0,
    stagedCount,
    unstagedCount,
    branch,
  };
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function toOptionalBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function extractJsonAfterMarker(text: string, marker: string): string | null {
  const markerIndex = text.lastIndexOf(marker);
  if (markerIndex < 0) return null;
  const tail = text.slice(markerIndex + marker.length);
  const firstBrace = tail.indexOf("{");
  const lastBrace = tail.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  return tail.slice(firstBrace, lastBrace + 1);
}

function parseExternalProbe(entries: any[]): ExternalSignalProbe | null {
  const combinedText = entries.map((entry) => summarizeText(entry)).join("\n");
  const jsonText = extractJsonAfterMarker(combinedText, "HEARTBEAT_SIGNAL_SNAPSHOT");
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object") return null;

    const probe: ExternalSignalProbe = {
      collectedAt: typeof parsed.collectedAt === "string" ? parsed.collectedAt : nowIso(),
    };

    if (parsed.diagnostics && typeof parsed.diagnostics === "object") {
      probe.diagnostics = {
        available: toOptionalBoolean(parsed.diagnostics.available) ?? true,
        errorCount: toOptionalNumber(parsed.diagnostics.errorCount) ?? undefined,
        warningCount: toOptionalNumber(parsed.diagnostics.warningCount) ?? undefined,
        infoCount: toOptionalNumber(parsed.diagnostics.infoCount) ?? undefined,
      };
    }

    if (parsed.tests && typeof parsed.tests === "object") {
      probe.tests = {
        available: toOptionalBoolean(parsed.tests.available) ?? true,
        failedCount: toOptionalNumber(parsed.tests.failedCount) ?? undefined,
        hasFailures: toOptionalBoolean(parsed.tests.hasFailures) ?? undefined,
      };
    }

    if (parsed.git && typeof parsed.git === "object") {
      probe.git = {
        available: toOptionalBoolean(parsed.git.available) ?? true,
        isDirty: toOptionalBoolean(parsed.git.isDirty) ?? undefined,
        stagedCount: toOptionalNumber(parsed.git.stagedCount) ?? undefined,
        unstagedCount: toOptionalNumber(parsed.git.unstagedCount) ?? undefined,
        branch: typeof parsed.git.branch === "string" ? parsed.git.branch : undefined,
      };
    }

    return probe;
  } catch {
    return null;
  }
}

function mergeExternalProbe(baseSignals: HeartbeatSignals): HeartbeatSignals {
  const probe = heartbeatState.lastExternalProbe;
  if (!probe) return baseSignals;
  if (secondsSince(probe.collectedAt) > heartbeatState.externalProbeTtlSeconds) return baseSignals;

  const diagnostics: DiagnosticsSignal = {
    available: probe.diagnostics?.available ?? baseSignals.diagnostics.available,
    errorCount: probe.diagnostics?.errorCount ?? baseSignals.diagnostics.errorCount,
    warningCount: probe.diagnostics?.warningCount ?? baseSignals.diagnostics.warningCount,
    infoCount: probe.diagnostics?.infoCount ?? baseSignals.diagnostics.infoCount,
  };

  const testFailedCount = probe.tests?.failedCount ?? baseSignals.tests.failedCount;
  const tests: TestFailureSignal = {
    available: probe.tests?.available ?? baseSignals.tests.available,
    failedCount: testFailedCount,
    hasFailures: probe.tests?.hasFailures ?? testFailedCount > 0,
  };

  const git: GitStateSignal = {
    available: probe.git?.available ?? baseSignals.git.available,
    isDirty: probe.git?.isDirty ?? baseSignals.git.isDirty,
    stagedCount: probe.git?.stagedCount ?? baseSignals.git.stagedCount,
    unstagedCount: probe.git?.unstagedCount ?? baseSignals.git.unstagedCount,
    branch: probe.git?.branch ?? baseSignals.git.branch,
  };

  return {
    ...baseSignals,
    sourceTier: "external-probe",
    collectedAt: probe.collectedAt,
    diagnostics,
    tests,
    git,
  };
}

function getFreshExternalProbe(): ExternalSignalProbe | null {
  const probe = heartbeatState.lastExternalProbe;
  if (!probe) return null;
  if (secondsSince(probe.collectedAt) > heartbeatState.externalProbeTtlSeconds) return null;
  return probe;
}

function collectTypedSignals(ctx: any): HeartbeatSignals {
  const canReuseCache = heartbeatState.lastSignals
    && secondsSince(heartbeatState.lastSignals.collectedAt) <= heartbeatState.signalCacheTtlSeconds;

  if (canReuseCache) {
    return {
      ...heartbeatState.lastSignals,
      sourceTier: "cached",
    };
  }

  const session = collectSessionSignals(ctx);
  const fallbackSignals = {
    diagnostics: collectDiagnosticsSignal(session.entries),
    tests: collectTestSignal(session.entries),
    git: collectGitSignal(session.entries),
  };

  const directSignals = collectDirectSignalsFromPayload(session.entries);
  const resolvedSignals = chooseDirectThenProbeThenFallback({
    direct: {
      diagnostics: directSignals.diagnostics,
      tests: directSignals.tests,
      git: directSignals.git,
    },
    probe: getFreshExternalProbe(),
    fallback: fallbackSignals,
  });

  const collectedAt = resolvedSignals.sourceTier === "external-probe" && heartbeatState.lastExternalProbe
    ? heartbeatState.lastExternalProbe.collectedAt
    : nowIso();

  const signals: HeartbeatSignals = {
    collectedAt,
    sourceTier: resolvedSignals.sourceTier,
    recentEntryCount: session.recentEntryCount,
    userEntryCount: session.userEntryCount,
    assistantEntryCount: session.assistantEntryCount,
    textualErrorCount: session.textualErrorCount,
    failureMentionCount: session.failureMentionCount,
    fileMentionCount: session.fileMentionCount,
    diagnostics: resolvedSignals.diagnostics,
    tests: resolvedSignals.tests,
    git: resolvedSignals.git,
  };

  heartbeatState.lastSignals = signals;
  return signals;
}

function buildIssueFingerprint(signals: HeartbeatSignals): string {
  return [
    signals.textualErrorCount,
    signals.failureMentionCount,
    signals.fileMentionCount,
    signals.diagnostics.errorCount,
    signals.tests.failedCount,
    signals.git.stagedCount + signals.git.unstagedCount,
  ].join(":");
}

function selectAction(signals: HeartbeatSignals): {
  action: HeartbeatActionName;
  reason: string;
} {
  const hasMaintenanceSignal =
    signals.diagnostics.errorCount > 0
    || signals.tests.hasFailures
    || signals.failureMentionCount > 1
    || signals.textualErrorCount > 0;

  if (hasMaintenanceSignal) {
    return {
      action: "maintenance-pass",
      reason: "typed diagnostics or failure signals indicate actionable maintenance work",
    };
  }

  if (signals.userEntryCount > 0 || signals.fileMentionCount > 0 || signals.git.isDirty) {
    return {
      action: "summarize",
      reason: "workspace activity detected, but no urgent failure signal",
    };
  }

  return {
    action: "idle",
    reason: "no meaningful maintenance signal detected",
  };
}

function addHistory(
  action: HeartbeatActionName,
  trigger: string,
  outcome: string,
  approvalDecision?: ApprovalDecision,
): void {
  heartbeatState.history = [
    ...heartbeatState.history,
    {
      cycle: heartbeatState.cycle,
      trigger,
      action,
      outcome,
      at: nowIso(),
      approvalDecision,
    },
  ].slice(-heartbeatState.maxHistory);
}

function normalizeOrchestratorAudit(payload: any): OrchestratorAuditMetadata {
  return {
    status: payload?.status === "passed" || payload?.status === "failed" ? payload.status : null,
    verdict: typeof payload?.verdict === "string" ? payload.verdict : null,
    attemptsUsed: typeof payload?.attemptsUsed === "number" ? payload.attemptsUsed : null,
    retryCount: typeof payload?.retryCount === "number" ? payload.retryCount : null,
    filesTouched: Array.isArray(payload?.filesTouched)
      ? payload.filesTouched.filter((value: unknown) => typeof value === "string")
      : [],
    policySummary: typeof payload?.policySummary === "string" ? payload.policySummary : null,
    nextAction: typeof payload?.nextAction === "string" ? payload.nextAction : null,
    handoffTarget: typeof payload?.handoffTarget === "string" ? payload.handoffTarget : null,
    capturedAt: nowIso(),
  };
}

function attachOrchestratorAudit(audit: OrchestratorAuditMetadata): void {
  heartbeatState.lastOrchestratorAudit = audit;
  const historyTail = heartbeatState.history[heartbeatState.history.length - 1];
  if (!historyTail) return;

  heartbeatState.history = [
    ...heartbeatState.history.slice(0, -1),
    {
      ...historyTail,
      orchestratorAudit: audit,
    },
  ];
}

function buildHeartbeatRequest(signals: HeartbeatSignals, reason: string, trigger: string): HeartbeatRequestEnvelope {
  const allowedActions = heartbeatState.dryRun || !heartbeatState.editEnabled
    ? ["noop", "recommendation"]
    : ["noop", "recommendation", "planning-handoff", "implementation-handoff"];

  return {
    cycle: heartbeatState.cycle,
    trigger,
    dryRun: heartbeatState.dryRun,
    editEnabled: heartbeatState.editEnabled,
    requireApproval: heartbeatState.requireApproval,
    focusPrompt: heartbeatState.focusPrompt,
    reason,
    fingerprint: buildIssueFingerprint(signals),
    signals,
    allowedActions,
  };
}

function buildMaintenancePrompt(request: HeartbeatRequestEnvelope): string {
  const modeLine = request.dryRun || !request.editEnabled
    ? "Mode: dry-run or edit-disabled. Recommendation only. Do not perform edits."
    : request.requireApproval
      ? "Mode: edit-enabled with required operator approval. Produce plan/handoff details but do not execute edits until approved."
      : "Mode: edit-enabled and approval bypassed. Route through generator-discriminator workflow if implementation is warranted.";

  return [
    `Heartbeat cycle ${request.cycle}.`,
    `Trigger: ${request.trigger}.`,
    `Reason: ${request.reason}.`,
    `Focus: ${request.focusPrompt}`,
    modeLine,
    "Use heartbeat-maintainer contract and return exactly:",
    "selected_objective:",
    "action_taken:",
    "outcome:",
    "next_risk:",
    "confidence:",
    "handoff_details:",
    "If action_taken is implementation-handoff and mode allows edits, route using gen-disc-orchestrator only.",
    "Heartbeat request envelope follows as JSON:",
    JSON.stringify(request, null, 2),
  ].join("\n");
}

function scheduleNextBeat(pi: ExtensionAPI): void {
  clearScheduler();

  if (!heartbeatState.enabled || heartbeatState.paused || !activeContext) {
    updateStatus(activeContext);
    return;
  }

  const nextDelayMs = heartbeatState.intervalSeconds * 1000 * Math.max(1, heartbeatState.backoffLevel + 1);
  heartbeatTimer = setTimeout(() => {
    void runHeartbeatCycle(pi, activeContext, "timer");
  }, nextDelayMs);

  updateStatus(activeContext);
}

function pendingApprovalExpired(): boolean {
  if (!heartbeatState.pendingApproval) return false;
  return Date.now() >= new Date(heartbeatState.pendingApproval.expiresAt).getTime();
}

function handlePendingApprovalTimeout(): void {
  if (!heartbeatState.pendingApproval) return;
  if (!pendingApprovalExpired()) return;

  heartbeatState.lastApprovalDecision = "deferred";
  heartbeatState.lastOutcome = `approval timed out for cycle ${heartbeatState.pendingApproval.cycle}`;
  addHistory("awaiting-approval", "timeout", heartbeatState.lastOutcome, "deferred");
  heartbeatState.pendingApproval = null;
}

function queueApproval(request: HeartbeatRequestEnvelope, ctx: any): void {
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + heartbeatState.approvalTimeoutSeconds * 1000).toISOString();

  heartbeatState.pendingApproval = {
    cycle: request.cycle,
    fingerprint: request.fingerprint,
    objective: request.reason,
    riskLevel: request.signals.diagnostics.errorCount > 2 || request.signals.tests.failedCount > 2 ? "high" : "medium",
    request,
    createdAt,
    expiresAt,
  };

  heartbeatState.lastAction = "awaiting-approval";
  heartbeatState.lastOutcome = `awaiting approval for cycle ${request.cycle}`;
  addHistory("awaiting-approval", request.trigger, heartbeatState.lastOutcome);

  notify(ctx, formatPendingApprovalMessage(heartbeatState.pendingApproval), "info");
}

function dispatchHandoff(pi: ExtensionAPI, request: HeartbeatRequestEnvelope): boolean {
  const prompt = buildMaintenancePrompt(request);
  return sendSteerMessage(pi, prompt, "dispatch-handoff");
}

function requestSignalProbe(pi: ExtensionAPI): boolean {
  const prompt = [
    "Collect a current heartbeat signal snapshot for this workspace.",
    "Use available tools/commands to gather diagnostics, test status, and git state if available.",
    "Return exactly this marker and JSON payload:",
    "HEARTBEAT_SIGNAL_SNAPSHOT",
    "{",
    '  "collectedAt": "ISO timestamp",',
    '  "diagnostics": { "available": true, "errorCount": 0, "warningCount": 0, "infoCount": 0 },',
    '  "tests": { "available": true, "failedCount": 0, "hasFailures": false },',
    '  "git": { "available": true, "isDirty": false, "stagedCount": 0, "unstagedCount": 0, "branch": "main" }',
    "}",
    "If a signal is unavailable, set available=false and use zero/null values.",
  ].join("\n");

  return sendSteerMessage(pi, prompt, "request-signal-probe");
}

function canEnterHeartbeatCycle(trigger: string): boolean {
  if (cycleInFlight) return false;
  if (!heartbeatState.enabled && trigger !== "manual") return false;
  if (heartbeatState.paused && trigger !== "manual") return false;
  return true;
}

function resolveCycleAction(ctx: any): {
  signals: HeartbeatSignals;
  action: HeartbeatActionName;
  reason: string;
  fingerprint: string;
} {
  heartbeatState.cycle += 1;
  heartbeatState.lastRunAt = nowIso();

  const signals = collectTypedSignals(ctx);
  const { action, reason } = selectAction(signals);
  const fingerprint = buildIssueFingerprint(signals);

  heartbeatState.lastSignalFingerprint = fingerprint;
  heartbeatState.lastAction = action;

  return {
    signals,
    action,
    reason,
    fingerprint,
  };
}

function handleMaintenanceDispatch(
  pi: ExtensionAPI,
  ctx: any,
  trigger: string,
  signals: HeartbeatSignals,
  reason: string,
  fingerprint: string,
): void {
  const request = buildHeartbeatRequest(signals, reason, trigger);
  heartbeatState.recentIssueFingerprint = fingerprint;

  if (request.dryRun || !request.editEnabled) {
    const sent = dispatchHandoff(pi, request);
    heartbeatState.lastOutcome = sent
      ? "queued dry-run maintenance handoff"
      : "degraded: unable to dispatch dry-run maintenance handoff";
    return;
  }

  if (request.requireApproval) {
    queueApproval(request, ctx);
    return;
  }

  const sent = dispatchHandoff(pi, request);
  heartbeatState.lastOutcome = sent
    ? "queued edit-enabled maintenance handoff"
    : "degraded: unable to dispatch edit-enabled maintenance handoff";
}

function persistCycleSuccess(pi: ExtensionAPI, ctx: any, action: HeartbeatActionName, trigger: string): void {
  heartbeatState.consecutiveFailures = 0;
  heartbeatState.backoffLevel = 0;
  addHistory(action, trigger, heartbeatState.lastOutcome);
  persistState(pi);
  updateStatus(ctx);
}

function finalizeCycleScheduling(pi: ExtensionAPI): void {
  cycleInFlight = false;
  scheduleNextBeat(pi);
}

async function runHeartbeatCycle(pi: ExtensionAPI, ctx: any, trigger: string): Promise<void> {
  if (!canEnterHeartbeatCycle(trigger)) return;

  cycleInFlight = true;
  activeContext = ctx;

  try {
    handlePendingApprovalTimeout();
    const { signals, action, reason, fingerprint } = resolveCycleAction(ctx);

    if (heartbeatState.pendingApproval && !pendingApprovalExpired()) {
      heartbeatState.lastOutcome = `pending approval active for cycle ${heartbeatState.pendingApproval.cycle}`;
      addHistory("awaiting-approval", trigger, heartbeatState.lastOutcome);
      heartbeatState.consecutiveFailures = 0;
      heartbeatState.backoffLevel = 0;
      persistState(pi);
      updateStatus(ctx);
      return;
    }

    if (action === "maintenance-pass" && heartbeatState.recentIssueFingerprint === fingerprint) {
      heartbeatState.lastOutcome = "skipped duplicate maintenance signal";
      addHistory(action, trigger, heartbeatState.lastOutcome);
      heartbeatState.consecutiveFailures = 0;
      heartbeatState.backoffLevel = 0;
      persistState(pi);
      updateStatus(ctx);
      return;
    }

    if (action === "maintenance-pass") {
      handleMaintenanceDispatch(pi, ctx, trigger, signals, reason, fingerprint);
    } else if (action === "summarize") {
      heartbeatState.lastOutcome = `observed workspace activity: ${reason}`;
      notify(ctx, `heartbeat: ${heartbeatState.lastOutcome}`, "info");
    } else {
      heartbeatState.lastOutcome = reason;
    }

    persistCycleSuccess(pi, ctx, action, trigger);
  } catch (error) {
    heartbeatState.consecutiveFailures += 1;
    heartbeatState.backoffLevel = Math.min(heartbeatState.backoffLevel + 1, 5);
    heartbeatState.lastAction = "idle";
    heartbeatState.lastOutcome = `cycle failed: ${String(error)}`;
    addHistory("idle", trigger, heartbeatState.lastOutcome);

    if (heartbeatState.consecutiveFailures >= heartbeatState.maxConsecutiveFailures) {
      heartbeatState.enabled = false;
      heartbeatState.paused = true;
      heartbeatState.lastOutcome = `disabled after ${heartbeatState.consecutiveFailures} consecutive failures`;
      addHistory("idle", trigger, heartbeatState.lastOutcome);
      notify(ctx, `heartbeat disabled: ${heartbeatState.lastOutcome}`, "warning");
    }

    persistState(pi);
    updateStatus(ctx);
  } finally {
    finalizeCycleScheduling(pi);
  }
}

function formatStatus(): string {
  return [
    `enabled=${heartbeatState.enabled}`,
    `paused=${heartbeatState.paused}`,
    `dryRun=${heartbeatState.dryRun}`,
    `editEnabled=${heartbeatState.editEnabled}`,
    `requireApproval=${heartbeatState.requireApproval}`,
    `intervalSeconds=${heartbeatState.intervalSeconds}`,
    `cycle=${heartbeatState.cycle}`,
    `lastAction=${heartbeatState.lastAction}`,
    `lastOutcome=${heartbeatState.lastOutcome}`,
    `pendingApproval=${heartbeatState.pendingApproval ? `cycle:${heartbeatState.pendingApproval.cycle}` : "none"}`,
  ].join(" ");
}

function parseSecondsArg(args: string): number | null {
  const normalized = String(args || "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseToggleArg(args: string, current: boolean): boolean | null {
  const normalized = String(args || "").trim().toLowerCase();
  if (!normalized) return current;
  if (normalized === "on" || normalized === "true") return true;
  if (normalized === "off" || normalized === "false") return false;
  return null;
}

function applyApprovalDecision(pi: ExtensionAPI, _ctx: any, decision: ApprovalDecision): ApprovalApplyResult {
  if (!heartbeatState.pendingApproval) {
    return {
      applied: false,
      level: "warning",
      notification: "No pending heartbeat approval.",
    };
  }

  const pending = heartbeatState.pendingApproval;
  heartbeatState.lastApprovalDecision = decision;
  heartbeatState.pendingApproval = null;

  if (decision === "approved") {
    const sent = dispatchHandoff(pi, pending.request);
    heartbeatState.lastOutcome = sent
      ? `approved and dispatched cycle ${pending.cycle}`
      : `approved but dispatch failed for cycle ${pending.cycle}`;
    addHistory("maintenance-pass", "approval", heartbeatState.lastOutcome, decision);

    heartbeatState.consecutiveFailures = 0;
    heartbeatState.backoffLevel = 0;
    persistState(pi);
    updateStatus(activeContext);

    return {
      applied: true,
      level: sent ? "info" : "warning",
      notification: sent
        ? `heartbeat approval applied: approved cycle=${pending.cycle}`
        : `heartbeat approval applied but dispatch failed cycle=${pending.cycle}`,
    };
  } else if (decision === "deferred") {
    heartbeatState.lastOutcome = `deferred cycle ${pending.cycle}`;
    addHistory("awaiting-approval", "approval", heartbeatState.lastOutcome, decision);
  } else {
    heartbeatState.lastOutcome = `rejected cycle ${pending.cycle}`;
    addHistory("awaiting-approval", "approval", heartbeatState.lastOutcome, decision);
  }

  heartbeatState.consecutiveFailures = 0;
  heartbeatState.backoffLevel = 0;
  persistState(pi);
  updateStatus(activeContext);

  return {
    applied: true,
    level: "info",
    notification: `heartbeat approval applied: ${decision} cycle=${pending.cycle}`,
  };
}

function ingestTurnStartParseSignals(pi: ExtensionAPI, ctx: any): void {
  const entries = getSessionEntries(ctx, "ingestTurnStartParseSignals");
  const recentEntries = entries.slice(-20);
  const recentText = recentEntries.map((entry: any) => summarizeText(entry)).join("\n");

  const probe = parseExternalProbe(recentEntries);
  if (probe) {
    heartbeatState.lastExternalProbe = probe;
    heartbeatState.lastSignals = null;
    heartbeatState.lastOutcome = `ingested external signal probe from ${probe.collectedAt}`;
    persistState(pi);
  }

  const parsedStatuses: string[] = [];

  try {
    const maintainerResult = parseHeartbeatMaintainerOutput(recentText);
    if (maintainerResult.ok) {
      parsedStatuses.push(
        `maintainer ${maintainerResult.data.actionTaken} (${maintainerResult.data.selectedObjective})`,
      );
    }
  } catch {
    // Best-effort parse only; failures must never break scheduling.
  }

  try {
    const policyResult = parsePolicyDiscriminatorOutput(recentText);
    if (policyResult.ok) {
      parsedStatuses.push(`policy ${policyResult.data.verdict} (${policyResult.data.failedCheckCount} failed checks)`);
    }
  } catch {
    // Best-effort parse only; failures must never break scheduling.
  }

  try {
    const orchestratorResult = parseOrchestratorResultPayload(recentText);
    if (orchestratorResult.ok) {
      const audit = normalizeOrchestratorAudit(orchestratorResult.data);
      attachOrchestratorAudit(audit);

      const statusPart = audit.status || audit.verdict || "unknown";
      const attemptPart = typeof audit.attemptsUsed === "number" ? ` attempts=${audit.attemptsUsed}` : "";
      const nextPart = audit.nextAction ? ` next=${audit.nextAction}` : "";
      parsedStatuses.push(`orchestrator ${statusPart}${attemptPart}${nextPart}`.trim());
    }
  } catch {
    // Best-effort parse only; failures must never break scheduling.
  }

  if (parsedStatuses.length > 0) {
    heartbeatState.lastOutcome = parsedStatuses.join("; ");
    persistState(pi);
  }
}

function registerSignalProbeCommands(pi: ExtensionAPI): void {
  registerHeartbeatCommand(pi, "heartbeat-signal-ttl", {
    description: "Set signal snapshot cache TTL in seconds: /heartbeat-signal-ttl 120",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const parsed = parseSecondsArg(args);
      if (parsed === null) {
        notify(ctx, "Usage: /heartbeat-signal-ttl <seconds>", "warning");
        return;
      }

      heartbeatState.signalCacheTtlSeconds = clampSignalTtl(parsed);
      heartbeatState.lastSignals = null;
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, `heartbeat signal cache ttl=${heartbeatState.signalCacheTtlSeconds}s`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-probe-ttl", {
    description: "Set external signal probe TTL in seconds: /heartbeat-probe-ttl 300",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const parsed = parseSecondsArg(args);
      if (parsed === null) {
        notify(ctx, "Usage: /heartbeat-probe-ttl <seconds>", "warning");
        return;
      }

      heartbeatState.externalProbeTtlSeconds = clampExternalProbeTtl(parsed);
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, `heartbeat probe ttl=${heartbeatState.externalProbeTtlSeconds}s`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-probe-now", {
    description: "Request an immediate structured diagnostics/test/git probe",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      const requested = requestSignalProbe(pi);
      notify(
        ctx,
        requested
          ? "heartbeat requested signal probe; waiting for HEARTBEAT_SIGNAL_SNAPSHOT response"
          : "heartbeat degraded: unable to request signal probe",
        requested ? "info" : "warning",
      );
    },
  });
}

function registerLifecycleHandlers(pi: ExtensionAPI): void {
  pi.on("session_start", async (_event, ctx) => {
    activeContext = ctx;
    heartbeatState = readPersistedState(ctx);
    updateStatus(ctx);
    scheduleNextBeat(pi);
  });

  pi.on("turn_start", async (_event, ctx) => {
    activeContext = ctx;
    ingestTurnStartParseSignals(pi, ctx);
    updateStatus(ctx);
  });
}

function registerBaseHeartbeatCommands(pi: ExtensionAPI): void {
  registerHeartbeatCommand(pi, "heartbeat", {
    description: "Show heartbeat agent status",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      updateStatus(ctx);
      notify(ctx, formatStatus(), "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-start", {
    description: "Start the heartbeat loop: /heartbeat-start [intervalSeconds]",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const parsed = parseSecondsArg(args);
      if (parsed !== null) heartbeatState.intervalSeconds = clampInterval(parsed);
      heartbeatState.enabled = true;
      heartbeatState.paused = false;
      persistState(pi);
      updateStatus(ctx);
      scheduleNextBeat(pi);
      notify(ctx, `heartbeat started (${heartbeatState.intervalSeconds}s)`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-stop", {
    description: "Stop the heartbeat loop",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      heartbeatState.enabled = false;
      heartbeatState.paused = false;
      clearScheduler();
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, "heartbeat stopped", "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-pause", {
    description: "Pause the heartbeat loop",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      heartbeatState.paused = true;
      clearScheduler();
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, "heartbeat paused", "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-resume", {
    description: "Resume the heartbeat loop",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      heartbeatState.enabled = true;
      heartbeatState.paused = false;
      persistState(pi);
      updateStatus(ctx);
      scheduleNextBeat(pi);
      notify(ctx, "heartbeat resumed", "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-run-once", {
    description: "Run one heartbeat cycle immediately",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      await runHeartbeatCycle(pi, ctx, "manual");
      notify(ctx, `heartbeat cycle ${heartbeatState.cycle} complete`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-interval", {
    description: "Set the heartbeat interval in seconds: /heartbeat-interval 300",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const parsed = parseSecondsArg(args);
      if (parsed === null) {
        notify(ctx, "Usage: /heartbeat-interval <seconds>", "warning");
        return;
      }

      heartbeatState.intervalSeconds = clampInterval(parsed);
      persistState(pi);
      updateStatus(ctx);
      scheduleNextBeat(pi);
      notify(ctx, `heartbeat interval=${heartbeatState.intervalSeconds}s`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-focus", {
    description: "Set the heartbeat maintenance focus text",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const nextFocus = String(args || "").trim();
      if (!nextFocus) {
        notify(ctx, "Usage: /heartbeat-focus <goal>", "warning");
        return;
      }

      heartbeatState.focusPrompt = nextFocus;
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, "heartbeat focus updated", "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-dry-run", {
    description: "Toggle dry-run mode: /heartbeat-dry-run on|off",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const nextValue = parseToggleArg(args, heartbeatState.dryRun);
      if (nextValue === null) {
        notify(ctx, "Usage: /heartbeat-dry-run on|off", "warning");
        return;
      }

      heartbeatState.dryRun = nextValue;
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, `heartbeat dryRun=${heartbeatState.dryRun}`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-edit", {
    description: "Toggle edit-capable heartbeat behavior: /heartbeat-edit on|off",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const nextValue = parseToggleArg(args, heartbeatState.editEnabled);
      if (nextValue === null) {
        notify(ctx, "Usage: /heartbeat-edit on|off", "warning");
        return;
      }

      heartbeatState.editEnabled = nextValue;
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, `heartbeat editEnabled=${heartbeatState.editEnabled}`, "info");
    },
  });
}

function registerApprovalCommands(pi: ExtensionAPI): void {
  registerHeartbeatCommand(pi, "heartbeat-approval-timeout", {
    description: "Set approval timeout in seconds: /heartbeat-approval-timeout 3600",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const parsed = parseSecondsArg(args);
      if (parsed === null) {
        notify(ctx, "Usage: /heartbeat-approval-timeout <seconds>", "warning");
        return;
      }

      heartbeatState.approvalTimeoutSeconds = clampApprovalTimeout(parsed);
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, `heartbeat approval timeout=${heartbeatState.approvalTimeoutSeconds}s`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-approval", {
    description: "Toggle approval gate for edit-capable cycles: /heartbeat-approval on|off",
    handler: async (args, ctx) => {
      activeContext = ctx;
      const nextValue = parseToggleArg(args, heartbeatState.requireApproval);
      if (nextValue === null) {
        notify(ctx, "Usage: /heartbeat-approval on|off", "warning");
        return;
      }

      heartbeatState.requireApproval = nextValue;
      persistState(pi);
      updateStatus(ctx);
      notify(ctx, `heartbeat requireApproval=${heartbeatState.requireApproval}`, "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-pending", {
    description: "Show pending approval details",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      if (!heartbeatState.pendingApproval) {
        notify(ctx, "No pending heartbeat approval.", "info");
        return;
      }

      const pending = heartbeatState.pendingApproval;
      notify(ctx, formatPendingApprovalMessage(pending), "info");
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-approve", {
    description: "Approve pending edit-capable maintenance objective",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      const result = applyApprovalDecision(pi, ctx, "approved");
      notify(ctx, result.notification, result.level);
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-defer", {
    description: "Defer pending edit-capable maintenance objective",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      const result = applyApprovalDecision(pi, ctx, "deferred");
      notify(ctx, result.notification, result.level);
    },
  });

  registerHeartbeatCommand(pi, "heartbeat-reject", {
    description: "Reject pending edit-capable maintenance objective",
    handler: async (_args, ctx) => {
      activeContext = ctx;
      const result = applyApprovalDecision(pi, ctx, "rejected");
      notify(ctx, result.notification, result.level);
    },
  });
}

export default function (pi: ExtensionAPI) {
  registerLifecycleHandlers(pi);
  registerBaseHeartbeatCommands(pi);
  registerSignalProbeCommands(pi);
  registerApprovalCommands(pi);
}