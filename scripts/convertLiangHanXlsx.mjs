import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUTS = [
  { file: '../public/data/lianghan/western_han_points.xlsx', out: '../src/assets/data/liangHan/westernHanPoints.json' },
  { file: '../public/data/lianghan/eastern_han_points.xlsx', out: '../src/assets/data/liangHan/easternHanPoints.json' }
]

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/\./g, '_')
}

function convertOne({ file, out }) {
  const absFile = path.resolve(__dirname, file)
  const absOut = path.resolve(__dirname, out)
  const workbook = XLSX.readFile(absFile)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const [rawHeaders, ...dataRows] = rows
  if (!rawHeaders) throw new Error(`No header row in ${file}`)
  const headers = rawHeaders.map((header) => normalizeKey(header))
  const result = dataRows
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row) => {
      const entry = {}
      headers.forEach((header, idx) => {
        entry[header] = row[idx] ?? ''
      })
      return entry
    })
  fs.mkdirSync(path.dirname(absOut), { recursive: true })
  fs.writeFileSync(absOut, JSON.stringify({ headers, records: result }, null, 2), 'utf-8')
  console.log(`Converted ${path.basename(file)} -> ${path.relative(process.cwd(), absOut)} (${result.length} rows)\nHeaders:`, headers)
}

for (const item of INPUTS) {
  convertOne(item)
}
