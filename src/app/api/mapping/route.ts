import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Save mapping
export async function POST(req: NextRequest) {
  try {
    const { fingerprint, mapping } = await req.json()
    
    if (!fingerprint || !mapping) {
      return NextResponse.json({ error: '参数缺失' }, { status: 400 })
    }
    
    await prisma.templateMapping.upsert({
      where: { fingerprint },
      update: { mapping: JSON.stringify(mapping) },
      create: { fingerprint, mapping: JSON.stringify(mapping) },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mapping save error:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
