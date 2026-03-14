import type { FastifyInstance } from "fastify";

export async function agentRoutes(app: FastifyInstance) {
  // POST /api/agents — Register an agent
  app.post("/", async (request, reply) => {
    const { name, endpoint, apiKey } = request.body as {
      name: string;
      endpoint: string;
      apiKey?: string;
    };

    // TODO: save to DB
    const agent = {
      id: crypto.randomUUID(),
      name,
      endpoint,
      hasApiKey: !!apiKey,
      createdAt: new Date().toISOString(),
    };

    return reply.code(201).send(agent);
  });

  // GET /api/agents — List agents
  app.get("/", async () => {
    // TODO: fetch from DB
    return { agents: [], total: 0 };
  });

  // GET /api/agents/:id — Get agent details
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    // TODO: fetch from DB
    return { id, name: "placeholder", endpoint: "https://...", testCount: 0 };
  });
}
