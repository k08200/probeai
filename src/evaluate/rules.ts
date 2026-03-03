import { existsSync, readFileSync } from "node:fs";
import type { RuleCheck } from "../scenario/types.js";
import type { RunOutput } from "../core/runner.js";

/** Result of evaluating a single rule */
export interface RuleResult {
	rule: RuleCheck;
	passed: boolean;
	detail: string;
}

/** Evaluate all rules against a run output */
export function evaluateRules(rules: RuleCheck[], output: RunOutput): RuleResult[] {
	return rules.map((rule) => evaluateRule(rule, output));
}

/** Calculate a score (0-100) from rule results */
export function calculateRuleScore(results: RuleResult[]): number {
	if (results.length === 0) return 0;

	let totalWeight = 0;
	let earnedWeight = 0;

	for (const r of results) {
		const weight = r.rule.weight ?? 1;
		totalWeight += weight;
		if (r.passed) earnedWeight += weight;
	}

	return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

function evaluateRule(rule: RuleCheck, output: RunOutput): RuleResult {
	const target = resolveTarget(rule.target, output);

	switch (rule.type) {
		case "contains":
			return {
				rule,
				passed: target.includes(rule.value),
				detail: target.includes(rule.value)
					? `Found "${rule.value}"`
					: `"${rule.value}" not found in ${rule.target}`,
			};

		case "regex": {
			const re = new RegExp(rule.value);
			const match = re.test(target);
			return {
				rule,
				passed: match,
				detail: match ? `Regex /${rule.value}/ matched` : `Regex /${rule.value}/ did not match`,
			};
		}

		case "file_exists": {
			const exists = existsSync(rule.value);
			return {
				rule,
				passed: exists,
				detail: exists ? `File ${rule.value} exists` : `File ${rule.value} not found`,
			};
		}

		case "exit_code": {
			const expected = Number.parseInt(rule.value, 10);
			const actual = output.exitCode;
			return {
				rule,
				passed: actual === expected,
				detail: actual === expected ? `Exit code ${actual} matches` : `Expected exit ${expected}, got ${actual}`,
			};
		}

		case "json_match": {
			try {
				const parsed = JSON.parse(target) as Record<string, unknown>;
				const expected = JSON.parse(rule.value) as Record<string, unknown>;
				const match = shallowMatch(parsed, expected);
				return {
					rule,
					passed: match,
					detail: match ? "JSON structure matches" : "JSON structure mismatch",
				};
			} catch {
				return { rule, passed: false, detail: "Failed to parse JSON" };
			}
		}

		default:
			return { rule, passed: false, detail: `Unknown rule type: ${rule.type}` };
	}
}

function resolveTarget(target: string, output: RunOutput): string {
	if (target === "stdout") return output.stdout;
	if (target === "stderr") return output.stderr;
	if (target === "exit") return String(output.exitCode);
	if (target.startsWith("file:")) {
		const path = target.slice(5);
		try {
			return readFileSync(path, "utf-8");
		} catch {
			return "";
		}
	}
	return output.stdout;
}

function shallowMatch(actual: Record<string, unknown>, expected: Record<string, unknown>): boolean {
	for (const key of Object.keys(expected)) {
		if (actual[key] !== expected[key]) return false;
	}
	return true;
}
