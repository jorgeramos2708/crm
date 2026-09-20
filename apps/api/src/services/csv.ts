// Utilidades CSV 100% propias (sin dependencias): parseo con comillas y generación con escape.

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^\uFEFF/, '');
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inQuotes) {
      if (c === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        record.push(field);
        field = '';
      } else if (c === '\n') {
        record.push(field);
        field = '';
        if (!(record.length === 1 && record[0] === '')) records.push(record);
        record = [];
      } else if (c === '\r') {
        // se ignora; el \n cierra la fila
      } else {
        field += c;
      }
    }
  }
  record.push(field);
  if (!(record.length === 1 && record[0] === '')) records.push(record);

  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map(h => h.trim());
  const rows = records.slice(1).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
    return obj;
  });
  return { headers, rows };
}

function escapeCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(escapeCell).join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => escapeCell(r[h])).join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}
