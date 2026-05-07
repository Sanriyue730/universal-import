import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { orders } = await req.json()
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: '没有数据可提交' }, { status: 400 })
    }
    
    const batchId = uuidv4()
    let success = 0
    let failed = 0
    const errors: string[] = []
    
    // Process in batches of 50
    const batchSize = 50
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize)
      try {
        await prisma.order.createMany({
          data: batch.map((order: Record<string, unknown>) => ({
            externalCode: order.externalCode ? String(order.externalCode) : null,
            senderName: String(order.senderName || ''),
            senderPhone: String(order.senderPhone || ''),
            senderAddress: String(order.senderAddress || ''),
            receiverName: String(order.receiverName || ''),
            receiverPhone: String(order.receiverPhone || ''),
            receiverAddress: String(order.receiverAddress || ''),
            weight: Number(order.weight) || 0,
            quantity: Number(order.quantity) || 0,
            tempZone: String(order.tempZone || ''),
            remark: order.remark ? String(order.remark) : null,
            batchId,
          })),
        })
        success += batch.length
      } catch (err) {
        failed += batch.length
        errors.push(`批次 ${Math.floor(i / batchSize) + 1} 写入失败: ${err instanceof Error ? err.message : '未知错误'}`)
      }
    }
    
    return NextResponse.json({ success, failed, batchId, errors })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}
