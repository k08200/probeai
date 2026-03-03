import { type ChildProcess, spawn } from "node:child_process";
import type { Scenario, Step } from "../scenario/types.js";

/** Raw output captured from an agent run */
export interface RunOutput {
	stdout: string;
	stderr: string;
	exitCode: number;
	durationMs: number;
	stepResults: StepResult[];
}

/** Result of a single step execution */
export interface StepResult {
	step: Step;
	stdout: string;
	stderr: string;
	success: boolean;
}

/** Run a scenario against the target agent and capture output */
export async function runScenario(scenario: Scenario): Promise<RunOutput> {
	const start = Date.now();

	if (scenario.agent.type === "command") {
		return runCommandAgent(scenario, start);
	}

	throw new Error(`Agent type "${scenario.agent.type}" not yet supported`);
}

async function runCommandAgent(scenario: Scenario, start: number): Promise<RunOutput> {
	const command = scenario.agent.command;
	if (!command) throw new Error("Command agent requires 'command' field");

	const timeout = (scenario.timeout ?? 120) * 1000;
	let fullStdout = "";
	let fullStderr = "";
	const stepResults: StepResult[] = [];

	const proc = spawn("bash", ["-c", command], {
		env: { ...process.env, ...scenario.agent.env },
		stdio: ["pipe", "pipe", "pipe"],
	});

	// Track process exit immediately so we don't miss it
	let exited = false;
	let exitCode = 0;
	const exitPromise = new Promise<number>((resolve) => {
		proc.on("close", (code) => {
			exited = true;
			exitCode = code ?? 0;
			resolve(exitCode);
		});
	});

	// Collect all output
	proc.stdout.on("data", (data: Buffer) => {
		fullStdout += data.toString();
	});
	proc.stderr.on("data", (data: Buffer) => {
		fullStderr += data.toString();
	});

	// Wait for process to be ready or exit quickly
	await Promise.race([sleep(500), exitPromise]);

	// Execute steps (skip if process already done)
	for (const step of scenario.steps) {
		const result = await executeStep(proc, step, exited);
		stepResults.push(result);
		fullStdout += result.stdout;
		fullStderr += result.stderr;
	}

	// Wait for process to finish (or terminate it)
	if (!exited) {
		const finalCode = await terminateProcess(proc, exitPromise, timeout);
		exitCode = finalCode;
	}

	return {
		stdout: fullStdout,
		stderr: fullStderr,
		exitCode,
		durationMs: Date.now() - start,
		stepResults,
	};
}

async function executeStep(proc: ChildProcess, step: Step, processExited: boolean): Promise<StepResult> {
	switch (step.action) {
		case "send": {
			if (processExited || !proc.stdin?.writable) {
				return { step, stdout: "", stderr: "process already exited", success: false };
			}
			proc.stdin.write(`${step.input}\n`);
			await sleep(1000);
			return { step, stdout: "", stderr: "", success: true };
		}
		case "wait": {
			await sleep(step.duration ?? 1000);
			return { step, stdout: "", stderr: "", success: true };
		}
		case "check_output": {
			return { step, stdout: "", stderr: "", success: true };
		}
		case "check_file": {
			return { step, stdout: "", stderr: "", success: true };
		}
		default:
			return { step, stdout: "", stderr: `Unknown action: ${step.action}`, success: false };
	}
}

function terminateProcess(proc: ChildProcess, exitPromise: Promise<number>, timeout: number): Promise<number> {
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			proc.kill("SIGKILL");
			resolve(137);
		}, timeout);

		exitPromise.then((code) => {
			clearTimeout(timer);
			resolve(code);
		});

		// Try graceful shutdown
		if (proc.stdin?.writable) {
			proc.stdin.end();
		}
		proc.kill("SIGTERM");
	});
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
