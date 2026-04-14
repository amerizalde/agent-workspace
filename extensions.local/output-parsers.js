const HEARTBEAT_ACTIONS = new Set([
  "noop",
  "recommendation",
  "planning-handoff",
  "implementation-handoff",
]);

const CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);
const POLICY_VERDICTS = new Set(["PASS", "FAIL"]);
const POLICY_CONFIDENCE = new Set(["high", "medium"]);
const ORCHESTRATOR_STATUS = new Set(["passed", "failed"]);

function normalizeLineValue(value) {
  return String(value || "").trim();
}

function findFieldLine(text, fieldName) {
  const pattern = new RegExp(`^\\s*(?:-\\s*)?${fieldName}\\s*:\\s*(.*)$`, "gim");
  let match = null;
  let last = null;
  while ((match = pattern.exec(text)) !== null) {
    last = match;
  }

  if (!last) {
    return null;
  }

  return {
    value: normalizeLineValue(last[1]),
    index: last.index,
  };
}

function parseBulletListBlock(text, blockName, options = {}) {
  const {
    strictBullets = false,
    allowInlineNone = true,
  } = options;
  const lines = String(text || "").split(/\r?\n/);
  const blockHeaderPattern = new RegExp(`^\\s*(?:-\\s*)?${blockName}\\s*:\\s*(.*)$`, "i");
  const topLevelFieldPattern = /^\s*(?:-\s*)?[a-z_]+\s*:\s*/i;
  const bullets = [];
  let hasNonBulletEntries = false;
  let hasInlineNonNoneValue = false;
  let inBlock = false;

  for (const line of lines) {
    if (!inBlock) {
      const headerMatch = blockHeaderPattern.exec(line);
      if (!headerMatch) {
        continue;
      }

      inBlock = true;
      const inlineValue = normalizeLineValue(headerMatch[1]);
      if (inlineValue && inlineValue.toLowerCase() !== "none") {
        if (strictBullets) {
          hasInlineNonNoneValue = true;
        } else {
          bullets.push(inlineValue);
        }
      }

      if (inlineValue && inlineValue.toLowerCase() === "none" && !allowInlineNone) {
        hasInlineNonNoneValue = true;
      }
      continue;
    }

    if (topLevelFieldPattern.test(line)) {
      break;
    }

    const bulletMatch = /^\s*-\s*(.+?)\s*$/.exec(line);
    if (bulletMatch) {
      bullets.push(normalizeLineValue(bulletMatch[1]));
      continue;
    }

    if (/^\s*$/.test(line)) {
      continue;
    }

    if (strictBullets) {
      hasNonBulletEntries = true;
      continue;
    }

    bullets.push(normalizeLineValue(line));
  }

  return {
    items: bullets.filter(Boolean),
    hasNonBulletEntries,
    hasInlineNonNoneValue,
  };
}

function parseHeartbeatMaintainerOutput(text) {
  const selectedObjectiveField = findFieldLine(text, "selected_objective");
  const actionTakenField = findFieldLine(text, "action_taken");
  const outcomeField = findFieldLine(text, "outcome");
  const nextRiskField = findFieldLine(text, "next_risk");
  const confidenceField = findFieldLine(text, "confidence");
  const handoffField = findFieldLine(text, "handoff_details");

  if (!selectedObjectiveField || !actionTakenField || !outcomeField || !nextRiskField) {
    return {
      ok: false,
      reason: "missing required heartbeat-maintainer fields",
    };
  }

  const actionTaken = normalizeLineValue(actionTakenField.value).toLowerCase();
  if (!HEARTBEAT_ACTIONS.has(actionTaken)) {
    return {
      ok: false,
      reason: `invalid action_taken value: ${actionTakenField.value}`,
    };
  }

  if (confidenceField) {
    const normalizedConfidence = normalizeLineValue(confidenceField.value).toLowerCase();
    if (!CONFIDENCE_LEVELS.has(normalizedConfidence)) {
      return {
        ok: false,
        reason: `invalid confidence value: ${confidenceField.value}`,
      };
    }
  }

  return {
    ok: true,
    data: {
      selectedObjective: selectedObjectiveField.value,
      actionTaken,
      outcome: outcomeField.value,
      nextRisk: nextRiskField.value,
      confidence: confidenceField ? confidenceField.value.toLowerCase() : null,
      handoffDetails: handoffField ? handoffField.value : null,
    },
  };
}

