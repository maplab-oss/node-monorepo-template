- Port should be set with BACKEND_PORT
- Setup networking to expose the same port

Build command
```bash
pnpm turbo run build --filter=@maplab-oss/app-name
```

Start command
```bash
pnpm --filter=@maplab-oss/app-name start
```

Healthceck path: `/health`
