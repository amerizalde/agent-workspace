// @ts-nocheck
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type PolicyState = {
  strictMode: boolean;
  autoRepair: boolean;
};

const DEFAULT_STATE: PolicyState = {
  strictMode: true,
  autoRepair: true,
};

const STATE_ENTRY_TYPE = "coder-policy-state";
const STATUS_ID = "coder-policy";

function parseToggleArg(args: string, current: boolean): boolean | null {
  const normalized = (args || "").trim().toLowerCase();
  if (!normalized) return current;
  if (normalized === "on" || normalized === "true") return true;
  if (normalized === "off" || normalized === "false") return false;
  return null;
}

function looksLikeBroadRewrite(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;

  const maybeInput = input as {
    oldText?: unknown;
    newText?: unknown;
    content?: unknown;
    edits?: unknown;
  };

  if (typeof maybeInput.content === "string") {
    return maybeInput.content.length > 4000;
  }

  if (
    typeof maybeInput.oldText === "string" &&
    typeof maybeInput.newText === "string"
  ) {
    const oldLen = maybeInput.oldText.length;
    const newLen = maybeInput.newText.length;
    return oldLen > 1500 && newLen > 1500;
  }

  if (Array.isArray(maybeInput.edits)) {
    let total = 0;
    for (const edit of maybeInput.edits) {
      if (!edit || typeof edit !== "object") continue;
      const e = edit as { oldText?: unknown; newText?: unknown };
      if (typeof e.oldText === "string") total += e.oldText.length;
      if (typeof e.newText === "string") total += e.newText.length;
    }
    return total > 5000;
  }

  return false;
}

function findViolations(toolContent: string): string[] {
  const violations: string[] = [];
  const low = toolContent.toLowerCase();

  if (/\bfunction\s+(tmp|foo|bar|test)\b/.test(low)) {
    violations.push("non-descriptive function names");
  }

  if (/\b(global|window|process)\.[a-z_]/.test(low) && /\bfunction\b/.test(low)) {
    violations.push("potential hidden side effects through global mutation");
  }

  if (/\n.{0,120}(if|switch|for|while).{0,120}\n/.test(toolContent) && !/TODO|NOTE|\"\"\"|\/\*\*/.test(toolContent)) {
    violations.push("complex control flow without clarifying docs/comments");
  }

  return violations;
}

function updateStatus(ctx: any, state: PolicyState): void {
  if (!ctx.hasUI) return;
  const strict = state.strictMode ? "strict:on" : "strict:off";
  const repair = state.autoRepair ? "repair:on" : "repair:off";
  ctx.ui.setStatus(STATUS_ID, `coder-policy ${strict} ${repair}`);
}

export default function (pi: ExtensionAPI) {
  let state: PolicyState = { ...DEFAULT_STATE };
  let violationBudgetPerTurn = 1;
  let lastViolationSummary = "none";

  pi.on("session_start", async (_event, ctx) => {
    state = { ...DEFAULT_STATE };

    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type !== "custom") continue;
      if (entry.customType !== STATE_ENTRY_TYPE) continue;

      const data = (entry.data ?? {}) as Partial<PolicyState>;
      state = {
        strictMode: typeof data.strictMode === "boolean" ? data.strictMode : state.strictMode,
        autoRepair: typeof data.autoRepair === "boolean" ? data.autoRepair : state.autoRepair,
      };
    }

    updateStatus(ctx, state);
  });

  pi.on("turn_start", async () => {
    violationBudgetPerTurn = 1;
  });

  pi.on("before_agent_start", async (event, _ctx) => {
    const policy = [
      "Coding policy: write code in a functional, self-documenting style.",
      "Prefer pure functions with explicit inputs/outputs.",
      "Use descriptive names and keep functions focused.",
      "Avoid hidden side effects and style-only broad rewrites unless requested.",
      "When logic is non-obvious, add concise explanatory docs/comments.",
    ].join("\n");

    return {
      systemPrompt: `${event.systemPrompt}\n\n${policy}`,
    };
  });

  pi.on("tool_call", async (event, _ctx) => {
    if (!state.strictMode) return;

    if (event.toolName !== "edit" && event.toolName !== "write") return;

    if (looksLikeBroadRewrite(event.input)) {
      return {
        block: true,
        reason:
          "Blocked by coder-policy: broad rewrite detected. Make minimal, intent-preserving changes with functional, self-documenting style.",
      };
    }
  });

  pi.on("tool_result", async (event, _ctx) => {
    if (!state.autoRepair) return;
    if (violationBudgetPerTurn <= 0) return;
    if (event.toolName !== "edit" && event.toolName !== "write") return;

    const text = event.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    if (!text) return;

    const violations = findViolations(text);
    if (violations.length === 0) return;

    violationBudgetPerTurn -= 1;
    lastViolationSummary = violations.join("; ");

    if (state.strictMode) {
      pi.sendUserMessage(
        `Apply one corrective pass for coder-policy. Fix: ${lastViolationSummary}. Keep intent and behavior unchanged.`,
        { deliverAs: "steer" },
      );
    }
  });

  pi.registerCommand("coder-policy", {
    description: "Show coder policy mode and last violation summary",
    handler: async (_args, ctx) => {
      updateStatus(ctx, state);
      if (ctx.hasUI) {
        ctx.ui.notify(
          `coder-policy strict=${state.strictMode} autoRepair=${state.autoRepair} last=${lastViolationSummary}`,
          "info",
        );
      }
    },
  });

  pi.registerCommand("coder-policy-strict", {
    description: "Toggle strict enforcement: /coder-policy-strict on|off",
    handler: async (args, ctx) => {
      const next = parseToggleArg(args, state.strictMode);
      if (next === null) {
        if (ctx.hasUI) {
          ctx.ui.notify("Usage: /coder-policy-strict on|off", "warning");
        }
        return;
      }

      state.strictMode = next;
      pi.appendEntry(STATE_ENTRY_TYPE, state);
      updateStatus(ctx, state);

      if (ctx.hasUI) {
        ctx.ui.notify(`coder-policy strict=${state.strictMode}`, "info");
      }
    },
  });

  pi.registerCommand("coder-policy-repair", {
    description: "Toggle auto repair steering: /coder-policy-repair on|off",
    handler: async (args, ctx) => {
      const next = parseToggleArg(args, state.autoRepair);
      if (next === null) {
        if (ctx.hasUI) {
          ctx.ui.notify("Usage: /coder-policy-repair on|off", "warning");
        }
        return;
      }

      state.autoRepair = next;
      pi.appendEntry(STATE_ENTRY_TYPE, state);
      updateStatus(ctx, state);

      if (ctx.hasUI) {
        ctx.ui.notify(`coder-policy autoRepair=${state.autoRepair}`, "info");
      }
    },
  });
}
