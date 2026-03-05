// Core
export { probe, type ProbeOptions } from "./core/probe.js";
export type { ProbeResult } from "./report/generator.js";

// Types
export type {
	Scenario,
	AgentTarget,
	Step,
	EvaluationConfig,
	RuleCheck,
} from "./scenario/types.js";

// Loaders
export { loadScenario, loadScenarios } from "./scenario/loader.js";

// Execution & evaluation
export { runScenario, type RunOutput, type StepResult } from "./core/runner.js";
export { evaluate, type EvalResult } from "./evaluate/index.js";

// Reports
export { saveJsonReport, saveMarkdownReport } from "./report/generator.js";
