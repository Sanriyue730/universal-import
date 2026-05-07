'use client'
import { useState, useEffect, useCallback } from 'react'

interface Order {
  id: string
  externalCode: string | null
  senderName: string
  senderPhone: string
  senderAddress: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  weight: number
  quantity: number
  tempZone: string
  remark: string | null
  createdAt: string
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-bold">已导入运单列表</h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="搜索外部编码/收件人..."
            className="border rounded px-3 py-1.5 text-sm w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <span className="text-sm text-gray-500">共 {total} 条</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">外部编码</th>
              <th className="px-3 py-2 text-left">发件人</th>
              <th className="px-3 py-2 text-left">发件人电话</th>
              <th className="px-3 py-2 text-left">收件人</th>
              <th className="px-3 py-2 text-left">收件人电话</th>
              <th className="px-3 py-2 text-left">收件地址</th>
              <th className="px-3 py-2 text-center">重量</th>
              <th className="px-3 py-2 text-center">件数</th>
              <th className="px-3 py-2 text-center">温层</th>
              <th className="px-3 py-2 text-left">提交时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">暂无数据</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{order.externalCode || '-'}</td>
                <td className="px-3 py-2">{order.senderName}</td>
                <td className="px-3 py-2">{order.senderPhone}</td>
                <td className="px-3 py-2">{order.receiverName}</td>
                <td className="px-3 py-2">{order.receiverPhone}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{order.receiverAddress}</td>
                <td className="px-3 py-2 text-center">{order.weight}</td>
                <td className="px-3 py-2 text-center">{order.quantity}</td>
                <td className="px-3 py-2 text-center">{order.tempZone}</td>
                <td className="px-3 py-2 text-xs">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-3 border-t flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  )
}
