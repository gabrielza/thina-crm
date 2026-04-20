import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.2,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
