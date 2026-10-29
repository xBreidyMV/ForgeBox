import Fastify, { fastify } from "fastify";
import cors from "@fastify/cors";
import { experimentRoutes } from "./experiments/router.js";

const app = Fastify({
    logger: true
});

await app.register(cors, {
    origin: "http://localhost:5173"
});

await app.register(experimentRoutes);

app.get("/health", async () => {
    return {
        status: "ok",
        service: "forgebox-api",
        timestamp: new Date().toISOString(),
    };
});

try {
    await app.listen({
        host: "127.0.0.1",
        port: 4310
    });
} catch (error) {
    app.log.error(error);
    process.exit();
}