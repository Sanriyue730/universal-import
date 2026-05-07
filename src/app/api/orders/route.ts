import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const externalCode = searchParams.get('externalCode') || ''
    const receiverName = searchParams.get('receiverName') || ''
    const phone = searchParams.get('phone') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const conditions: Record<string, unknown>[] = []

    if (externalCode) {
      conditions.push({ externalCode: { contains: externalCode, mode: 'insensitive' } })
    }
    if (receiverName) {
      conditions.push({ receiverName: { contains: receiverName, mode: 'insensitive' } })
    }
    if (phone) {
      conditions.push({
        OR: [
          { senderPhone: { contains: phone } },
          { receiverPhone: { contains: phone } },
        ]
      })
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { externalCode, senderName, senderPhone, senderAddress, receiverName, receiverPhone, receiverAddress, weight, quantity, tempZone, remark } = body

    if (!receiverName || !receiverPhone || !receiverAddress) {
      return NextResponse.json({ error: '收件人姓名、电话、地址为必填项' }, { status: 400 })
    }

    const order = await prisma.order.create({
      data: {
        externalCode: externalCode || null,
        senderName: senderName || '',
        senderPhone: senderPhone || '',
        senderAddress: senderAddress || '',
        receiverName,
        receiverPhone,
        receiverAddress,
        weight: typeof weight === 'number' ? weight : parseFloat(weight) || 0,
        quantity: typeof quantity === 'number' ? quantity : parseInt(quantity) || 1,
        tempZone: tempZone || '常温',
        remark: remark || null,
        batchId: `manual-${Date.now()}`,
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Order create error:', error)
    return NextResponse.json({ error: '新增失败' }, { status: 500 })
  }
}
