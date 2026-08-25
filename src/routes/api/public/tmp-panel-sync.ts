import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY internal helper: triggers the panel sync using the server-side secret.
// Deleted immediately after use.
export const Route = createFileRoute("/api/public/tmp-panel-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ADMIN_SETUP_SECRET"] ?? "";
        const url = new URL("/api/public/discord-admin-setup", new URL(request.url).origin);
        const res = await fetch(url, {
          method: "POST",
          headers: { authorization: `Bearer ${secret}` },
        });
        const text = await res.text();
        return new Response(text, {
          status: res.status,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
