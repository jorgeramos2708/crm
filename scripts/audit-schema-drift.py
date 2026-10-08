import re
import subprocess

SRC = 'apps/api/src/db/schema.ts'
txt = open(SRC, encoding='utf-8').read()

# Find pgTable blocks: export const NAME = pgTable("table", { ... }, ...)
tables = {}
for m in re.finditer(r'export const (\w+) = pgTable\(\s*"([^"]+)",\s*\{', txt):
    varname, tablename = m.group(1), m.group(2)
    # naive brace match from m.end()
    depth = 1
    i = m.end()
    start = i
    instr = None
    while i < len(txt) and depth > 0:
        ch = txt[i]
        if instr:
            if ch == instr and txt[i - 1] != '\\':
                instr = None
        elif ch in ('"', "'", '`'):
            instr = ch
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        i += 1
    body = txt[start:i - 1]
    cols = re.findall(r'(\w+):\s*(?:uuid|varchar|text|timestamp|boolean|integer|jsonb|numeric|date|time|real|bigint|serial)\("([^"]+)"', body)
    tables[tablename] = sorted(set(c for _, c in cols))

# DB columns
q = ("SELECT table_name, string_agg(column_name, ',' ORDER BY ordinal_position) "
     "FROM information_schema.columns WHERE table_schema='public' "
     "GROUP BY table_name;")
r = subprocess.run(
    ['docker', 'exec', 'crm-postgres', 'psql', '-U', 'crm', '-d', 'crm', '-t', '-A', '-F', '|', '-c', q],
    capture_output=True, text=True)
dbcols = {}
for line in r.stdout.strip().split('\n'):
    if '|' in line:
        t, c = line.split('|', 1)
        dbcols[t.strip()] = set(x.strip() for x in c.split(',') if x.strip())

out = []
for t in sorted(set(list(tables.keys()) + list(dbcols.keys()))):
    s = set(tables.get(t, []))
    d = dbcols.get(t, set())
    if t not in dbcols:
        out.append(f'MISSING TABLE IN DB: {t}')
        continue
    if t not in tables:
        continue
    missing_in_db = sorted(s - d)
    extra_in_db = sorted(d - s)
    if missing_in_db:
        out.append(f'BREAKING {t}: schema cols missing in DB: {missing_in_db}')
    if extra_in_db:
        out.append(f'info {t}: extra cols in DB (harmless): {extra_in_db}')

print('\n'.join(out) if out else 'NO DRIFT')
print(f'checked {len(tables)} schema tables')
