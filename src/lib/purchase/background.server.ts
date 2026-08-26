// Keeps post-ACK work alive after the handler has already answered Discord.
// Discord closes an interaction that is not acknowledged within 3 seconds, so
// slow work (channel creation, DB writes, key delivery) must run after the ACK.

export function runAfterResponse(work: () => Promise<void>): void {
  const promise = work().catch((error) => {
    console.error("background_task_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
  });
  void keepAlive(promise);
}

async function keepAlive(promise: Promise<void>): Promise<void> {
  try {
    // Cloudflare Workers terminate the isolate once the response is returned
    // unless the pending promise is registered with waitUntil.
    const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as {
      waitUntil?: (p: Promise<unknown>) => void;
    };
    if (typeof mod.waitUntil === "function") {
      mod.waitUntil(promise);
      return;
    }
  } catch {
    /* Not running on Workers (local dev): the promise resolves on its own. */
  }
  await promise;
}
