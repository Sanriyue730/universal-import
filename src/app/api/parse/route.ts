import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { autoDetectMapping, generateFingerprint } from '@/lib/fields'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
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
    
    // Try to find the data sheet
    let sheetName = workbook.SheetNames[0]
    for (const name of workbook.SheetNames) {
      if (name.includes('订单') || name.includes('数据') || name.includes('order') || name.includes('data')) {
        sheetName = name
        break
      }
    }
    
    const worksheet = workbook.Sheets[sheetName]
    const allRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    
    if (allRows.length === 0) {
      return NextResponse.json({ error: '文件为空，没有数据' }, { status: 400 })
    }
    
    // Find header row (first row with >= 5 non-empty cells that look like headers)
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(5, allRows.length); i++) {
      const row = allRows[i] as string[]
      const nonEmpty = row.filter(cell => cell != null && String(cell).trim() !== '').length
      if (nonEmpty >= 5) {
        headerRowIndex = i
        break
      }
    }
    
    const headers = (allRows[headerRowIndex] as string[]).map(h => String(h || '').trim())
    const dataRows = allRows.slice(headerRowIndex + 1).filter(row => {
      const r = row as string[]
      return r.some(cell => cell != null && String(cell).trim() !== '')
    })
    
    if (dataRows.length === 0) {
      return NextResponse.json({ error: '文件中没有数据行' }, { status: 400 })
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
    
    return NextResponse.json({
      headers,
      dataRows: dataRows.map(r => r as string[]),
      totalRows: dataRows.length,
      mapping,
      mappingSource,
      fingerprint,
      sheetName,
    })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
