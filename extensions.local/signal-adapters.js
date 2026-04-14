function summarizePayload(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => summarizePayload(item)).filter(Boolean).join("\n");
  }
  if (!value || typeof value !== "object") return "";

  const maybe = value;
  return [maybe.text, maybe.content, maybe.message, maybe.error, maybe.data]
    .map((item) => summarizePayload(item))
    .filter(Boolean)
    .join("\n");
}

function toCount(matches) {
  return Array.isArray(matches) ? matches.length : 0;
}

function pickLargestNumber(text, regex) {
  let largest = null;
  let match;
  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
  while ((match = re.exec(text)) !== null) {
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed)) continue;
    largest = largest === null ? parsed : Math.max(largest, parsed);
  }
  return largest;
}

function extractDirectDiagnostics(text) {
  const low = String(text || "").toLowerCase();
  if (!low) return null;

  const hasDiagnosticContext = /\bdiagnostics?\b|\bproblems?\b|\beslint\b|\bts\d{3,5}\b/.test(low);
  if (!hasDiagnosticContext) return null;

  const explicitErrorCount = pickLargestNumber(low, /(\d+)\s+errors?/g);
  const explicitWarningCount = pickLargestNumber(low, /(\d+)\s+warnings?/g);
  const explicitInfoCount = pickLargestNumber(low, /(\d+)\s+(infos?|hints?)/g);

  const errorCount = explicitErrorCount ?? toCount(low.match(/\berror\b|\bexception\b/g));
  const warningCount = explicitWarningCount ?? toCount(low.match(/\bwarning\b/g));
  const infoCount = explicitInfoCount ?? toCount(low.match(/\binfo\b|\bhint\b/g));

  return {
    available: true,
    errorCount,
    warningCount,
    infoCount,
  };
}

function extractDirectTests(text) {
  const low = String(text || "").toLowerCase();
  if (!low) return null;

  const hasTestContext = /\btests?\b|\bpytest\b|\bvitest\b|\bjest\b|\bmocha\b|\bunittest\b/.test(low);
  if (!hasTestContext) return null;

  const explicitFailedCount = pickLargestNumber(low, /(\d+)\s+failed\b/g);
  const failedCount = explicitFailedCount ?? toCount(low.match(/\bfailed\b|\bfailing\b/g));

  return {
    available: true,
    failedCount,
    hasFailures: failedCount > 0,
  };
}

function extractDirectGit(text) {
  const raw = String(text || "");
  const low = raw.toLowerCase();
  if (!raw) return null;

  const hasGitContext = /\bgit status\b|\bon branch\b|^##\s|\bworking tree\b|\bchanges to be committed\b|\bchanges not staged\b/m.test(low);
  if (!hasGitContext) return null;

  let branch = null;
  const branchMatch = /on branch\s+([^\s]+)/i.exec(raw) || /^##\s+([^\.\s]+)/m.exec(raw);
  if (branchMatch) branch = branchMatch[1];

  let stagedCount = 0;
  let unstagedCount = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!/^[ MARCUD\?]{2}\s+/.test(line)) continue;
    const stagedCode = line[0];
    const unstagedCode = line[1];

    if (stagedCode !== " " && stagedCode !== "?") stagedCount += 1;
    if (unstagedCode !== " " && unstagedCode !== "?") unstagedCount += 1;
  }

  if (stagedCount === 0 && unstagedCount === 0) {
    stagedCount = toCount(low.match(/\bto be committed\b|\bstaged\b/g));
    unstagedCount = toCount(low.match(/\bnot staged\b|\bmodified\b|\bdeleted\b|\buntracked\b/g));
  }

  return {
    available: true,
    isDirty: stagedCount + unstagedCount > 0,
    stagedCount,
    unstagedCount,
    branch,
  };
}

function collectDirectSignalsFromPayload(payload) {
  const text = summarizePayload(payload);
  const diagnostics = extractDirectDiagnostics(text);
  const tests = extractDirectTests(text);
  const git = extractDirectGit(text);

  return {
    diagnostics,
    tests,
    git,
    hasAny: Boolean(diagnostics || tests || git),
    summarizedText: text,
  };
}

function chooseDirectThenProbeThenFallback(options) {
  const direct = options?.direct || {};
  const probe = options?.probe || null;
  const fallback = options?.fallback || {};

  const diagnostics = direct.diagnostics || probe?.diagnostics || fallback.diagnostics;
  const tests = direct.tests || probe?.tests || fallback.tests;
  const git = direct.git || probe?.git || fallback.git;

  const usedDirect = Boolean(direct.diagnostics || direct.tests || direct.git);
  const usedProbe = !usedDirect && Boolean(probe && (probe.diagnostics || probe.tests || probe.git));

  const sourceTier = usedDirect ? "direct-adapter" : usedProbe ? "external-probe" : "session-typed";

  return {
    sourceTier,
    diagnostics,
    tests,
    git,
  };
}

module.exports = {
  collectDirectSignalsFromPayload,
  chooseDirectThenProbeThenFallback,
};
