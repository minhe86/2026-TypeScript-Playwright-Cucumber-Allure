import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { test } from "node:test";

interface Response {
  id?: number;
  result?: unknown;
  error?: { message: string };
}

test("the configured agent server discovers the Chrome seed", { timeout: 30_000 }, async () => {
  const config: { servers: { "playwright-test": { command: string; args: string[] } } } =
    JSON.parse(await readFile(".vscode/mcp.json", "utf8"));
  const server = config.servers["playwright-test"];
  const child = spawn(server.command, server.args, { stdio: ["pipe", "pipe", "pipe"] });
  let stderr = "";
  let processError: Error | undefined;
  child.on("error", (error) => { processError = error; });
  child.stdin.on("error", (error) => { processError = error; });
  child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
  const closed = new Promise<void>((resolve) => child.once("close", () => resolve()));
  const lines = createInterface({ input: child.stdout });
  const responses = lines[Symbol.asyncIterator]();
  let nextId = 0;

  async function request(method: string, params: object): Promise<unknown> {
    const id = ++nextId;
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const line = await Promise.race([
        responses.next(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Agent server timed out during ${method}: ${stderr}`)), 10_000);
        }),
      ]).finally(() => clearTimeout(timer));
      if (line.done) {
        throw new Error(`Agent server closed before responding: ${processError?.message ?? stderr}`);
      }
      const response: Response = JSON.parse(line.value);
      if (response.id !== id) continue;
      if (response.error) throw new Error(`Agent server: ${response.error.message}`);
      return response.result;
    }
  }

  try {
    await request("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "agent-smoke-test", version: "1" },
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

    const tools = await request("tools/list", {}) as { tools: { name: string }[] };
    assert.ok(tools.tools.some((tool) => tool.name === "planner_setup_page"));

    const list = await request("tools/call", { name: "test_list", arguments: {} }) as {
      isError?: boolean;
      content: { text?: string }[];
    };
    assert.notEqual(list.isError, true, JSON.stringify(list));
    const output = list.content.map((item) => item.text ?? "").join("\n");
    assert.match(output, /seed\.spec\.ts/);
    assert.match(output, /Google Chrome/);
    assert.doesNotMatch(output, /firefox|Mobile Chrome|Mobile Safari/);
  } finally {
    child.stdin.end();
    const timer = setTimeout(() => child.kill(), 5_000);
    try {
      await closed;
    } finally {
      clearTimeout(timer);
      lines.close();
    }
  }
});
