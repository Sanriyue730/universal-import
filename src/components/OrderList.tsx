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
  const [loading, setLoading] = useState(false)
  const [searchTrigger, setSearchTrigger] = useState(0)

  // Search fields
  const [externalCode, setExternalCode] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Edit modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState<Partial<Order>>({})
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (externalCode) params.set('externalCode', externalCode)
      if (receiverName) params.set('receiverName', receiverName)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, searchTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleReset = () => {
    setExternalCode('')
    setReceiverName('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setSearchTrigger(t => t + 1)
  }

  const handleEdit = (order: Order) => {
    setEditingOrder(order)
    setEditForm({ ...order })
  }

  const handleSave = async () => {
    if (!editingOrder) return
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditingOrder(null)
        fetchOrders()
      } else {
        const data = await res.json()
        alert(data.error || '保存失败')
      }
    } catch { alert('网络错误') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/orders/${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeletingId(null)
        fetchOrders()
      } else {
        alert('删除失败')
      }
    } catch { alert('网络错误') }
    setDeleting(false)
  }

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">已导入运单列表</h2>
          <span className="text-sm text-gray-500">共 {total} 条记录</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">外部编码</label>
            <input type="text" placeholder="输入外部编码" className="w-full border rounded px-3 py-1.5 text-sm" value={externalCode} onChange={(e) => setExternalCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">收件人姓名</label>
            <input type="text" placeholder="输入收件人姓名" className="w-full border rounded px-3 py-1.5 text-sm" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">提交时间（从）</label>
            <input type="date" className="w-full border rounded px-3 py-1.5 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">提交时间（至）</label>
            <input type="date" className="w-full border rounded px-3 py-1.5 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => { setPage(1); setSearchTrigger(t => t + 1) }} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">查询</button>
            <button onClick={handleReset} className="px-4 py-1.5 text-sm border rounded hover:bg-gray-50">重置</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">外部编码</th>
              <th className="px-3 py-2 text-left">发件人</th>
              <th className="px-3 py-2 text-left">收件人</th>
              <th className="px-3 py-2 text-left">收件人电话</th>
              <th className="px-3 py-2 text-left">收件地址</th>
              <th className="px-3 py-2 text-center">重量</th>
              <th className="px-3 py-2 text-center">件数</th>
              <th className="px-3 py-2 text-center">温层</th>
              <th className="px-3 py-2 text-left">提交时间</th>
              <th className="px-3 py-2 text-center">操作</th>
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
                <td className="px-3 py-2">{order.receiverName}</td>
                <td className="px-3 py-2">{order.receiverPhone}</td>
                <td className="px-3 py-2 max-w-[180px] truncate">{order.receiverAddress}</td>
                <td className="px-3 py-2 text-center">{order.weight}</td>
                <td className="px-3 py-2 text-center">{order.quantity}</td>
                <td className="px-3 py-2 text-center">{order.tempZone}</td>
                <td className="px-3 py-2 text-xs">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <button onClick={() => handleEdit(order)} className="text-blue-600 hover:text-blue-800 text-xs mr-2">编辑</button>
                  <button onClick={() => setDeletingId(order.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                </td>
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

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">编辑运单</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'externalCode', label: '外部编码' },
                { key: 'senderName', label: '发件人姓名' },
                { key: 'senderPhone', label: '发件人电话' },
                { key: 'senderAddress', label: '发件人地址' },
                { key: 'receiverName', label: '收件人姓名' },
                { key: 'receiverPhone', label: '收件人电话' },
                { key: 'receiverAddress', label: '收件人地址' },
                { key: 'weight', label: '重量(kg)' },
                { key: 'quantity', label: '件数' },
                { key: 'tempZone', label: '温层' },
                { key: 'remark', label: '备注' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  {f.key === 'tempZone' ? (
                    <select className="w-full border rounded px-3 py-1.5 text-sm" value={(editForm as Record<string,unknown>)[f.key] as string || ''} onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                      <option value="常温">常温</option>
                      <option value="冷藏">冷藏</option>
                      <option value="冷冻">冷冻</option>
                    </select>
                  ) : (
                    <input type="text" className="w-full border rounded px-3 py-1.5 text-sm" value={(editForm as Record<string,unknown>)[f.key] != null ? String((editForm as Record<string,unknown>)[f.key]) : ''} onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingOrder(null)} className="px-4 py-2 border rounded hover:bg-gray-50">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这条运单信息吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 border rounded hover:bg-gray-50">取消</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{deleting ? '删除中...' : '确认删除'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
