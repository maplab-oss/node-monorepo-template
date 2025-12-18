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

Modules re-export the shared `t` instance from `@maplab-oss/system/server` (see section 5).

### 2. Routers Must Be Pure and Portable

Routers are imported on both frontend (for types) and backend (for execution), so they must remain pure with no side effects. All runtime dependencies are injected via context.

### 3. Procedures are Defined in Separate Files

Each procedure is defined in its own file under `procedures/`. Procedures import the module’s local `t` instance and access dependencies via `ctx`:
If a procedure is very small, it can keep its transport concerns and DB/query logic inline; extract helpers only when the logic starts growing or is reused elsewhere.

```typescript
// packages/customers/src/procedures/getCustomer.ts
import { t } from "../trpc";
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
import { t } from "./trpc";
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

### 5. Shared tRPC Instance and Unified Router

All modules use a **shared tRPC instance** from the system package. This is required for two reasons:

1. **Type inference**: TypeScript needs a single `t` to infer the composed router type correctly
2. **React context**: Multiple `createTRPCReact()` calls create separate React contexts that shadow each other when nested

The shared instance lives in the system package:

```typescript
// packages/system/src/trpc.ts
import { initTRPC } from "@trpc/server";
import type { AppContext } from "./context";

export const t = initTRPC.context<AppContext>().create();
```

Each module imports this shared instance:

```typescript
// packages/messaging/src/trpc.ts
export { t } from "@maplab-oss/system/server";

// packages/messaging/src/server.ts
import { t } from "./trpc";

export const messagingRouter = t.router({
  messages: t.router({
    send: sendMessage,
    fetch: fetchMessages,
    // ...
  }),
  channels: t.router({
    get: getChannel,
    create: createChannel,
    // ...
  }),
});
```

The backend composes all module routers into a single `appRouter`:

```typescript
// apps/backend/src/router.ts
import { t } from "@maplab-oss/system/server";
import { messagingRouter } from "@maplab-oss/messaging/server";
import { profilesRouter } from "@maplab-oss/profiles/server";
import { artifactsRouter } from "@maplab-oss/artifacts/server";
import { adminRouter } from "@maplab-oss/admin/server";
import { botsRouter } from "@maplab-oss/bots/server";

export const appRouter = t.router({
  messaging: messagingRouter,
  profiles: profilesRouter,
  artifacts: artifactsRouter,
  admin: adminRouter,
  bots: botsRouter,
});

export type AppRouter = typeof appRouter;
```

The backend exposes this unified router at a single endpoint:

```typescript
// apps/backend/src/plugins.ts
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "./router";
import { db, redis, agentQueue } from "./connections";

await app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext: () => ({
      db,
      redis,
      agentQueue,
      userId: undefined,
    }),
  },
});
```

**Benefits:**
- ✅ Perfect TypeScript inference (no `as any` needed)
- ✅ Single tRPC client and provider (no React context collisions)
- ✅ Request batching works correctly
- ✅ Standard tRPC pattern (easier for other developers)

**Frontend Setup:**

The frontend creates a single tRPC client for the unified router:

```typescript
// apps/frontend/src/trpc.ts
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "@maplab-oss/orb0-backend";

const baseUrl = apiBaseUrl ?? "http://localhost:8000";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: `${baseUrl}/trpc` })],
});

// Convenience exports matching package structure
export const messaging = trpc.messaging;
export const profiles = trpc.profiles;
export const artifacts = trpc.artifacts;
export const admin = trpc.admin;
export const bots = trpc.bots;
```

Single provider wrapping:

```typescript
// apps/frontend/src/main.tsx
<trpc.Provider client={trpcClient} queryClient={queryClient}>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</trpc.Provider>
```

Usage in components:

```typescript
import { messaging, profiles, artifacts, admin } from "@/trpc";

// Use nested structure matching package organization
const { data } = messaging.channels.sidebar.useQuery({ userId });
const mutation = profiles.profiles.update.useMutation();
const docs = artifacts.docs.list.useQuery({ channelId });
const credits = admin.credits.get.useQuery({ userId });
```

### 6. Backend Manages Shared Resources

The backend creates all shared resources once and passes them as tRPC context (see code example in section 5 above).

## Type Definitions (`src/types.ts`)

Define Zod schemas and infer TypeScript types for your domain entities. Use schema composition (`.omit()`, `.partial()`, etc.) to create related schemas.

## Context Design

Define a shared `AppContext` interface in the config package that includes common dependencies (db, redis, userId, etc.). Modules import this type and create their own tRPC instance with it. Modules access these via `ctx` in their procedures. If specific modules need additional dependencies, extend the base context interface.
