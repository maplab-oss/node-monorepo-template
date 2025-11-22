import Fastify from "fastify";
import cors from "@fastify/cors";
import { isProd, port } from "./config";
import { helloWorldRouter } from "./routers/helloWorld";
import { healthRouter } from "./routers/health";

const app = Fastify({
  trustProxy: true,
});

const frontendUrl = "https://node-monorepo-template.vercel.app";

await app.register(cors, {
  origin: isProd ? [frontendUrl] : true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

await app.register(helloWorldRouter);
await app.register(healthRouter);

try {
  await app.listen({ port, host: isProd ? "0.0.0.0" : undefined });
  console.log(`Fastify running at http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
