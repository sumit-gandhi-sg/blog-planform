// scripts/prewarm.mjs
// Pings all key routes to trigger Next.js on-demand compilation upfront in dev mode.

const routes = [
  "/",
  "/blogs",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/write",
  "/my-blogs",
  "/api/auth/me",
];

async function waitForServer(url, maxRetries = 40) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log(`\n⏳ Waiting for dev server at ${base}...`);

  const ready = await waitForServer(base);
  if (!ready) {
    console.log("⚠️ Dev server not reachable. Ensure 'npm run dev' is running first.");
    return;
  }

  console.log("⚡ Dev server ready! Pre-compiling routes in parallel so you never wait for compilation...\n");

  const start = Date.now();
  await Promise.allSettled(
    routes.map(async (route) => {
      const t0 = Date.now();
      try {
        const res = await fetch(`${base}${route}`);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  ✓ Pre-compiled ${route.padEnd(20)} [${res.status}] in ${elapsed}s`);
      } catch (err) {
        console.warn(`  ✗ Failed ${route}: ${err.message}`);
      }
    })
  );

  const total = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n🎉 All key routes pre-compiled in ${total}s! Navigating in browser will now be instant.\n`);
}

run();
