export const env = process.env.APP_ENV ?? "production";
export const isProd = env === "production";
export const isDev = env === "development";
export const port = parseInt(process.env.BACKEND_PORT!, 10);
