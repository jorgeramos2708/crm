const fs = require('fs');
const path = require('path');

const webGoldenPath = path.join(__dirname, '..', 'web', 'contracts.golden.json');
const apiGolden = JSON.parse(fs.readFileSync('contracts.golden.json', 'utf8'));

// We need to update the web golden routes
const src = fs.readFileSync(path.join(__dirname, '..', 'web', 'src', 'main.js'), 'utf8');

function extractApiRoutes(src) {
  // Extract routes from Vue Router routes array
  const routes = [];
  
  // Match route objects: { path: "/path", component: Component, meta: {...} }
  const routeRegex = /\{\s*path:\s*["']([^"']+)["']/g;
  let m;
  while ((m = routeRegex.exec(src))) {
    routes.push(`GET ${m[1]}`);
  }
  
  routes.sort();
  return routes;
}

const actual = extractApiRoutes(src);
apiGolden.routes = actual;
apiGolden.routeCount = actual.length;

fs.writeFileSync(path.join(__dirname, '..', 'web', 'contracts.golden.json'), JSON.stringify(apiGolden, null, 2));
console.log('Updated web golden routes:', actual.length);