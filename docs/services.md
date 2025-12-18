# Managing Services & Infrastructure

Guide for adding/modifying services in Orb0 infrastructure.

## Configuration Files

- **`zap.yaml`** - Local services (`bare_metal` for Node.js apps, `docker` for containers)
- **`render.yaml`** - Production deployment (Render.com)
- **`.env`/`.env.base`** - Environment variables for local dev

## Adding a New Service

### 1. Generate Random Port

Always use random ports to avoid conflicts with other projects:

```bash
etc/bin/randomport  # e.g., 31594
```

### 2. Add to zap.yaml

**Node.js service:**

```yaml
bare_metal:
  my-service:
    cmd: pnpm --filter=@maplab-oss/my-service dev
    env:
      - MY_SERVICE_PORT
```

**Docker service:**

```yaml
docker:
  my-database:
    image: postgres:16
    ports:
      - "31594:5432"  # random:container
    env:
      - POSTGRES_DB=myapp
```

### 3. Add Environment Variables

In `.env`, then whitelist in the service's `env:` array in `zap.yaml`.

### 4. Add to render.yaml

Add the service to production deployment config. See Render's Blueprint Specification docs for syntax. Key things to configure:
- Build and start commands (use turbo filters)
- Environment variables
- Build filters (which file changes trigger redeployment)
- For static sites: `staticPublishPath` and routes
- For databases: use `fromService` to reference connection strings

### 5. Create package.json

Use `@maplab-oss/package-name` naming with `dev`, `start`, and `build` scripts.

### 6. Update orbitos.code-workspace

Add the new folder, maintain general priority order.

### 7. Update buildAll Task

Add to `buildAll` task in `zap.yaml` if the service is buildable.

### 8. Start Service

```bash
zap up my-service
```

## Environment Variables Checklist

When adding env vars, update all three:
- `.env`
- `zap.yaml` service's `env:` array (whitelist)
- `render.yaml` service's `envVars:` section

## Quick Reference

```bash
etc/bin/randomport              # Generate random port
zap status                      # Check running services
zap up my-service              # Start service
zap restart my-service         # Restart after changes
zap logs my-service --no-follow
```

See [zapper-usage.md](./zapper-usage.md) for more commands.
