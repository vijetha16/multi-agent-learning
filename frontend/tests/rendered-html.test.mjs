import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the Lumio landing experience", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Lumio/);
  assert.match(html, /One learning goal/);
  assert.match(html, /Build my lesson/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("renders the learning dashboard and roadmap", async () => {
  const response = await render("/dashboard");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Lumi is preparing your learning path/);
  assert.match(html, /lumi-guide\.png/);
});

test("renders account sign in and registration", async () => {
  const response = await render("/auth");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Welcome back/);
  assert.match(html, /Create account/);
  assert.match(html, /Every path begins with curiosity/);
});
