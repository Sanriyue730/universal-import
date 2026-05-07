'use client'
import { useState, useCallback } from 'react'
import { ORDER_FIELDS, validateRow, ValidationError } from '@/lib/fields'

export interface OrderRow {
  [key: string]: string | number | null
}

interface Props {
  data: OrderRow[]
  onDataChange: (data: OrderRow[]) => void
  onSubmit: () => void
  onExport: () => void
  submitting: boolean
}

export default function DataPreview({ data, onDataChange, onSubmit, onExport, submitting }: Props) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null)

  // Validate all rows
  const allErrors: ValidationError[] = []
  data.forEach((row, i) => {
    const rowErrors = validateRow(row, i + 1)
    allErrors.push(...rowErrors)
  })

  // Check duplicate external codes
  const duplicateRows: Map<number, string> = new Map()
  const codeMap: Map<string, number[]> = new Map()
  data.forEach((row, i) => {
    const code = row.externalCode ? String(row.externalCode).trim() : ''
    if (code) {
      if (!codeMap.has(code)) codeMap.set(code, [])
      codeMap.get(code)!.push(i)
    }
  })
  codeMap.forEach((indices, code) => {
    if (indices.length > 1) {
      indices.forEach(i => duplicateRows.set(i, `外部编码"${code}"与第${indices.filter(x => x !== i).map(x => x + 1).join(',')}行重复`))
    }
  })

  const getError = (rowIdx: number, field: string) => {
    return allErrors.find(e => e.row === rowIdx + 1 && e.field === field)
  }

  const handleCellEdit = useCallback((rowIdx: number, field: string, value: string) => {
    const newData = [...data]
    newData[rowIdx] = { ...newData[rowIdx], [field]: value }
    onDataChange(newData)
  }, [data, onDataChange])

  const deleteRow = (idx: number) => {
    onDataChange(data.filter((_, i) => i !== idx))
  }

  const addRow = () => {
    const emptyRow: OrderRow = {}
    ORDER_FIELDS.forEach(f => { emptyRow[f.key] = '' })
    onDataChange([...data, emptyRow])
  }

  const hasErrors = allErrors.length > 0 || duplicateRows.size > 0

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">数据预览与编辑</h2>
          <p className="text-sm text-gray-500">共 {data.length} 条数据，{allErrors.length} 个错误</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">+ 新增行</button>
          <button onClick={onExport} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">📥 导出 Excel</button>
          <button
            onClick={onSubmit}
            disabled={hasErrors || submitting}
            className={`px-4 py-1.5 text-sm rounded font-medium text-white ${
              hasErrors || submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? '提交中...' : '✅ 提交下单'}
          </button>
        </div>
      </div>

      {/* Error summary */}
      {hasErrors && (
        <div className="p-3 bg-red-50 border-b border-red-100 max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-red-700 mb-1">⚠️ 存在以下错误，请修正后提交：</p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {allErrors.slice(0, 50).map((e, i) => (
              <li key={i}>第 {e.row} 行，{e.fieldLabel}：{e.message}</li>
            ))}
            {[...duplicateRows.entries()].slice(0, 10).map(([idx, msg]) => (
              <li key={`dup-${idx}`}>第 {idx + 1} 行，{msg}</li>
            ))}
            {allErrors.length > 50 && <li>...还有 {allErrors.length - 50} 个错误</li>}
          </ul>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              <th className="px-2 py-2 border text-center w-10">#</th>
              {ORDER_FIELDS.map(f => (
                <th key={f.key} className="px-2 py-2 border text-left whitespace-nowrap">
                  {f.label}{f.required && <span className="text-red-500">*</span>}
                </th>
              ))}
              <th className="px-2 py-2 border text-center w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className={duplicateRows.has(rowIdx) ? 'bg-yellow-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 border text-center text-gray-400">{rowIdx + 1}</td>
                {ORDER_FIELDS.map(f => {
                  const error = getError(rowIdx, f.key)
                  const isEditing = editingCell?.row === rowIdx && editingCell?.field === f.key
                  return (
                    <td
                      key={f.key}
                      className={`px-1 py-0.5 border relative ${error ? 'bg-red-50' : ''}`}
                      onClick={() => setEditingCell({ row: rowIdx, field: f.key })}
                      title={error ? `${error.fieldLabel}: ${error.message}` : undefined}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          className="w-full px-1 py-0.5 border border-blue-400 rounded text-sm outline-none"
                          value={row[f.key] != null ? String(row[f.key]) : ''}
                          onChange={(e) => handleCellEdit(rowIdx, f.key, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab' || e.key === 'Enter') {
                              e.preventDefault()
                              setEditingCell(null)
                              const fieldIdx = ORDER_FIELDS.findIndex(x => x.key === f.key)
                              if (e.key === 'Tab' && fieldIdx < ORDER_FIELDS.length - 1) {
                                setEditingCell({ row: rowIdx, field: ORDER_FIELDS[fieldIdx + 1].key })
                              } else if (e.key === 'Enter' && rowIdx < data.length - 1) {
                                setEditingCell({ row: rowIdx + 1, field: f.key })
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="px-1 py-0.5 min-h-[24px] truncate max-w-[200px]">
                          {row[f.key] != null ? String(row[f.key]) : ''}
                          {error && <span className="text-red-500 text-xs ml-1">⚠</span>}
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="px-2 py-1 border text-center">
                  <button onClick={() => deleteRow(rowIdx)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {duplicateRows.size > 0 && (
        <div className="p-2 bg-yellow-50 border-t text-xs text-yellow-700">
          ⚠️ 黄色高亮行存在外部编码重复
        </div>
      )}
    </div>
  )
}
