import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const externalCode = searchParams.get('externalCode') || ''
    const receiverName = searchParams.get('receiverName') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const conditions: Record<string, unknown>[] = []

    if (externalCode) {
      conditions.push({ externalCode: { contains: externalCode, mode: 'insensitive' } })
    }
    if (receiverName) {
      conditions.push({ receiverName: { contains: receiverName, mode: 'insensitive' } })
    }
    if (dateFrom) {
      conditions.push({ createdAt: { gte: new Date(dateFrom) } })
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      conditions.push({ createdAt: { lt: endDate } })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
