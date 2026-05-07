import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.order.update({
      where: { id },
      data: {
        externalCode: body.externalCode || null,
        senderName: String(body.senderName || ''),
        senderPhone: String(body.senderPhone || ''),
        senderAddress: String(body.senderAddress || ''),
        receiverName: String(body.receiverName || ''),
        receiverPhone: String(body.receiverPhone || ''),
        receiverAddress: String(body.receiverAddress || ''),
        weight: Number(body.weight) || 0,
        quantity: Number(body.quantity) || 0,
        tempZone: String(body.tempZone || ''),
        remark: body.remark || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
