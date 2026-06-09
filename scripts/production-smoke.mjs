const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

async function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON, received: ${text.slice(0, 160)}`);
  }
}

const page = await fetch(baseUrl);
await assertOk(page.ok, `GET / failed with ${page.status}`);
const html = await page.text();
await assertOk(html.includes("ghost.reviews"), "landing page does not include the brand text");

const scan = await fetch(`${baseUrl}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "ghostcase power snap" }),
});
await assertOk(scan.ok, `POST /api/scan failed with ${scan.status}`);
const result = await readJson(scan);
await assertOk(result.demoMode === true, "scan result must be in demo mode");
await assertOk(result.product?.name === "GhostCase Power Snap", "scan result returned the wrong product");
await assertOk(Number.isInteger(result.ghostScore), "scan result missing integer ghostScore");
await assertOk(Array.isArray(result.hauntings) && result.hauntings.length > 0, "scan result missing hauntings");

const card = await fetch(
  `${baseUrl}/api/share-card?product=GhostCase%20Power%20Snap&score=${result.ghostScore}&tier=${result.verdict.tier}`,
);
await assertOk(card.ok, `GET /api/share-card failed with ${card.status}`);
await assertOk(card.headers.get("content-type")?.includes("image/png"), "share card must return image/png");
const bytes = await card.arrayBuffer();
await assertOk(bytes.byteLength > 10000, "share card image is unexpectedly small");

console.log(`production smoke ok: ${baseUrl}`);
