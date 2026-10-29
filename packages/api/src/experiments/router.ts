
import type { FastifyInstance } from "fastify";
import { experimentSchema } from "./schemas.js";
import { runExperiment } from "./runner.js";
import { createReport } from "../reports/report.js";

export async function experimentRoutes(app: FastifyInstance) {
  app.post("/experiments/run", async (request, reply) => {
    const parsed = experimentSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Parámetros de experimento inválidos",
        details: parsed.error.issues,
      });
    }

    try {
      const result = await runExperiment(parsed.data);
      return reply.code(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: "No se pudo ejecutar el experimento",
      });
    }
  });

  app.post("/experiments/report", async (request, reply) => {
    const parsed = experimentSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Parámetros de informe inválidos",
        details: parsed.error.issues,
      });
    }

    try {
      const result = await runExperiment(parsed.data);
      const report = createReport(result);

      return reply
        .header("Content-Type", "application/json; charset=utf-8")
        .header(
          "Content-Disposition",
          `attachment; filename="forgebox-report-${result.id}.json"`,
        )
        .send(report);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: "No se pudo generar el informe",
      });
    }
  });
}
