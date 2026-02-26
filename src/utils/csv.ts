export interface CsvParseResult {
  headers: string[]
  rows: Record<string, string>[]
}

const normalizeLineBreaks = (value: string): string => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

const escapeCsvValue = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

const splitCsvRows = (source: string): string[][] => {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const nextChar = source[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += char
  }

  currentRow.push(currentCell)
  rows.push(currentRow)
  return rows.filter((row) => row.some((cell) => cell.trim().length > 0))
}

export function parseCsv(source: string): CsvParseResult {
  const normalized = normalizeLineBreaks(source).trim()
  if (!normalized) {
    return {
      headers: [],
      rows: [],
    }
  }

  const parsedRows = splitCsvRows(normalized)
  if (parsedRows.length === 0) {
    return {
      headers: [],
      rows: [],
    }
  }

  const [rawHeaders, ...rawDataRows] = parsedRows
  const headers = rawHeaders.map((header) => header.trim())

  const rows = rawDataRows.map((rawRow) =>
    Object.fromEntries(
      headers.map((header, index) => [header, rawRow[index]?.trim() ?? '']),
    ),
  )

  return {
    headers,
    rows,
  }
}

export function buildCsv(headers: string[], rows: Array<Record<string, string>>): string {
  const headerLine = headers.map((header) => escapeCsvValue(header)).join(',')
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header] ?? '')).join(','),
  )

  return [headerLine, ...dataLines].join('\n')
}
