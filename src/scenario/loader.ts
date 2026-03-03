import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import type { Scenario } from "./types.js";

/** Load a scenario from a YAML file */
export function loadScenario(filePath: string): Scenario {
	const raw = readFileSync(filePath, "utf-8");
	const data = yaml.load(raw) as Scenario;

	if (!data.id) throw new Error(`Scenario missing 'id' in ${filePath}`);
	if (!data.name) throw new Error(`Scenario missing 'name' in ${filePath}`);
	if (!data.agent) throw new Error(`Scenario missing 'agent' in ${filePath}`);
	if (!data.steps || data.steps.length === 0) {
		throw new Error(`Scenario missing 'steps' in ${filePath}`);
	}
	if (!data.evaluate) throw new Error(`Scenario missing 'evaluate' in ${filePath}`);

	return data;
}

/** Load multiple scenarios from a list of paths */
export function loadScenarios(filePaths: string[]): Scenario[] {
	return filePaths.map(loadScenario);
}
