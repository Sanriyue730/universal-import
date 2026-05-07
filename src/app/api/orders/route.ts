import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    
    const where = search ? {
      OR: [
        { externalCode: { contains: search, mode: 'insensitive' as const } },
        { receiverName: { contains: search, mode: 'insensitive' as const } },
        { senderName: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}
    
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
