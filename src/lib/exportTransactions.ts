// Exportación de movimientos a CSV/Excel (función PRO). Traducciones resueltas
// directamente contra el singleton de i18n (mismo patrón que categoryLabel en
// categoryIcons.ts), para no tener que pasar funciones `t` por parámetro.
import Papa from 'papaparse'
import i18n from '@/i18n'
import { categoryLabel } from './categoryIcons'
import { sanitizeForSpreadsheet } from './exportSafe'
import type { Transaction, Category, TransactionType } from './database.types'

// Colores de marca (paleta de la app: teal=ingreso, rosa=gasto, gris=no
// computable — ver project_design_system). El Excel se colorea SOLO con estos,
// nunca con el color propio de cada categoría (eso queda para la UI).
const TEAL_HEX = '14B8A6'
const PINK_HEX = 'CB6391'
const GRAY_HEX = '64748B'
const BRAND_TEAL = `FF${TEAL_HEX}`
const BRAND_PINK = `FF${PINK_HEX}`
const BRAND_GRAY = `FF${GRAY_HEX}`

interface ResolvedTxFields {
  fecha: string
  concepto: string
  importe: number
  tipo: TransactionType | null
  tipoLabel: string
  categoriaLabel: string
  cuenta: string
}

function resolveTxFields(tx: Transaction, categories: Category[]): ResolvedTxFields {
  const cat = tx.category_id ? categories.find(c => c.id === tx.category_id) : undefined
  return {
    fecha: tx.date,
    concepto: tx.concept,
    importe: tx.amount,
    tipo: tx.transaction_type,
    tipoLabel: tx.transaction_type ? i18n.t(`transaction_type.${tx.transaction_type}`, { ns: 'common' }) : '',
    categoriaLabel: categoryLabel(cat?.slug),
    cuenta: tx.account?.name ?? '',
  }
}

function columnLabels() {
  return {
    date: i18n.t('columns.date', { ns: 'transactions' }),
    concept: i18n.t('columns.concept', { ns: 'transactions' }),
    amount: i18n.t('columns.amount', { ns: 'transactions' }),
    type: i18n.t('columns.type', { ns: 'transactions' }),
    category: i18n.t('columns.category', { ns: 'transactions' }),
    account: i18n.t('columns.account', { ns: 'transactions' }),
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Mezcla un color de marca con blanco, como color sólido real (el canal alpha
// de un fill de Excel no se renderiza como transparencia, a diferencia del
// tintado de las pastillas de categoría en la UI vía `${color}1f`).
function tintWithWhite(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount))
  const toHex = (c: number) => c.toString(16).padStart(2, '0').toUpperCase()
  return `FF${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

function amountColorArgb(tipo: TransactionType | null): string {
  if (tipo === 'ingreso') return BRAND_TEAL
  if (tipo === 'gasto') return BRAND_PINK
  return BRAND_GRAY
}

// Tinte muy suave de fila según el tipo, con los mismos 3 colores de marca que
// ya usa el importe — nunca el color de la categoría (eso creaba tonos ajenos
// a la marca, tipo verdes/morados sueltos, en vez de teal/rosa/gris).
function rowTintArgb(tipo: TransactionType | null): string {
  if (tipo === 'ingreso') return tintWithWhite(TEAL_HEX, 0.08)
  if (tipo === 'gasto') return tintWithWhite(PINK_HEX, 0.05)
  return tintWithWhite(GRAY_HEX, 0.06)
}

// Español → coma decimal (convención local). El separador de columnas del CSV
// se deja SIEMPRE en coma (estándar, y el que de hecho espera Excel al abrir
// por doble clic según el separador de listas de Windows) — PapaParse entrecomilla
// automáticamente cualquier campo que contenga una coma (el propio importe con
// decimal en coma, o un concepto con comas), así que no hay ambigüedad al parsear.
function isSpanishLocale(): boolean {
  return (i18n.language ?? 'es').toLowerCase().startsWith('es')
}

// Siempre 2 decimales (2150.8 → "2150,80", -300 → "-300,00"), para que todos
// los importes tengan el mismo formato al abrir el fichero. No se sanea con
// `sanitizeForSpreadsheet`: es un número validado en BD, no texto libre del
// usuario, y su signo "-" inicial no debe tratarse como riesgo de fórmula.
function formatAmountForExport(value: number, comma: boolean): string {
  const fixed = value.toFixed(2)
  return comma ? fixed.replace('.', ',') : fixed
}

/** CSV plano (sin estilo), columnas básicas. Antepone BOM UTF-8 para que
 *  acentos y € se vean bien al abrir directo en Excel/LibreOffice. */
export function exportToCSV(transactions: Transaction[], categories: Category[], filenameBase: string) {
  const cols = columnLabels()
  const comma = isSpanishLocale()
  const rows = transactions.map(tx => {
    const r = resolveTxFields(tx, categories)
    return {
      [cols.date]: sanitizeForSpreadsheet(r.fecha),
      [cols.concept]: sanitizeForSpreadsheet(r.concepto),
      [cols.amount]: formatAmountForExport(r.importe, comma),
      [cols.type]: sanitizeForSpreadsheet(r.tipoLabel),
      [cols.category]: sanitizeForSpreadsheet(r.categoriaLabel),
      [cols.account]: sanitizeForSpreadsheet(r.cuenta),
    }
  })
  const csv = '﻿' + Papa.unparse(rows)
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filenameBase}.csv`)
}

