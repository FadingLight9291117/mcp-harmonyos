/**
 * Simplified JSON5 parser: strips comments and trailing commas,
 * then delegates to JSON.parse.
 */
export function parseJson5(content: string): any {
  const cleaned = content
    .replace(/\/\*[\s\S]*?\*\//g, "")    // Remove /* */ comments
    .replace(/\/\/.*/g, "")              // Remove // comments
    .replace(/,(\s*[}\]])/g, "$1");      // Remove trailing commas

  return JSON.parse(cleaned);
}
