import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请选择要删除的运单' }, { status: 400 })
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: '单次最多删除100条' }, { status: 400 })
    }

    const result = await prisma.order.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Batch delete error:', error)
    return NextResponse.json({ error: '批量删除失败' }, { status: 500 })
  }
}