function parsePolicyDiscriminatorOutput(text) {
  const verdictField = findFieldLine(text, "verdict");
  const confidenceField = findFieldLine(text, "confidence");

  if (!verdictField || !confidenceField) {
    return {
      ok: false,
      reason: "missing required policy-discriminator fields",
    };
  }

  const verdict = normalizeLineValue(verdictField.value).toUpperCase();
  const confidence = normalizeLineValue(confidenceField.value).toLowerCase();

  if (!POLICY_VERDICTS.has(verdict)) {
    return {
      ok: false,
      reason: `invalid verdict value: ${verdictField.value}`,
    };
  }

  if (!POLICY_CONFIDENCE.has(confidence)) {
    return {
      ok: false,
      reason: `invalid confidence value: ${confidenceField.value}`,
    };
  }

  const failedChecksResult = parseBulletListBlock(text, "failed_checks", {
    strictBullets: true,
    allowInlineNone: true,
  });
  const fixDirectivesResult = parseBulletListBlock(text, "fix_directives", {
    strictBullets: true,
    allowInlineNone: true,
  });

  if (failedChecksResult.hasInlineNonNoneValue || failedChecksResult.hasNonBulletEntries) {
    return {
      ok: false,
      reason: "failed_checks must be a bullet list (or 'none')",
    };
  }

  if (fixDirectivesResult.hasInlineNonNoneValue || fixDirectivesResult.hasNonBulletEntries) {
    return {
      ok: false,
      reason: "fix_directives must be a bullet list (or 'none')",
    };
  }

  const failedChecks = failedChecksResult.items;
  const fixDirectives = fixDirectivesResult.items;

  return {
    ok: true,
    data: {
      verdict,
      confidence,
      failedChecks,
      fixDirectives,
      failedCheckCount: failedChecks.length,
      fixDirectiveCount: fixDirectives.length,
    },
  };
}

function normalizeOrchestratorStatus(rawStatus) {
  const normalized = normalizeLineValue(rawStatus).toLowerCase();
  if (!normalized) return null;
  if (normalized === "pass") return "passed";
  if (normalized === "fail") return "failed";
  if (normalized === "done") return "passed";
  return ORCHESTRATOR_STATUS.has(normalized) ? normalized : null;
}

function parseOptionalInteger(rawValue) {
  const normalized = normalizeLineValue(rawValue);
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseInlineList(rawValue) {
  const normalized = normalizeLineValue(rawValue);
  if (!normalized || normalized.toLowerCase() === "none") return [];
  return normalized
    .split(/[;,]/)
    .map((item) => normalizeLineValue(item))
    .filter(Boolean);
}

function parseOrchestratorResultPayload(text) {
  try {
    const statusField = findFieldLine(text, "status");
    const verdictField = findFieldLine(text, "verdict");
    const attemptsField = findFieldLine(text, "attempts_used");
    const retriesField = findFieldLine(text, "retry_count") || findFieldLine(text, "retries_used");
    const filesField = findFieldLine(text, "files_touched");
    const filesBlock = parseBulletListBlock(text, "files_touched", {
      strictBullets: false,
      allowInlineNone: true,
    });
    const policyField = findFieldLine(text, "policy_summary");
    const nextActionField = findFieldLine(text, "next_action");
    const handoffField = findFieldLine(text, "handoff_target") || findFieldLine(text, "handoff_details");

    const status = normalizeOrchestratorStatus(statusField ? statusField.value : "");
    const verdict = normalizeLineValue(verdictField ? verdictField.value : "").toUpperCase() || null;
    const attemptsUsed = parseOptionalInteger(attemptsField ? attemptsField.value : "");
    const explicitRetryCount = parseOptionalInteger(retriesField ? retriesField.value : "");
    const retryCount = explicitRetryCount !== null
      ? explicitRetryCount
      : attemptsUsed !== null
        ? Math.max(0, attemptsUsed - 1)
        : null;

    const listFromBlock = filesBlock.items.filter(Boolean);
    const listFromInline = filesField ? parseInlineList(filesField.value) : [];
    const filesTouched = (listFromBlock.length > 0 ? listFromBlock : listFromInline)
      .map((item) => normalizeLineValue(item))
      .filter(Boolean);

    const policySummary = normalizeLineValue(policyField ? policyField.value : "") || null;
    const nextAction = normalizeLineValue(nextActionField ? nextActionField.value : "") || null;
    const handoffTarget = normalizeLineValue(handoffField ? handoffField.value : "") || null;

    const hasMinimumSignals = Boolean(status || verdict)
      && Boolean(policySummary || nextAction || attemptsUsed !== null || filesTouched.length > 0);

    if (!hasMinimumSignals) {
      return {
        ok: false,
        reason: "missing required orchestrator payload fields",
      };
    }

    return {
      ok: true,
      data: {
        status,
        verdict,
        attemptsUsed,
        retryCount,
        filesTouched,
        policySummary,
        nextAction,
        handoffTarget,
      },
    };
  } catch {
    return {
      ok: false,
      reason: "failed to parse orchestrator payload",
    };
  }
}

module.exports = {
  parseHeartbeatMaintainerOutput,
  parsePolicyDiscriminatorOutput,
  parseOrchestratorResultPayload,
};
