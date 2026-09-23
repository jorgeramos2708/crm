import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

function extractApiRoutes(src) {
  const re = /app\.(get|post|put|patch|delete)\(\s*\n?\s*["']([^"']+)["']/g;
  const routes = [];
  let m;
  while ((m = re.exec(src))) routes.push(`${m[1].toUpperCase()} ${m[2]}`);
  routes.sort();
  return routes;
}

function extractSchema(src) {
  const tableRe = /export const (\w+) = pgTable\(\s*["']([^"']+)["']/g;
  const schema = {};
  let t;
  while ((t = tableRe.exec(src))) {
    const start = t.index;
    const next = src.indexOf("export const", start + 1);
    const block = src.slice(start, next === -1 ? undefined : next);
    const colRe = /(\w+):\s*(?:uuid|varchar|text|timestamp|boolean|integer|jsonb)/g;
    const columns = [];
    let c;
    while ((c = colRe.exec(block))) columns.push(c[1]);
    schema[t[2]] = { exportName: t[1], columns };
  }
  return schema;
}

function extractVueRoutes(src) {
  const pathRe = /path:\s*['"]([^'"]+)['"]/g;
  const paths = [];
  let m;
  while ((m = pathRe.exec(src))) paths.push(m[1]);
  return paths;
}

function extractNav(src) {
  const navRe = /to:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]/g;
  const nav = [];
  let m;
  while ((m = navRe.exec(src))) nav.push(`${m[1]}|${m[2]}`);
  return nav;
}

function extractCols(viewSrc) {
  const cm = viewSrc.match(/:cols="\[([^\]]+)\]"/);
  if (!cm) return null;
  return cm[1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
}

const routesSrc = readFileSync(resolve(root, "apps/api/src/routes/index.ts"), "utf8");
const schemaSrc = readFileSync(resolve(root, "apps/api/src/db/schema.ts"), "utf8");
const mainSrc = readFileSync(resolve(root, "apps/web/src/main.js"), "utf8");
const appSrc = readFileSync(resolve(root, "apps/web/src/App.vue"), "utf8");

const apiGolden = {
  routes: extractApiRoutes(routesSrc),
  routeCount: 0,
  schema: extractSchema(schemaSrc),
};
apiGolden.routeCount = apiGolden.routes.length;

const webGolden = {
  vueRoutes: extractVueRoutes(mainSrc),
  nav: extractNav(appSrc),
  colsExact: {},
};
for (const view of ["Negocios", "Contactos", "Productos"]) {
  const v = readFileSync(resolve(root, `apps/web/src/views/${view}.vue`), "utf8");
  const cols = extractCols(v);
  if (cols) webGolden.colsExact[view] = cols;
}

writeFileSync(resolve(root, "apps/api/contracts.golden.json"), JSON.stringify(apiGolden, null, 2) + "\n");
writeFileSync(resolve(root, "apps/web/contracts.golden.json"), JSON.stringify(webGolden, null, 2) + "\n");
console.log(
  `API: ${apiGolden.routeCount} routes, ${Object.keys(apiGolden.schema).length} tables | WEB: ${webGolden.vueRoutes.length} routes, ${webGolden.nav.length} nav`,
);
