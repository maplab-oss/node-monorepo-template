export const env = process.env.APP_ENV ?? "production";
export const isProd = env === "production";
export const isDev = env === "development";
export const port = parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "3000", 10);

const frontendUrl = process.env.FRONTEND_URL;

if (isProd && !frontendUrl) {
  console.error("ERROR: FRONTEND_URL environment variable must be set in production");
  console.error("After first deploy, add FRONTEND_URL in Render dashboard and redeploy");
  process.exit(1);
}

export const frontendOrigin = frontendUrl!;
