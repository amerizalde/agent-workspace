const HEARTBEAT_ACTIONS = new Set([
  "noop",
  "recommendation",
  "planning-handoff",
  "implementation-handoff",
]);

const CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);
const POLICY_VERDICTS = new Set(["PASS", "FAIL"]);
const POLICY_CONFIDENCE = new Set(["high", "medium"]);

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

module.exports = {
  parseHeartbeatMaintainerOutput,
  parsePolicyDiscriminatorOutput,
};
