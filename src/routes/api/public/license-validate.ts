import { createFileRoute } from "@tanstack/react-router";

/**
 * Legacy endpoint. Aron Mod is no longer a license authority: the loader
 * authenticates directly against KeyAuth. Kept only to answer old clients with a
 * stable, information-free 410.
 */
export const Route = createFileRoute("/api/public/license-validate")({
  server: {
    handlers: {
      POST: async () =>
        new Response(JSON.stringify({ result: "gone" }), {
          status: 410,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
      GET: async () =>
        new Response(JSON.stringify({ result: "gone" }), {
          status: 410,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
    },
  },
});
