import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Guardia permanente: Node ESM en prod (sin tsx) exige extensiones en los
// imports relativos. tsc con moduleResolution=bundler NO los detecta, y un
// import sin extensión tumba el boot en producción (ver leadScoring/audit).
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") walk(p, out);
    } else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) {
      out.push(p);
    }
  }
  return out;
}

describe("no-extensionless-imports (prod ESM)", () => {
  it("todos los imports relativos llevan extensión", () => {
    const re = /(?:from|import\()\s*['"](\.[^'"]+)['"]/g;
    const bad: string[] = [];
    for (const f of walk(join(__dirname))) {
      const lines = readFileSync(f, "utf8").split("\n");
      lines.forEach((line, i) => {
        let m: RegExpExecArray | null;
        while ((m = re.exec(line))) {
          if (!/\.(js|json|cjs|mjs|ts)$/.test(m[1])) {
            bad.push(`${f.split("src")[1]}:${i + 1} -> ${m[1]}`);
          }
        }
      });
    }
    expect(bad, "imports sin extensión (rompen node dist)").toEqual([]);
  });
});
