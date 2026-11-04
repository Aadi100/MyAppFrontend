import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

export type ImportEntry = { service_name: string; username?: string; password: string; notes?: string; backup_codes: string[] };
export type ParsedImport = { entries: ImportEntry[]; skipped: number; duplicates: number; missingColumns: string[] };

const ALIASES: Record<keyof ImportEntry, string[]> = {
  service_name: ['service', 'servicename', 'name', 'site', 'title', 'website', 'url', 'account'],
  username: ['username', 'user', 'email', 'login', 'userid', 'loginname'],
  password: ['password', 'pass', 'pwd', 'secret'],
  notes: ['notes', 'note', 'comment', 'comments', 'description'],
  backup_codes: ['backupcodes', 'backupcode', 'codes', 'recoverycodes', 'backup'],
};

const norm = (h: unknown) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// RFC-4180-style CSV: quoted fields, escaped quotes (""), commas/newlines inside quotes.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const splitCodes = (v: string) => Array.from(new Set(v.split(/[;|\n,]+/).map((c) => c.trim()).filter(Boolean)));

export function rowsToEntries(rows: string[][], existing: { service_name: string; username?: string | null }[] = []): ParsedImport {
  const header = (rows[0] || []).map(norm);
  const col = {} as Record<keyof ImportEntry, number>;
  (Object.keys(ALIASES) as (keyof ImportEntry)[]).forEach((k) => { col[k] = header.findIndex((h) => ALIASES[k].includes(h)); });
  const missingColumns = (['service_name', 'password'] as const).filter((k) => col[k] < 0);
  if (missingColumns.length) return { entries: [], skipped: 0, duplicates: 0, missingColumns: [...missingColumns] };

  const key = (s: string, u?: string | null) => `${s.trim().toLowerCase()}|${(u || '').trim().toLowerCase()}`;
  const seen = new Set(existing.map((e) => key(e.service_name, e.username)));
  const entries: ImportEntry[] = [];
  let skipped = 0, duplicates = 0;
  for (const r of rows.slice(1)) {
    const get = (k: keyof ImportEntry) => (col[k] >= 0 ? String(r[col[k]] ?? '').trim() : '');
    const service_name = get('service_name'), password = get('password');
    if (!service_name || !password) { skipped++; continue; }
    const username = get('username');
    const k = key(service_name, username);
    if (seen.has(k)) { duplicates++; continue; }
    seen.add(k);
    entries.push({ service_name, username: username || undefined, password, notes: get('notes') || undefined, backup_codes: splitCodes(get('backup_codes')) });
  }
  return { entries, skipped, duplicates, missingColumns: [] };
}

// The picker hands back a file:// path (or content:// URI). Expo Go's file-system module refuses to read
// picker copies ("Missing 'READ' permission") because they live outside its sandbox, but React Native's
// own fetch can read them. Try fetch first, then the File API, then the legacy API.
async function readUri(uri: string, as: 'text' | 'base64' | 'buffer'): Promise<any> {
  const errors: string[] = [];
  try {
    const res = await fetch(uri);
    return as === 'buffer' ? await res.arrayBuffer() : await res.text();
  } catch (e: any) { errors.push(`fetch: ${e?.message || e}`); }
  try {
    const f = new File(uri);
    if (as === 'buffer') return (await f.bytes()).buffer;
    return await f.text();
  } catch (e: any) { errors.push(`File: ${e?.message || e}`); }
  try {
    if (as === 'buffer') {
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
    }
    return await FileSystem.readAsStringAsync(uri);
  } catch (e: any) { errors.push(`legacy: ${e?.message || e}`); }
  throw new Error(errors.join(' | '));
}

// Lets the user pick a .csv / .xlsx / .xls file and returns its rows (header first), or null if cancelled.
export async function pickRows(): Promise<{ rows: string[][]; fileName: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const { uri, name } = res.assets[0];
  try {
    if (/\.xlsx?$/i.test(name || '')) {
      const wb = XLSX.read(new Uint8Array(await readUri(uri, 'buffer')), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, raw: false }) as unknown[][];
      return { rows: data.map((r) => r.map((c) => String(c ?? ''))), fileName: name };
    }
    return { rows: parseCsv(await readUri(uri, 'text')), fileName: name };
  } finally {
    // The file holds plaintext passwords — don't leave the cached copy lying around.
    try { new File(uri).delete(); } catch { /* already gone or not ours to delete */ }
  }
}
