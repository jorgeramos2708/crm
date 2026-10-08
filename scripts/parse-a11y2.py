import re

txt = open('apps/web/a11y-run.txt', encoding='utf-8', errors='replace').read()
# Top-level violation rule ids (indented exactly 4 spaces + "id")
rules = set(re.findall(r'^    \+     "id": "([a-z-]+)"', txt, re.M))
print('TOP RULES:', sorted(rules))
# Full node html values (may span lines due to wrapping; join continuations)
chunks = re.findall(r'"html": "((?:[^"\\]|\\.)*)"', txt)
seen = set()
for c in chunks:
    c = c.encode().decode('unicode_escape', errors='replace')[:220]
    if c not in seen:
        seen.add(c)
        print('NODE:', c)
    if len(seen) >= 16:
        break
