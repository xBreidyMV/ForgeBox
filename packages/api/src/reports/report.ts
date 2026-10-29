
import type { ExperimentResult } from "../experiments/runner.js";

export function createReport(result: ExperimentResult) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    product: "ForgeBox",
    experiment: result,
  };
}
