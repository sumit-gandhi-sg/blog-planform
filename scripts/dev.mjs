// scripts/dev.mjs
// Unified dev runner: cleans production build artifacts, starts Turbopack, and auto-prewarms routes.

import { spawn } from "child_process";
import fs from "fs";

// 1. Clean conflicting production build artifacts if switching from npm run build
if (fs.existsSync(".next/BUILD_ID")) {
  try {
    fs.rmSync(".next", { recursive: true, force: true });
    console.log("🧹 Cleaned leftover production build artifacts.");
  } catch (_) {}
}

// 2. Start Next.js Turbopack dev server
const nextProcess = spawn("npx", ["next", "dev", "--turbo"], {
  stdio: "inherit",
  shell: true,
});

// 3. Prewarm routes in background once server responds
const routes = ["/", "/blogs", "/sign-in", "/sign-up", "/write"];

async function autoPrewarm() {
  const base = "http://localhost:3000";

  // Wait for localhost:3000 to become responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch(base);
      if (res.status < 500) {
        ready = true;
        break;
      }
    } catch (_) {}
  }

  if (!ready) return;

  // Background ping all main pages
  console.log("\n⚡ Auto-prewarming routes in background...");
  await Promise.allSettled(
    routes.map(async (route) => {
      try {
        await fetch(`${base}${route}`);
        console.log(`   ✓ Pre-compiled ${route}`);
      } catch (_) {}
    })
  );
  console.log("🚀 All main routes are pre-compiled and ready in memory!\n");
}

autoPrewarm();

nextProcess.on("exit", (code) => {
  process.exit(code || 0);
});
