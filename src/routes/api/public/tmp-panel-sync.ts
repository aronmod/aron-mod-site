import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tmp-panel-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ADMIN_SETUP_SECRET"];
        if (!secret) return new Response("missing_secret", { status: 500 });
        const url = new URL("/api/public/discord-admin-setup", request.url);
        const response = await fetch(url, {
          method: "POST",
          headers: { authorization: `Bearer ${secret}` },
        });
        return new Response(await response.text(), {
          status: response.status,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
