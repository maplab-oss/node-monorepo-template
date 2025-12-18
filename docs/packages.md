# Package Architecture

## Client/Server Split

Packages that contain database clients, Node.js-specific APIs, or other server-only code **must** use a client/server split to prevent these dependencies from being bundled into the frontend.

### Pattern

Each package should have two main export files:

1. **`src/index.ts`** - Client-safe exports (types, schemas, constants only)
2. **`src/server.ts`** - Server-only exports (functions, database clients, Node.js APIs)

### Example Structure

```
packages/my-package/
├── src/
│   ├── index.ts          # Client-safe exports
│   ├── server.ts         # Server-only exports
│   ├── types.ts          # Type definitions
│   ├── schemas.ts        # Zod schemas
│   ├── db.ts             # Database client (MongoDB, etc.)
│   └── functions/        # Implementation files
└── package.json          # Export configuration
```

### index.ts (Client-Safe)

```typescript
// Client-safe exports (types and schemas only)
// Safe to import in browser environments

export {
  mySchema,
  type MyType,
  type MyInput,
  type MyOutput,
} from "./types";

export { MY_CONSTANTS } from "./constants";
```

### server.ts (Server-Only)

```typescript
// Server-only exports - imports MongoDB and other Node.js dependencies
// NEVER import this file from frontend code

export { getClient, getDb, closeDb } from "./db";
export { myServerFunction } from "./functions/myServerFunction";
export { processData } from "./functions/processData";

// Re-export client-safe items for convenience
export type { MyType, MyInput, MyOutput } from "./types";
export { mySchema } from "./types";
```

### package.json Configuration

Add export paths to support both imports:

```json
{
  "name": "@maplab-oss/my-package",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./server": {
      "import": "./src/server.ts",
      "types": "./src/server.ts"
    }
  }
}
```

## Import Rules

### Frontend Code

Frontend code should **only** import from the main package:

```typescript
// ✅ Good - importing types/schemas
import { type MyType, mySchema } from "@maplab-oss/my-package";

// ❌ Bad - importing server functions
import { myServerFunction } from "@maplab-oss/my-package";
import { getDb } from "@maplab-oss/my-package/server";
```

### Backend/Server Code

Backend code should import from `/server`:

```typescript
// ✅ Good - importing server functions
import { myServerFunction, getDb } from "@maplab-oss/my-package/server";

// ✅ Also good - importing types from main package
import { type MyType } from "@maplab-oss/my-package";

// ✅ Best - import both from server (re-exported)
import { myServerFunction, type MyType } from "@maplab-oss/my-package/server";
```

### tRPC Procedures

In tRPC procedures, prefer importing from `/server`:

```typescript
import { z } from "zod";
import { t } from "../trpc";
import { myServerFunction } from "@maplab-oss/my-package/server";
import { mySchema } from "@maplab-oss/my-package";

export const myRouter = t.router({
  getData: t.procedure
    .input(mySchema)
    .query(async ({ input }) => {
      return myServerFunction(input);
    }),
});
```

## Packages Using This Pattern

- **`@maplab-oss/messaging`** - MongoDB client, Redis, WebSocket server code
- **`@maplab-oss/profiles`** - MongoDB client, profile management
- **`@maplab-oss/artifacts`** - MongoDB client, object storage and docs/links server code
- **`@maplab-oss/admin`** - Redis, usage tracking, and rate/resource limit server code

## Packages That Don't Need This

Packages that only contain:
- Pure types
- Pure functions (no Node.js APIs)
- Client-safe constants
- Zod schemas

Examples:
- **`@maplab-oss/bots`** - Only hardcoded data and types
- **`@maplab-oss/orb0-config`** - Exports env vars and constants (not used in frontend)

## When in Doubt

If you're creating a new package and unsure whether it needs the client/server split:

1. Does it import `mongodb`, `ioredis`, `fs`, `path`, or other Node.js-only modules?
2. Does it create database clients or connections?
3. Will it be imported (directly or transitively) by frontend code?

If **YES** to any of these → use the client/server split pattern.

## Common Mistakes

❌ **Exporting server functions from main index:**
```typescript
// src/index.ts - DON'T DO THIS
export { getDb } from "./db";  // MongoDB client!
```

❌ **Importing server code in frontend:**
```typescript
// Frontend component - DON'T DO THIS
import { getProfile } from "@maplab-oss/profiles";  // Server function!
```

❌ **Not configuring package.json exports:**
```json
{
  "exports": {
    ".": "./src/index.ts"
    // Missing "./server" export!
  }
}
```

## Dependency Injection

Server-only dependencies (database clients, Redis connections, etc.) should be made available through **tRPC context** rather than importing directly in shared code.

See [trpc.md](./trpc.md) for more on context and dependency injection patterns.

