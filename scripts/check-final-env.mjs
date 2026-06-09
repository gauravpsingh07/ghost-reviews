import { readFileSync } from "node:fs";

const envExample = readFileSync(".env.example", "utf8");
const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));

function parseEnvTemplate(contents) {
  const entries = new Map();
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    entries.set(key, rest.join("="));
  }
  return entries;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const template = parseEnvTemplate(envExample);
const vercelEnv = vercelConfig.env ?? {};

assert(template.get("DEMO_MODE") === "true", ".env.example must default DEMO_MODE=true for the final demo.");
assert(vercelEnv.DEMO_MODE === "true", "vercel.json must lock DEMO_MODE=true.");
assert(template.get("LLM_PROVIDER") === "groq", ".env.example must default to the free Groq provider.");
assert(vercelEnv.LLM_PROVIDER === "groq", "vercel.json must default to the free Groq provider.");
assert(
  template.get("NIMBLE_BASE_URL") === "https://sdk.nimbleway.com/v1",
  ".env.example must point at the Nimble SDK API base URL.",
);
assert(
  vercelEnv.NIMBLE_BASE_URL === "https://sdk.nimbleway.com/v1",
  "vercel.json must point at the Nimble SDK API base URL.",
);

for (const [key, value] of template.entries()) {
  if (/_API_KEY$/.test(key)) {
    assert(value === "", `${key} must stay blank in .env.example.`);
  }
}

for (const key of Object.keys(vercelEnv)) {
  assert(!/_API_KEY$/.test(key), `${key} must not be committed to vercel.json.`);
}

console.log("final env config ok");
