import { FastifyInstance } from "fastify";
import { message } from "@maplab-oss/helloworld-config";

export async function helloWorldRouter(fastify: FastifyInstance) {
  fastify.get("/", async () => {
    return { message };
  });
}
