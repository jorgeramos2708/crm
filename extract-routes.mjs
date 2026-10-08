import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function extractApiRoutes(src) {
  const re = /app\.(get|post|put|patch|delete)\(\s*\n?\s*["']([^"']+)["']/g;
  const routes = [];
  let m;
  while ((m = re.exec(src))) routes.push(`${m[1].toUpperCase()} ${m[2]}`);
  routes.sort();
  return routes;
}

const src = readFileSync(resolve('apps/api/src/routes/index.ts'), 'utf-8');
const routes = extractApiRoutes(src);
console.log(JSON.stringify(routes, null, 2));
console.log('\nCount:', routes.length);