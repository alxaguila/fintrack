import Papa from 'papaparse'
import { detectHeaderRowIndex } from './headerDetect'

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
  rawRows: string[][]
  /** Row index (0-based) where the real headers were found (used by HTML parser) */
  detectedSkipRows?: number
}

export async function parseCSV(file: File, delimiter = ',', skipRows = 0): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (result) => {
        const allRows = result.data as string[][]
        if (allRows.length === 0) return reject(new Error('empty_file'))

        // Locate the real header row (banks may prepend a title / metadata block).
        // Honour an explicit skipRows if the caller set one; otherwise auto-detect.
        const effectiveSkip = skipRows > 0 ? skipRows : detectHeaderRowIndex(allRows)

        const dataRows = allRows.slice(effectiveSkip)
        if (dataRows.length === 0) return reject(new Error('no_rows'))

        const headers = dataRows[0].map(h => h.trim())
        const rows = dataRows.slice(1).map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { obj[h] = (row[i] ?? '').trim() })
          return obj
        })

        resolve({ headers, rows, rawRows: dataRows, detectedSkipRows: effectiveSkip })
      },
      error: (err) => reject(new Error(err.message)),
      delimiter,
    })
  })
}

/** Intenta detectar el delimitador más probable */
export function detectDelimiter(sample: string): string {
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 }
  for (const char of Object.keys(counts) as Array<keyof typeof counts>) {
    counts[char] = (sample.match(new RegExp(`\\${char}`, 'g')) || []).length
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}
