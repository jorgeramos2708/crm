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

console.log('Actual routes:', actual.length);
console.log('Golden routes:', golden.routes.length);

// Find routes in actual but not in golden
const inActualNotGolden = actual.filter(r => !golden.routes.includes(r));
console.log('In actual but not golden:', inActualNotGolden);

// Find routes in golden but not in actual
const inGoldenNotActual = golden.routes.filter(r => !actual.includes(r));
console.log('In golden but not actual:', inGoldenNotActual);