import * as XLSX from 'xlsx'

export async function parseXLSXFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  const sheetName = workbook.SheetNames[0] // You can loop through if multiple
  const worksheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  return json // array of row objects
}
