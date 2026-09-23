import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..", "..");

function readApi(rel: string): string {
  return readFileSync(resolve(root, "apps/api", rel), "utf-8");
}

function readWeb(rel: string): string {
  return readFileSync(resolve(root, "apps/web", rel), "utf-8");
}

function extractApiRoutes(src: string): string[] {
  const re = /app\.(get|post|put|patch|delete)\(\s*\n?\s*["']([^"']+)["']/g;
  const routes: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) routes.push(`${m[1].toUpperCase()} ${m[2]}`);
  routes.sort();
  return routes;
}

function extractSchema(
  src: string,
): Record<string, { exportName: string; columns: string[] }> {
  const tableRe = /export const (\w+) = pgTable\(\s*["']([^"']+)["']/g;
  const schema: Record<string, { exportName: string; columns: string[] }> = {};
  let t: RegExpExecArray | null;
  while ((t = tableRe.exec(src))) {
    const start = t.index;
    const next = src.indexOf("export const", start + 1);
    const block = src.slice(start, next === -1 ? undefined : next);
    const colRe =
      /(\w+):\s*(?:uuid|varchar|text|timestamp|boolean|integer|jsonb)/g;
    const columns: string[] = [];
    let c: RegExpExecArray | null;
    while ((c = colRe.exec(block))) columns.push(c[1]);
    schema[t[2]] = { exportName: t[1], columns };
  }
  return schema;
}

function extractVueRoutes(src: string): string[] {
  const pathRe = /path:\s*['"]([^'"]+)['"]/g;
  const paths: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(src))) paths.push(m[1]);
  return paths;
}

function extractNav(src: string): string[] {
  const navRe = /to:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]/g;
  const nav: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = navRe.exec(src))) nav.push(`${m[1]}|${m[2]}`);
  return nav;
}

function extractCols(viewSrc: string): string[] | null {
  const cm = viewSrc.match(/:cols="\[([^\]]+)\]"/);
  if (!cm) return null;
  return cm[1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
}

const apiGolden = JSON.parse(readApi("contracts.golden.json"));
const webGolden = JSON.parse(readWeb("contracts.golden.json"));

describe("Blindado API — contratos congelados (contracts.golden.json)", () => {
  it("lista de rutas HTTP idéntica al golden (añadir/quitar ruta ⇒ actualizar golden a propósito)", () => {
    const actual = extractApiRoutes(readApi("src/routes/index.ts"));
    expect(actual).toEqual(apiGolden.routes);
    expect(actual.length).toBe(apiGolden.routeCount);
  });

  it("schema drizzle idéntico al golden (tablas y columnas)", () => {
    const actual = extractSchema(readApi("src/db/schema.ts"));
    expect(actual).toEqual(apiGolden.schema);
  });

  it("rutas de tracking públicas presentes (Fase 0)", () => {
    for (const r of [
      "GET /api/track/open/:trackingId",
      "GET /api/track/click/:trackingId",
      "GET /api/track/unsubscribe/:trackingId",
      "GET /api/email-tracking",
      "GET /api/email-tracking/stats/:campaignId",
      "POST /api/email-campaigns/:id/send",
    ]) {
      expect(apiGolden.routes).toContain(r);
    }
  });

  it("nodemailer está en dependencies (Fase 0 envío SMTP)", () => {
    const pkg = JSON.parse(readApi("package.json"));
    expect(pkg.dependencies.nodemailer).toBeTruthy();
  });
});

describe("Blindado Web — contratos congelados (contracts.golden.json)", () => {
  it("rutas Vue idénticas al golden", () => {
    const actual = extractVueRoutes(readWeb("src/main.js"));
    expect(actual).toEqual(webGolden.vueRoutes);
  });

  it("items de navegación idénticos al golden", () => {
    const actual = extractNav(readWeb("src/App.vue"));
    expect(actual).toEqual(webGolden.nav);
  });

  it("anchos exactos de columnas Tabla (NO CAMBIAR sin actualizar golden)", () => {
    for (const [view, expected] of Object.entries(webGolden.colsExact)) {
      const src = readWeb(`src/views/${view}.vue`);
      expect(extractCols(src), view).toEqual(expected);
    }
    expect(webGolden.colsExact.Negocios).toEqual([
      "30%",
      "20%",
      "15%",
      "15%",
      "10%",
      "10%",
    ]);
    expect(webGolden.colsExact.Contactos).toEqual([
      "18%",
      "18%",
      "13%",
      "18%",
      "15%",
      "18%",
    ]);
    expect(webGolden.colsExact.Productos).toEqual([
      "35%",
      "20%",
      "15%",
      "15%",
      "15%",
    ]);
  });

  it("servicios de docker-compose congelados", () => {
    const compose = readFileSync(resolve(root, "docker-compose.yml"), "utf-8");
    for (const svc of ["postgres", "redis", "minio", "api", "worker", "web"]) {
      expect(compose).toMatch(new RegExp(`^  ${svc}:`, "m"));
    }
  });

  it("index.html tiene CSP y viewport (base PWA)", () => {
    const html = readWeb("index.html");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain('name="viewport"');
    expect(html).toContain('lang="es"');
  });
});
