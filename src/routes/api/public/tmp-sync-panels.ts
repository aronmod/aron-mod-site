import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tmp-sync-panels")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["ADMIN_SETUP_SECRET"] ?? "";
        const url = new URL(request.url);
        const res = await fetch(`${url.origin}/api/public/discord-admin-setup`, {
          method: "POST",
          headers: { authorization: `Bearer ${secret}` },
        });
        return new Response(await res.text(), {
          status: res.status,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
