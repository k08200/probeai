import Fastify from "fastify";
import cors from "@fastify/cors";
import { testRoutes } from "./routes/tests.js";
import { agentRoutes } from "./routes/agents.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(testRoutes, { prefix: "/api/tests" });
await app.register(agentRoutes, { prefix: "/api/agents" });

app.get("/api/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

const port = Number(process.env.PORT) || 3001;
await app.listen({ port, host: "0.0.0.0" });
console.log(`ProbeAI API running on http://localhost:${port}`);
