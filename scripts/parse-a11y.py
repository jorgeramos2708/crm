import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else 'a11y-run.txt'
txt = open(path, encoding='utf-8', errors='replace').read()
ids = set(re.findall(r'"id": "([a-z-]+)"', txt))
print('RULES:', sorted(ids))
seen = set()
for m in re.finditer(r'"html": "(<(?:td|span|p|a|button|div|h\d|th)[^"]{0,220})', txt):
    key = m.group(1)[:170]
    if key not in seen:
        seen.add(key)
        print('NODE:', key)
    if len(seen) >= 14:
        break
