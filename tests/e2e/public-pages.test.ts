import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.E2E_PORT ?? 4317);
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
let server: ChildProcessWithoutNullStreams | undefined;
let serverOutput = "";

async function canReach(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    await response.text();
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        await response.text();
        return;
      }
    } catch {
      await delay(500);
    }
  }

  throw new Error(`Next dev server did not start in time.\n${serverOutput}`);
}

async function fetchPage(pathname: string) {
  const response = await fetch(`${baseUrl}${pathname}`, { signal: AbortSignal.timeout(10_000) });
  const html = await response.text();

  return { html, response };
}

describe("public pages e2e", () => {
  before(async () => {
    if (!process.env.E2E_BASE_URL && (await canReach("http://127.0.0.1:3000"))) {
      baseUrl = "http://127.0.0.1:3000";
      return;
    }

    server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        PORT: String(port),
      },
    });

    server.stdout.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });
    server.stderr.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });

    await waitForServer();
  });

  after(() => {
    server?.kill();
  });

  test("sert la page d'accueil avec la marque et les appels a l'action", async () => {
    const { html, response } = await fetchPage("/");

    assert.equal(response.status, 200);
    assert.match(html, /KVN Footwear/);
    assert.match(html, /Shop now/);
  });

  test("sert le catalogue public", async () => {
    const { html, response } = await fetchPage("/catalogue");

    assert.equal(response.status, 200);
    assert.match(html, /Find your kit/);
    assert.match(html, /Chargement des produits/);
  });

  test("sert la page contact avec les liens WhatsApp et Instagram", async () => {
    const { html, response } = await fetchPage("/contact");

    assert.equal(response.status, 200);
    assert.match(html, /Commande rapide sur WhatsApp/);
    assert.match(html, /https:\/\/wa.me\/212617311976/);
    assert.match(html, /https:\/\/www.instagram.com\/kvn_wearfoots/);
  });

  test("sert une page produit dynamique avec l'etat de chargement client", async () => {
    const { html, response } = await fetchPage("/produit/pack-real-madrid-home");

    assert.equal(response.status, 200);
    assert.match(html, /Chargement du produit/);
  });
});
