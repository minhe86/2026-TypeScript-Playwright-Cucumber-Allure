import { strict as assert } from "node:assert";
import { test } from "node:test";
import { startLocalApiServer } from "./support/local-api-server.ts";

test("local API fixture provides predictable responses", async (t) => {
  const server = await startLocalApiServer();
  t.after(() => server.close());

  const post = (path: string, data: object) => fetch(`${server.baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  await t.test("login requires both fields and returns a test token", async () => {
    const invalid = await post("/api/login", { email: "user@example.test" });
    assert.equal(invalid.status, 400);
    const valid = await post("/api/login", { email: "user@example.test", password: "example" });
    assert.equal(valid.status, 200);
    assert.deepEqual(await valid.json(), { token: "local-test-token" });
  });

  await t.test("user endpoints accept both client shapes and expose fixed users", async () => {
    for (const data of [
      { name: "Example", email: "user@example.test" },
      { firstName: "Example", email: "user@example.test" },
    ]) {
      const created = await post("/api/users", data);
      assert.equal(created.status, 201);
      assert.deepEqual(await created.json(), { id: "created-user", name: "Example", email: "user@example.test" });
    }
    assert.equal((await post("/api/users", { email: "user@example.test" })).status, 400);
    for (const id of [4, 7]) {
      const retrieved = await fetch(`${server.baseUrl}/api/users/${id}`);
      assert.equal(retrieved.status, 200);
      assert.deepEqual(await retrieved.json(), {
        data: { id, first_name: "Michael", email: "michael.lawson@reqres.in" },
      });
    }
    assert.equal((await fetch(`${server.baseUrl}/api/users/999`)).status, 404);
  });

  await t.test("registration and malformed requests return expected statuses", async () => {
    for (const data of [{}, { email: "user@example.test" }, { password: "example" }]) {
      assert.equal((await post("/api/register", data)).status, 400);
    }
    assert.equal((await post("/api/register", { email: "user@example.test", password: "example" })).status, 200);
    const malformed = await fetch(`${server.baseUrl}/api/register`, { method: "POST", body: "{" });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: "Invalid JSON" });
  });
});
