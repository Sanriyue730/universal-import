import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { autoDetectMapping, generateFingerprint, ORDER_FIELDS } from '@/lib/fields'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
    }
    
    if (file.size === 0) {
      return NextResponse.json({ error: '文件为空' }, { status: 400 })
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext || '')) {
      return NextResponse.json({ error: '仅支持 .xlsx / .xls 格式' }, { status: 400 })
    }
    
    const buffer = Buffer.from(await file.arrayBuffer())
    
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch {
      return NextResponse.json({ error: '文件解析失败，请确认文件格式正确' }, { status: 400 })
    }
    
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: '文件中没有有效的 Sheet' }, { status: 400 })
    }
    
    // Smart sheet selection: prefer sheets with data-related names
    let sheetName = workbook.SheetNames[0]
    const dataKeywords = ['订单', '数据', 'order', 'data', 'import', '导入', '下单', 'sheet1']
    const skipKeywords = ['说明', '填写', 'readme', 'help', 'instruction']
    
    // First try to find a data sheet
    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase()
      if (dataKeywords.some(k => lower.includes(k)) && !skipKeywords.some(k => lower.includes(k))) {
        sheetName = name
        break
      }
    }
    
    // If first sheet looks like instructions, try the next one
    if (workbook.SheetNames.length > 1) {
      const firstLower = workbook.SheetNames[0].toLowerCase()
      if (skipKeywords.some(k => firstLower.includes(k))) {
        // Use the second sheet or the one we found above
        if (sheetName === workbook.SheetNames[0]) {
          sheetName = workbook.SheetNames[1]
        }
      }
    }
    
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet || !worksheet['!ref']) {
      return NextResponse.json({ error: `Sheet "${sheetName}" 为空，没有数据` }, { status: 400 })
    }
    
    const allRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    
    if (allRows.length === 0) {
      return NextResponse.json({ error: '文件为空，没有数据' }, { status: 400 })
    }
    
    // Smart header detection:
    // Find the row that best matches our known field names
    // Strategy: score each row by how many cells match known aliases
    let headerRowIndex = 0
    let bestScore = 0
    
    for (let i = 0; i < Math.min(10, allRows.length); i++) {
      const row = allRows[i] as string[]
      if (!row) continue
      
      const nonEmpty = row.filter(cell => cell != null && String(cell).trim() !== '').length
      if (nonEmpty < 3) continue // Skip rows with too few cells
      
      // Score this row: how many cells match known field aliases?
      const headers = row.map(h => String(h || '').trim())
      const mapping = autoDetectMapping(headers)
      const score = Object.keys(mapping).length
      
      // Also check: does this row have mostly short text (headers) vs long text (data)?
      const avgLen = headers.filter(h => h).reduce((sum, h) => sum + h.length, 0) / Math.max(nonEmpty, 1)
      
      // Prefer rows that map more fields, with shorter average cell length (headers are short)
      const adjustedScore = score * 10 + (avgLen < 15 ? 5 : 0) + (nonEmpty >= 5 ? 3 : 0)
      
      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        headerRowIndex = i
      }
    }
    
    // Fallback: if no good match, use first row with >= 5 non-empty cells
    if (bestScore === 0) {
      for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const row = allRows[i] as string[]
        const nonEmpty = row.filter(cell => cell != null && String(cell).trim() !== '').length
        if (nonEmpty >= 5) {
          headerRowIndex = i
          break
        }
      }
    }
    
    const headers = (allRows[headerRowIndex] as string[]).map(h => String(h || '').trim())
    
    // Filter data rows: skip empty rows and the header row itself
    const dataRows = allRows.slice(headerRowIndex + 1).filter(row => {
      const r = row as string[]
      // A valid data row should have at least 3 non-empty cells
      const nonEmpty = r.filter(cell => cell != null && String(cell).trim() !== '').length
      return nonEmpty >= 3
    })
    
    if (dataRows.length === 0) {
      return NextResponse.json({ error: '文件中没有有效数据行（表头后无数据）' }, { status: 400 })
    }
    
    // Check for saved mapping
    const fingerprint = generateFingerprint(headers)
    let mapping: Record<string, number> | null = null
    let mappingSource: 'auto' | 'saved' = 'auto'
    
    const savedMapping = await prisma.templateMapping.findUnique({
      where: { fingerprint }
    })
    
    if (savedMapping) {
      mapping = JSON.parse(savedMapping.mapping)
      mappingSource = 'saved'
    } else {
      mapping = autoDetectMapping(headers)
      mappingSource = 'auto'
    }
    
    // Calculate mapping coverage
    const requiredFields = ORDER_FIELDS.filter(f => f.required)
    const mappedRequired = requiredFields.filter(f => mapping && mapping[f.key] !== undefined).length
    
    return NextResponse.json({
      headers,
      dataRows: dataRows.map(r => r as string[]),
      totalRows: dataRows.length,
      mapping,
      mappingSource,
      fingerprint,
      sheetName,
      headerRowIndex,
      mappedRequired,
      totalRequired: requiredFields.length,
    })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
