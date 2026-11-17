import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

function send(response: ServerResponse, status: number, body: object) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function handleRequest(request: IncomingMessage, response: ServerResponse) {
  if (request.method === "GET" && (request.url === "/api/users/4" || request.url === "/api/users/7")) {
    send(response, 200, {
      data: {
        id: Number(request.url.split("/").at(-1)),
        first_name: "Michael",
        email: "michael.lawson@reqres.in",
      },
    });
    return;
  }

  if (
    request.method !== "POST" ||
    !["/api/login", "/api/users", "/api/register"].includes(request.url ?? "")
  ) {
    request.resume();
    send(response, 404, { error: "Not found" });
    return;
  }

  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk: string) => { body += chunk; });
  request.on("error", (error) => {
    console.error("Local API request failed:", error);
    response.destroy(error);
  });
  request.on("end", () => {
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      send(response, 400, { error: "Invalid JSON" });
      return;
    }

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      send(response, 400, { error: "Expected a JSON object" });
      return;
    }

    const email = Reflect.get(data, "email");
    const password = Reflect.get(data, "password");
    if (request.url === "/api/login" || request.url === "/api/register") {
      if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
        send(response, 400, { error: "Email and password are required" });
        return;
      }
      send(response, 200, { token: "local-test-token" });
      return;
    }

    const name = Reflect.get(data, "name") ?? Reflect.get(data, "firstName");
    if (typeof name !== "string" || !name || typeof email !== "string" || !email) {
      send(response, 400, { error: "Name and email are required" });
      return;
    }
    send(response, 201, { id: "created-user", name, email });
  });
}

export async function startLocalApiServer() {
  const server = createServer(handleRequest);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Local API server did not bind to a TCP port");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}
