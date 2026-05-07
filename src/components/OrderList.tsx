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

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)

  // Search fields
  const [externalCode, setExternalCode] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Edit modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState<Partial<Order>>({})
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<Record<string, string>>({
    externalCode: '', senderName: '', senderPhone: '', senderAddress: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    weight: '', quantity: '1', tempZone: '常温', remark: '',
  })
  const [adding, setAdding] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (externalCode) params.set('externalCode', externalCode)
      if (receiverName) params.set('receiverName', receiverName)
      if (phone) params.set('phone', phone)
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

  // Clear selection when page changes
  useEffect(() => { setSelectedIds(new Set()) }, [page, searchTrigger])

  const handleReset = () => {
    setExternalCode('')
    setReceiverName('')
    setPhone('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setSearchTrigger(t => t + 1)
  }

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setBatchDeleting(true)
    try {
      const res = await fetch('/api/orders/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (res.ok) {
        setSelectedIds(new Set())
        setShowBatchConfirm(false)
        fetchOrders()
      } else {
        const data = await res.json()
        alert(data.error || '批量删除失败')
      }
    } catch { alert('网络错误') }
    setBatchDeleting(false)
  }

  // Add order
  const handleAdd = async () => {
    if (!addForm.receiverName || !addForm.receiverPhone || !addForm.receiverAddress) {
      alert('收件人姓名、电话、地址为必填项')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          weight: parseFloat(addForm.weight) || 0,
          quantity: parseInt(addForm.quantity) || 1,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setAddForm({
          externalCode: '', senderName: '', senderPhone: '', senderAddress: '',
          receiverName: '', receiverPhone: '', receiverAddress: '',
          weight: '', quantity: '1', tempZone: '常温', remark: '',
        })
        fetchOrders()
      } else {
        const data = await res.json()
        alert(data.error || '新增失败')
      }
    } catch { alert('网络错误') }
    setAdding(false)
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

  const isAllSelected = orders.length > 0 && selectedIds.size === orders.length

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">运单列表</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              新增运单
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBatchConfirm(true)}
                className="px-4 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                批量删除 ({selectedIds.size})
              </button>
            )}
            <span className="text-sm text-gray-500">共 {total} 条记录</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">外部编码</label>
            <input type="text" placeholder="输入外部编码" className="w-full border rounded px-3 py-1.5 text-sm" value={externalCode} onChange={(e) => setExternalCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">收件人姓名</label>
            <input type="text" placeholder="输入收件人姓名" className="w-full border rounded px-3 py-1.5 text-sm" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">手机号</label>
            <input type="text" placeholder="输入手机号" className="w-full border rounded px-3 py-1.5 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="全选/取消全选"
                />
              </th>
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
              <tr><td colSpan={11} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-8 text-gray-400">暂无数据</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className={`border-t hover:bg-gray-50 ${selectedIds.has(order.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(order.id)}
                    onChange={() => toggleSelect(order.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
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

      {/* Batch Delete Confirm Modal */}
      {showBatchConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">确认批量删除</h3>
            <p className="text-gray-600 mb-6">确定要删除选中的 <span className="font-bold text-red-600">{selectedIds.size}</span> 条运单信息吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBatchConfirm(false)} className="px-4 py-2 border rounded hover:bg-gray-50">取消</button>
              <button onClick={handleBatchDelete} disabled={batchDeleting} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{batchDeleting ? '删除中...' : '确认删除'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">新增运单</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'externalCode', label: '外部编码' },
                { key: 'senderName', label: '发件人姓名' },
                { key: 'senderPhone', label: '发件人电话' },
                { key: 'senderAddress', label: '发件人地址' },
                { key: 'receiverName', label: '收件人姓名 *' },
                { key: 'receiverPhone', label: '收件人电话 *' },
                { key: 'receiverAddress', label: '收件人地址 *' },
                { key: 'weight', label: '重量(kg)' },
                { key: 'quantity', label: '件数' },
                { key: 'tempZone', label: '温层' },
                { key: 'remark', label: '备注' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  {f.key === 'tempZone' ? (
                    <select className="w-full border rounded px-3 py-1.5 text-sm" value={addForm[f.key]} onChange={(e) => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                      <option value="常温">常温</option>
                      <option value="冷藏">冷藏</option>
                      <option value="冷冻">冷冻</option>
                    </select>
                  ) : (
                    <input type="text" className="w-full border rounded px-3 py-1.5 text-sm" placeholder={f.label.replace(' *', '')} value={addForm[f.key]} onChange={(e) => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">取消</button>
              <button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{adding ? '提交中...' : '确认新增'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
