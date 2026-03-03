import chalk from "chalk";
import type { EvalResult } from "../evaluate/index.js";
import { evaluate } from "../evaluate/index.js";
import type { ProbeResult } from "../report/generator.js";
import { saveJsonReport, saveMarkdownReport } from "../report/generator.js";
import type { Scenario } from "../scenario/types.js";
import { type RunOutput, runScenario } from "./runner.js";

export interface ProbeOptions {
	/** Output directory for reports */
	outputDir: string;
	/** Whether to generate markdown report */
	markdown: boolean;
	/** Verbose output */
	verbose: boolean;
}

/** Run all scenarios and produce reports */
export async function probe(scenarios: Scenario[], options: ProbeOptions): Promise<ProbeResult[]> {
	const results: ProbeResult[] = [];

	console.log(chalk.blue(`\nRunning ${scenarios.length} scenario(s)...\n`));

	for (const scenario of scenarios) {
		console.log(chalk.gray(`  [${scenario.id}] ${scenario.name}`));

		let output: RunOutput;
		let evaluation: EvalResult;

		try {
			// Run
			output = await runScenario(scenario);

			if (options.verbose) {
				console.log(chalk.gray(`    stdout: ${output.stdout.slice(0, 300).replace(/\n/g, "\\n")}`));
				if (output.stderr) {
					console.log(chalk.gray(`    stderr: ${output.stderr.slice(0, 200).replace(/\n/g, "\\n")}`));
				}
				console.log(chalk.gray(`    exit: ${output.exitCode}, duration: ${output.durationMs}ms`));
			}

			// Evaluate
			evaluation = await evaluate(scenario.evaluate, output);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.log(chalk.red(`    ERROR: ${msg}`));
			output = { stdout: "", stderr: msg, exitCode: 1, durationMs: 0, stepResults: [] };
			evaluation = { score: 0, passed: false, method: scenario.evaluate.method };
		}

		const icon = evaluation.passed ? chalk.green("PASS") : chalk.red("FAIL");
		console.log(`    ${icon} score=${evaluation.score}/100`);

		results.push({
			scenario,
			output,
			evaluation,
			timestamp: new Date().toISOString(),
		});
	}

	// Generate reports
	const jsonPath = saveJsonReport(results, options.outputDir);
	console.log(chalk.gray(`\nJSON report: ${jsonPath}`));

	if (options.markdown) {
		const mdPath = saveMarkdownReport(results, options.outputDir);
		console.log(chalk.gray(`Markdown report: ${mdPath}`));
	}

	// Summary
	const passed = results.filter((r) => r.evaluation.passed).length;
	const failed = results.length - passed;

	console.log("");
	if (failed === 0) {
		console.log(chalk.green(`All ${passed} scenario(s) passed!`));
	} else {
		console.log(chalk.red(`${failed} of ${results.length} scenario(s) failed.`));
	}

	return results;
}
