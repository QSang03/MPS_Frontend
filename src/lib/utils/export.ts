import ExcelJS from 'exceljs'

export async function exportToExcel<T extends object>(
  data: T[],
  columns: { header: string; key: keyof T; width?: number }[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  if (!data || !data.length) return

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // ExcelJS expects column keys to be strings; ensure keys are stringified.
  worksheet.columns = columns.map((c) => ({
    header: c.header,
    key: String(c.key),
    width: c.width,
  })) as Partial<ExcelJS.Column>[]

  // Add rows
  worksheet.addRows(data)

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer()

  // Create blob and download
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function downloadCSV<T extends Record<string, unknown>>(data: T[], filename: string) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0] as object)

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (value instanceof Date) return value.toISOString()
    let str = String(value)
    // Wrap in quotes if contains comma, quote, newline
    if (/[,"\n]/.test(str)) {
      str = '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const rows: string[] = []
  rows.push(headers.join(','))
  for (const row of data) {
    const r = row as Record<string, unknown>
    rows.push(headers.map((h) => escapeCell(r[h])).join(','))
  }
  const csvContent = rows.join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
