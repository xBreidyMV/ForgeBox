
import { performance } from "node:perf_hooks";
import type { ExperimentInput } from "./schemas.js";

export interface ExperimentIteration {
    iteration: number;
    success: boolean;
    statusCode: number;
    durationMs: number;
    error: string | null;
}

export interface ExperimentResult {
    id: string;
    name: string;
    mode: ExperimentInput["mode"];
    startedAt: string;
    completedAt: string;
    totalDurationMs: number;
    iterations: number;
    successful: number;
    failed: number;
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    results: ExperimentIteration[];
}

function simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runExperiment(
    input: ExperimentInput,
): Promise<ExperimentResult> {
    const startedAt = new Date();
    const overallStart = performance.now();
    const results: ExperimentIteration[] = [];

    for (let i = 1; i <= input.iterations; i++) {
        const start = performance.now();

        await simulateDelay(input.delayMs);

        const durationMs = Number((performance.now() - start).toFixed(2));
        const success = input.mode === "latency";
        const statusCode = success ? 200 : input.statusCode;

        results.push({
            iteration: i,
            success,
            statusCode,
            durationMs,
            error: success ? null : `Error HTTP simulado: ${statusCode}`,
        });
    }

    const completedAt = new Date();
    const durations = results.map((result) => result.durationMs);
    const successful = results.filter((result) => result.success).length;

    return {
        id: crypto.randomUUID(),
        name: input.name,
        mode: input.mode,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        totalDurationMs: Number((performance.now() - overallStart).toFixed(2)),
        iterations: results.length,
        successful,
        failed: results.length - successful,
        averageLatencyMs: Number(
            (durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2),
        ),
        minLatencyMs: Number(Math.min(...durations).toFixed(2)),
        maxLatencyMs: Number(Math.max(...durations).toFixed(2)),
        results,
    };
}
