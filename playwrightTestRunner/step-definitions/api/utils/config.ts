import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseApiConfig, requireApiUrl } from "../../../../api/utils/config.ts";

export function readApiConfig(): unknown {
  const contents = readFileSync(resolve("configs/config.api.json"), "utf8");
  return parseApiConfig(contents);
}

export function getApiBaseUrl(): string {
  const override = process.env.PLAYWRIGHT_API_BASE_URL;
  let value: unknown = override;
  let source = "PLAYWRIGHT_API_BASE_URL";
  if (override === undefined) {
    const config = readApiConfig();
    value = typeof config === "object" && config !== null && "apiBaseUrl" in config
      ? config.apiBaseUrl
      : undefined;
    source = "apiBaseUrl in configs/config.api.json";
  }

  return requireApiUrl(value, source);
}
