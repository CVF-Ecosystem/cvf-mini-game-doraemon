import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const TARGET_URL = process.env.TARGET_URL ?? "http://localhost:3020";
const RUNS = Number(process.env.PERF_RUNS ?? 3);

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function singleRun(browser, runIndex) {
  const context = await browser.newContext({
    ...devices["iPhone 12"],
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__cvfPerf = { lcp: 0 };
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const latest = entries[entries.length - 1];
      if (latest && typeof latest.startTime === "number") {
        window.__cvfPerf.lcp = latest.startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const t0 = Date.now();
  await page.goto(TARGET_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const lcp = await page.evaluate(() => window.__cvfPerf?.lcp ?? 0);
  const fps = await page.evaluate(async () => {
    const durationMs = 5000;
    let frames = 0;
    const start = performance.now();

    await new Promise((resolve) => {
      const tick = (now) => {
        frames += 1;
        if (now - start >= durationMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    return Number((frames / (durationMs / 1000)).toFixed(2));
  });

  const loadMs = Date.now() - t0;
  await context.close();

  return {
    run: runIndex + 1,
    lcpMs: Number(lcp.toFixed(2)),
    fps,
    loadMs,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const runs = [];
  try {
    for (let i = 0; i < RUNS; i += 1) {
      runs.push(await singleRun(browser, i));
    }
  } finally {
    await browser.close();
  }

  const lcpAvg = Number(average(runs.map((item) => item.lcpMs)).toFixed(2));
  const fpsAvg = Number(average(runs.map((item) => item.fps)).toFixed(2));
  const loadAvg = Number(average(runs.map((item) => item.loadMs)).toFixed(2));
  const lcpPass = lcpAvg < 2500;
  const fpsPass = fpsAvg >= 50;

  const summary = {
    url: TARGET_URL,
    runs,
    average: {
      lcpMs: lcpAvg,
      fps: fpsAvg,
      loadMs: loadAvg,
    },
    gate: {
      lcpPass,
      fpsPass,
      allPass: lcpPass && fpsPass,
    },
    environment: {
      device: "iPhone 12 emulation",
      cpuThrottleRate: 4,
      measuredAt: new Date().toISOString(),
    },
  };

  const outputPath = path.resolve(
    process.cwd(),
    "..",
    "PROJECT_ARCHIVE",
    "perf-benchmark-result.json",
  );
  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
