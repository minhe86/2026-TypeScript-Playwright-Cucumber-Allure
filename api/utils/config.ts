import { parseJsonConfig } from "../../configs/parse-json.ts";

export function parseApiConfig(contents: string): unknown {
  return parseJsonConfig(contents, "configs/config.api.json");
}

export function requireApiUrl(value: unknown, source: string): string {
  if (typeof value !== "string" || !URL.canParse(value)) {
    throw new Error(`${source} must be an absolute HTTP or HTTPS URL`);
  }
  const protocol = new URL(value).protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`${source} must be an absolute HTTP or HTTPS URL`);
  }
  return value;
}

export function requireApiCredentials(
  email: unknown,
  password: unknown,
  source = "in configs/config.api.json",
): { email: string; password: string } {
  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    throw new Error(`user.email and user.password must be non-empty strings ${source}`);
  }
  return { email, password };
}
