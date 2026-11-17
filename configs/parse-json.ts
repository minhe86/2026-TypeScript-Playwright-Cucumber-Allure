export function parseJsonConfig(contents: string, source: string): object {
  let config: unknown;
  try {
    config = JSON.parse(contents);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${source} must contain valid JSON`);
    }
    throw error;
  }
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new Error(`${source} must contain a JSON object`);
  }
  return config;
}
