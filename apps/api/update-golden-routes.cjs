const fs = require('fs');

const src = fs.readFileSync('src/routes/index.ts', 'utf8');

function extractApiRoutes(src) {
  const re = /app\.(get|post|put|patch|delete)\(\s*\n?\s*["']([^"']+)["']/g;
  const routes = [];
  let m;
  while ((m = re.exec(src))) routes.push(`${m[1].toUpperCase()} ${m[2]}`);
  routes.sort();
  return routes;
}

const actual = extractApiRoutes(src);
const golden = JSON.parse(fs.readFileSync('contracts.golden.json', 'utf8'));
golden.routes = actual;
golden.routeCount = actual.length;
fs.writeFileSync('contracts.golden.json', JSON.stringify(golden, null, 2));
console.log('Updated golden routes:', actual.length);