"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", padding: 16 }}>
            <AlertTriangle style={{ height: 32, width: 32, color: "#ef4444" }} />
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
            <p style={{ color: "#6b7280", maxWidth: 400 }}>
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>Error ID: {error.digest}</p>
            )}
            <Button onClick={reset}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  );
}
