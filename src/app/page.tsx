'use client'
import { useState, useCallback } from 'react'
import FileUpload from '@/components/FileUpload'
import MappingEditor from '@/components/MappingEditor'
import DataPreview, { OrderRow } from '@/components/DataPreview'
import ProgressBar from '@/components/ProgressBar'
import OrderList from '@/components/OrderList'
import { ORDER_FIELDS } from '@/lib/fields'
import * as XLSX from 'xlsx'

type Step = 'upload' | 'mapping' | 'preview' | 'done'
type Tab = 'import' | 'orders'

export default function Home() {
  const [tab, setTab] = useState<Tab>('import')
  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Parse result
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [mappingSource, setMappingSource] = useState<'auto' | 'saved'>('auto')
  const [fingerprint, setFingerprint] = useState('')

  // Preview data
  const [previewData, setPreviewData] = useState<OrderRow[]>([])

  // Progress
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 })

  // Result
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  const handleFileSelected = useCallback(async (file: File) => {
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '解析失败')
        setLoading(false)
        return
      }
      setHeaders(data.headers)
      setRawRows(data.dataRows)
      setMapping(data.mapping)
      setMappingSource(data.mappingSource)
      setFingerprint(data.fingerprint)
      setProgress({ current: data.totalRows, total: data.totalRows })
      setStep('mapping')
    } catch (err) {
      alert('上传失败: ' + (err instanceof Error ? err.message : '网络错误'))
    }
    setLoading(false)
  }, [])

  const handleConfirmMapping = useCallback(async () => {
    // Save mapping
    try {
      await fetch('/api/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, mapping }),
      })
    } catch { /* ignore save failure */ }

    // Transform raw rows to order data
    setProgress({ current: 0, total: rawRows.length })
    const orders: OrderRow[] = []
    const batchSize = 100
    for (let i = 0; i < rawRows.length; i += batchSize) {
      const batch = rawRows.slice(i, i + batchSize)
      batch.forEach(row => {
        const order: OrderRow = {}
        ORDER_FIELDS.forEach(field => {
          const colIdx = mapping[field.key]
          if (colIdx !== undefined && colIdx >= 0 && colIdx < row.length) {
            order[field.key] = row[colIdx] != null ? String(row[colIdx]).trim() : ''
          } else {
            order[field.key] = ''
          }
        })
        orders.push(order)
      })
      setProgress({ current: Math.min(i + batchSize, rawRows.length), total: rawRows.length })
      // Yield to UI
      await new Promise(r => setTimeout(r, 10))
    }
    setPreviewData(orders)
    setStep('preview')
  }, [rawRows, mapping, fingerprint])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setSubmitProgress({ current: 0, total: previewData.length })
    try {
      // Submit in chunks for progress
      const chunkSize = 100
      let totalSuccess = 0
      let totalFailed = 0
      for (let i = 0; i < previewData.length; i += chunkSize) {
        const chunk = previewData.slice(i, i + chunkSize)
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: chunk }),
        })
        const data = await res.json()
        totalSuccess += data.success || 0
        totalFailed += data.failed || 0
        setSubmitProgress({ current: Math.min(i + chunkSize, previewData.length), total: previewData.length })
      }
      setResult({ success: totalSuccess, failed: totalFailed })
      setStep('done')
    } catch (err) {
      alert('提交失败: ' + (err instanceof Error ? err.message : '网络错误'))
    }
    setSubmitting(false)
  }, [previewData])

  const handleExport = useCallback(() => {
    const wsData = [ORDER_FIELDS.map(f => f.label)]
    previewData.forEach(row => {
      wsData.push(ORDER_FIELDS.map(f => row[f.key] != null ? String(row[f.key]) : ''))
    })
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '订单数据')
    XLSX.writeFile(wb, '导出订单.xlsx')
  }, [previewData])

  const resetAll = () => {
    setStep('upload')
    setHeaders([])
    setRawRows([])
    setMapping({})
    setPreviewData([])
    setResult(null)
    setProgress({ current: 0, total: 0 })
    setSubmitProgress({ current: 0, total: 0 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">📦 万能导入 —— 多模板自动导入下单系统</h1>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab('import')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition ${tab === 'import' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            >导入下单</button>
            <button
              onClick={() => setTab('orders')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition ${tab === 'orders' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            >运单列表</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'orders' ? (
          <OrderList />
        ) : (
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm">
              {['上传文件', '列映射', '预览编辑', '完成'].map((s, i) => {
                const stepKeys: Step[] = ['upload', 'mapping', 'preview', 'done']
                const isActive = stepKeys.indexOf(step) >= i
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                    <span className={isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}>{s}</span>
                    {i < 3 && <span className="text-gray-300 mx-1">→</span>}
                  </div>
                )
              })}
            </div>

            {step === 'upload' && <FileUpload onFileSelected={handleFileSelected} loading={loading} />}

            {step === 'mapping' && (
              <>
                {progress.total > 0 && <ProgressBar current={progress.current} total={progress.total} label="文件解析进度" />}
                <MappingEditor
                  headers={headers}
                  mapping={mapping}
                  onMappingChange={setMapping}
                  onConfirm={handleConfirmMapping}
                  mappingSource={mappingSource}
                />
              </>
            )}

            {step === 'preview' && (
              <>
                {submitting && <ProgressBar current={submitProgress.current} total={submitProgress.total} label="提交进度" />}
                <DataPreview
                  data={previewData}
                  onDataChange={setPreviewData}
                  onSubmit={handleSubmit}
                  onExport={handleExport}
                  submitting={submitting}
                />
              </>
            )}

            {step === 'done' && result && (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">提交完成！</h2>
                <p className="text-gray-600 mb-4">
                  成功 <span className="font-bold text-green-600">{result.success}</span> 条
                  {result.failed > 0 && <>，失败 <span className="font-bold text-red-600">{result.failed}</span> 条</>}
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={resetAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">继续导入</button>
                  <button onClick={() => setTab('orders')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">查看运单列表</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
