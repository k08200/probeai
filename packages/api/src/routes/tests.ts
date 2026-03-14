import type { FastifyInstance } from "fastify";

export async function testRoutes(app: FastifyInstance) {
  // POST /api/tests — Run a new test
  app.post("/", async (request, reply) => {
    const { agentId, scenarioIds, count } = request.body as {
      agentId: string;
      scenarioIds?: string[];
      count?: number;
    };

    // TODO: queue test run via BullMQ
    const testRun = {
      id: crypto.randomUUID(),
      agentId,
      status: "queued",
      scenarioCount: count ?? 100,
      createdAt: new Date().toISOString(),
    };

    return reply.code(201).send(testRun);
  });

  // GET /api/tests/:id — Get test result
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    // TODO: fetch from DB
    return {
      id,
      status: "completed",
      score: 87,
      pass: 988,
      fail: 8,
      warning: 4,
    };
  });

  // GET /api/tests — List test runs
  app.get("/", async () => {
    // TODO: fetch from DB with pagination
    return { tests: [], total: 0 };
  });
}