/** Excel con estética de marca: cabecera teal, importe y fila teñidos en
 *  teal/rosa/gris según el tipo de movimiento. Sin logos ni iconos incrustados
 *  como imagen (ver decisión en el plan). */
export async function exportToExcel(transactions: Transaction[], categories: Category[], filenameBase: string) {
  // Import dinámico: exceljs es una librería pesada, solo se descarga cuando
  // alguien realmente exporta a Excel (no en el bundle principal de la app).
  const { default: ExcelJS } = await import('exceljs')
  const cols = columnLabels()
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(i18n.t('title', { ns: 'transactions' }))

  // Solo anchos/keys aquí (sin `header`): la fila 1 la deja libre para el
  // banner de marca, las cabeceras de columna van en la fila 2.
  sheet.columns = [
    { key: 'fecha', width: 12 },
    { key: 'concepto', width: 34 },
    { key: 'importe', width: 14 },
    { key: 'tipo', width: 14 },
    { key: 'categoria', width: 24 },
    { key: 'cuenta', width: 24 },
  ]

  // Fila 1: banner de marca (wordmark "zafyros" en minúscula, sin logo
  // incrustado — decisión del plan), celdas combinadas a todo el ancho.
  sheet.mergeCells('A1:F1')
  const brandCell = sheet.getCell('A1')
  brandCell.value = 'zafyros'
  brandCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  brandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } }
  brandCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(1).height = 26

  // Fila 2: cabeceras de columna.
  const headerRow = sheet.addRow({
    fecha: cols.date, concepto: cols.concept, importe: cols.amount,
    tipo: cols.type, categoria: cols.category, cuenta: cols.account,
  })
  headerRow.height = 22
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } }
    cell.alignment = { vertical: 'middle' }
  })

  for (const tx of transactions) {
    const r = resolveTxFields(tx, categories)
    const row = sheet.addRow({
      fecha: new Date(`${r.fecha}T00:00:00`),
      concepto: sanitizeForSpreadsheet(r.concepto),
      importe: r.importe,
      tipo: sanitizeForSpreadsheet(r.tipoLabel),
      categoria: sanitizeForSpreadsheet(r.categoriaLabel),
      cuenta: sanitizeForSpreadsheet(r.cuenta),
    })
    const tint = rowTintArgb(r.tipo)
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint } }
    })
    row.getCell('fecha').numFmt = 'dd/mm/yyyy'
    const amountCell = row.getCell('importe')
    amountCell.numFmt = '#,##0.00 €'
    amountCell.font = { color: { argb: amountColorArgb(r.tipo) }, bold: true }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${filenameBase}.xlsx`,
  )
}
