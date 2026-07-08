import * as XLSX from 'xlsx'
import type { ParsedFile } from './csv'
import { detectHeaderRowIndex } from './headerDetect'

// ── HTML-as-XLS detection ─────────────────────────────────────────────────────
// Many Spanish banks (Openbank, Santander, BBVA…) export "XLS" files that are
// really XHTML documents. We detect this by peeking at the first bytes.

async function isHTMLFile(file: File): Promise<boolean> {
  // Read as Latin-1 so the detection works regardless of encoding
  const buf = await file.slice(0, 512).arrayBuffer()
  const sample = new TextDecoder('latin1').decode(buf).trimStart().toLowerCase()
  return sample.startsWith('<!doctype html') || sample.startsWith('<html')
}

/**
 * Sniff the charset declared inside the HTML <meta> tag.
 * Falls back to 'windows-1252' (covers iso-8859-1 + extra chars) if not found.
 * Most Spanish bank exports declare iso-8859-1 or windows-1252.
 */
async function detectHTMLCharset(file: File): Promise<string> {
  // Read a generous window: the real <meta charset> can sit *after* a large
  // inline <style> block (Office/Excel exports), well past the first KB.
  const buf = await file.slice(0, 16384).arrayBuffer()
  // Read as Latin-1 so the meta tag itself is always readable
  const snippet = new TextDecoder('latin1').decode(buf)
  // Only trust a charset declared with '=' (inside <meta> or a content attr).
  // Requiring '=' avoids false matches like CSS `mso-font-charset:0` that
  // Office-generated HTML injects, which would yield the invalid label "0".
  const m =
    snippet.match(/<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i) ??
    snippet.match(/charset\s*=\s*["']?\s*([\w-]+)/i)
  if (m) {
    const cs = m[1].toLowerCase().trim()
    // 'utf-8' → keep as-is; everything else we let TextDecoder normalise
    return cs
  }
  return 'windows-1252' // safe fallback for Spanish banks
}

// Build a TextDecoder, falling back to windows-1252 if the declared label is
// unsupported (e.g. a malformed/unknown charset) so import never hard-crashes.
function decodeBuffer(buffer: ArrayBuffer, charset: string): string {
  try {
    return new TextDecoder(charset).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

// ── HTML table parser ─────────────────────────────────────────────────────────

async function parseHTMLTable(file: File, manualSkipRows?: number): Promise<ParsedFile> {
  // Detect encoding first, then decode the whole file with it
  const charset = await detectHTMLCharset(file)
  const buffer  = await file.arrayBuffer()
  const html    = decodeBuffer(buffer, charset)
  const doc     = new DOMParser().parseFromString(html, 'text/html')

  // Pick the table with the most rows
  const tables = Array.from(doc.querySelectorAll('table'))
  if (tables.length === 0) throw new Error('no_rows')

  const mainTable = tables.reduce(
    (best, t) => (t.rows.length > best.rows.length ? t : best),
    tables[0],
  )

  const allRows: string[][] = Array.from(mainTable.rows).map(row =>
    Array.from(row.cells).map(cell => (cell.textContent ?? '').trim()),
  )

  // Drop fully-empty rows BEFORE detecting/slicing the header. Banks pad the
  // metadata block with empty spacer rows; detecting on the unfiltered array
  // but slicing the filtered one would misalign the header by that many rows.
  const nonEmptyRows = allRows.filter(r => r.some(c => c !== ''))

  // Use caller's explicit skip value, or auto-detect (relative to nonEmptyRows)
  const skipRows = manualSkipRows !== undefined && manualSkipRows > 0
    ? manualSkipRows
    : detectHeaderRowIndex(nonEmptyRows)

  const dataRows = nonEmptyRows.slice(skipRows)
  if (dataRows.length === 0) throw new Error('no_rows')

  const { headers, rows } = buildRows(dataRows)
  return { headers, rows, rawRows: allRows, detectedSkipRows: skipRows }
}

// Construye cabeceras + filas a partir de las filas crudas (primera = cabecera),
// descartando columnas SIN cabecera (celdas separadoras de exportaciones HTML)
// y deduplicando nombres repetidos. Evita claves vacías/duplicadas que rompen el
// render y colisiones al indexar las filas por nombre de columna.
function buildRows(dataRows: string[][]): { headers: string[]; rows: Record<string, string>[] } {
  const rawHeaders = (dataRows[0] ?? []).map(h => String(h ?? '').trim())
  const cols: { name: string; i: number }[] = []
  const seen = new Map<string, number>()
  rawHeaders.forEach((h, i) => {
    if (h === '') return
    const n = seen.get(h) ?? 0
    seen.set(h, n + 1)
    cols.push({ name: n ? `${h} (${n + 1})` : h, i })
  })
  const headers = cols.map(c => c.name)
  const rows = dataRows.slice(1).map(row => {
    const obj: Record<string, string> = {}
    for (const c of cols) obj[c.name] = String(row[c.i] ?? '').trim()
    return obj
  })
  return { headers, rows }
}

// ── Real XLSX/XLS (binary) parser ─────────────────────────────────────────────

function parseBinaryXLSX(file: File, skipRows = 0): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          raw: false,
          dateNF: 'YYYY-MM-DD',
          defval: '',
        }) as string[][]

        // Drop fully-empty rows first, then locate the real header row. Banks put a
        // document title / metadata block in the first cells; without this the title
        // cell in A1 would be taken as the (only) column header.
        const nonEmptyRows = rawRows.filter(r => r.some(c => c !== ''))
        const effectiveSkip = skipRows > 0 ? skipRows : detectHeaderRowIndex(nonEmptyRows)

        const dataRows = nonEmptyRows.slice(effectiveSkip)
        if (dataRows.length === 0) return reject(new Error('no_rows'))

        const { headers, rows } = buildRows(dataRows)
        resolve({ headers, rows, rawRows, detectedSkipRows: effectiveSkip })
      } catch {
        reject(new Error('parse_error'))
      }
    }
    reader.onerror = () => reject(new Error('parse_error'))
    reader.readAsArrayBuffer(file)
  })
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function parseXLSX(file: File, skipRows = 0): Promise<ParsedFile> {
  if (await isHTMLFile(file)) {
    // Pass skipRows only if the user explicitly set it (>0)
    return parseHTMLTable(file, skipRows > 0 ? skipRows : undefined)
  }
  return parseBinaryXLSX(file, skipRows)
}
