import type { RunOutput } from "../core/runner.js";

/** Result of LLM-based evaluation */
export interface LlmEvalResult {
	score: number;
	reasoning: string;
	passed: boolean;
}

/**
 * Evaluate agent output using an LLM judge.
 *
 * For now, this is a stub that uses Ollama.
 * The rubric defines what the LLM should evaluate against.
 */
export async function evaluateWithLlm(
	rubric: string,
	output: RunOutput,
	ollamaHost = "http://localhost:11434",
	model = "qwen2.5:14b",
): Promise<LlmEvalResult> {
	const prompt = buildEvalPrompt(rubric, output);

	try {
		const response = await fetch(`${ollamaHost}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model,
				prompt,
				stream: false,
			}),
		});

		if (!response.ok) {
			return { score: 0, reasoning: `Ollama error: ${response.status} — model "${model}" at ${ollamaHost}`, passed: false };
		}

		const data = (await response.json()) as { response: string };
		return parseLlmResponse(data.response);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { score: 0, reasoning: `LLM evaluation failed: ${msg}`, passed: false };
	}
}

function buildEvalPrompt(rubric: string, output: RunOutput): string {
	return `You are an AI agent evaluator. Score the agent's output based on the rubric below.

## Rubric
${rubric}

## Agent Output
### stdout
${output.stdout.slice(-3000)}

### stderr
${output.stderr.slice(-1000)}

### Exit Code
${output.exitCode}

### Duration
${output.durationMs}ms

## Instructions
Evaluate the agent's performance. Respond in this exact JSON format:
{"score": <0-100>, "reasoning": "<brief explanation>"}

Only output the JSON, nothing else.`;
}

function parseLlmResponse(text: string): LlmEvalResult {
	try {
		// Extract JSON from response (LLM might add extra text)
		const jsonMatch = text.match(/\{[\s\S]*"score"[\s\S]*"reasoning"[\s\S]*\}/);
		if (!jsonMatch) {
			return { score: 0, reasoning: `Could not parse LLM response: ${text.slice(0, 200)}`, passed: false };
		}

		const parsed = JSON.parse(jsonMatch[0]) as { score: number; reasoning: string };
		return {
			score: parsed.score,
			reasoning: parsed.reasoning,
			passed: parsed.score >= 60,
		};
	} catch {
		return { score: 0, reasoning: `JSON parse failed: ${text.slice(0, 200)}`, passed: false };
	}
}
