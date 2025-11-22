import { FastifyInstance } from "fastify";

export async function healthRouter(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    return { status: "ok" };
  });
}
