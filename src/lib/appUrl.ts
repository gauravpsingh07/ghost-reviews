const LOCAL_APP_URL = "http://localhost:3000";

function withHttps(hostname: string): string {
  return hostname.startsWith("http://") || hostname.startsWith("https://")
    ? hostname
    : `https://${hostname}`;
}

export function resolveAppUrl(source: NodeJS.ProcessEnv = process.env): string {
  if (source.NEXT_PUBLIC_APP_URL) return source.NEXT_PUBLIC_APP_URL;
  if (source.VERCEL_PROJECT_PRODUCTION_URL) {
    return withHttps(source.VERCEL_PROJECT_PRODUCTION_URL);
  }
  if (source.VERCEL_URL) return withHttps(source.VERCEL_URL);
  return LOCAL_APP_URL;
}
