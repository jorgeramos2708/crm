const fs = require('fs');

const src = fs.readFileSync('src/db/schema.ts', 'utf8');

function extractSchema(src) {
  const tableRe = /export const (\w+) = pgTable\(\s*["']([^"']+)["']/g;
  const schema = {};
  let t;
  while ((t = tableRe.exec(src))) {
    const start = t.index;
    const next = src.indexOf('export const', start + 1);
    const block = src.slice(start, next === -1 ? undefined : next);
    const colRe = /(\w+):\s*(?:uuid|varchar|text|timestamp|boolean|integer|jsonb|numeric)/g;
    const columns = [];
    let c;
    while ((c = colRe.exec(block))) columns.push(c[1]);
    schema[t[2]] = { exportName: t[1], columns };
  }
  return schema;
}

const actual = extractSchema(src);
const golden = JSON.parse(fs.readFileSync('contracts.golden.json', 'utf8'));
golden.schema = actual;
fs.writeFileSync('contracts.golden.json', JSON.stringify(golden, null, 2));
console.log('Updated golden schema with', Object.keys(actual).length, 'tables');