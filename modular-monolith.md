# Modular Monolith Architecture

## Philosophy

This architecture follows a **modular monolith** pattern where:
- Each domain (customers, orders, etc.) is an independent microservice-like module
- Modules could theoretically run on separate instances
- We currently run them all in one backend for simplicity
- Dependencies are injected via tRPC context (no global singletons)

## Core Principles

### 1. Modules Export Complete tRPC Routers

Each module package exports:
- **Client exports** (`src/index.ts`): Types, schemas, constants only
- **Server exports** (`src/server.ts`): Complete tRPC router with all handlers

### 2. Routers Must Be Pure and Portable

Routers are imported on both frontend (for types) and backend (for execution), so they must remain pure with no side effects. All runtime dependencies are injected via context.

### 3. Procedures are Defined in Separate Files

Each procedure is defined in its own file under `procedures/`. Procedures import `t` from the trpc package and access dependencies via `ctx`:

```typescript
// packages/customers/src/procedures/getCustomer.ts
import { t } from "@your-org/trpc/server";
import { z } from "zod";

export const getCustomer = t.procedure
  .input(z.object({ customerId: z.string() }))
  .query(async ({ input, ctx }) => {
    const customers = ctx.db.collection("customers");
    return customers.findOne({ _id: input.customerId });
  });
```

The `server.ts` file imports and composes all procedures into a single router:

```typescript
// packages/customers/src/server.ts
import { t } from "@your-org/trpc/server";
import { getCustomer } from "./procedures/getCustomer";
import { getCustomers } from "./procedures/getCustomers";
import { createCustomer } from "./procedures/createCustomer";
import { updateCustomer } from "./procedures/updateCustomer";
import { deleteCustomer } from "./procedures/deleteCustomer";

export const customersRouter = t.router({
  getCustomer,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
});

export type { Customer, CustomerCreate, CustomerUpdate } from "./types";
```

### 4. Dependencies Injected via Context

All external dependencies (database, Redis, queues) are passed through tRPC context. Modules never create their own connections. Helper functions accept dependencies as parameters rather than importing globals.

### 5. tRPC Package Composes Module Routers

The `packages/trpc` package imports and composes routers from modules:

```typescript
// packages/trpc/src/trpc.ts
import { t } from "./instance";
import { customersRouter } from "@your-org/customers/server";
import { ordersRouter } from "@your-org/orders/server";
import { healthRouter } from "./procedures/health";

export const appRouter = t.router({
  health: healthRouter,          // Local to trpc package
  customers: customersRouter,    // From customers module
  orders: ordersRouter,          // From orders module
});

export type AppRouter = typeof appRouter;
```

### 6. Backend Manages Shared Resources

The backend creates all shared resources once and passes them as tRPC context:

```typescript
// apps/backend/src/index.ts
import { MongoClient } from "mongodb";
import Redis from "ioredis";
import { mongodbUrl } from "@your-org/config";
import { appRouter } from "@your-org/trpc/server";

const mongoClient = new MongoClient(mongodbUrl);
await mongoClient.connect();
const db = mongoClient.db();

// Register with Fastify, passing context
await app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext: () => ({
      db,
      userId: undefined, // Set by auth middleware
      requestId: crypto.randomUUID(),
    }),
  },
});

process.on("SIGTERM", async () => {
  await mongoClient.close();
  await redis.quit();
});
```

## Type Definitions (`src/types.ts`)

Define Zod schemas and infer TypeScript types for your domain entities. Use schema composition (`.omit()`, `.partial()`, etc.) to create related schemas.

## Context Design

Define a shared `AppContext` interface in the trpc package that includes common dependencies (db, redis, userId, etc.). Modules access these via `ctx` in their procedures. If specific modules need additional dependencies, extend the base context interface.
