'use client'
import { ORDER_FIELDS } from '@/lib/fields'

interface Props {
  headers: string[]
  mapping: Record<string, number>
  onMappingChange: (mapping: Record<string, number>) => void
  onConfirm: () => void
  mappingSource: 'auto' | 'saved'
}

export default function MappingEditor({ headers, mapping, onMappingChange, onConfirm, mappingSource }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">列映射配置</h2>
        <span className={`text-xs px-2 py-1 rounded ${mappingSource === 'saved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {mappingSource === 'saved' ? '✨ 已记忆的映射' : '🔍 自动识别'}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">请确认 Excel 列与系统字段的对应关系，如有误可手动调整</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ORDER_FIELDS.map(field => (
          <div key={field.key} className="flex items-center gap-2">
            <label className="w-28 text-sm font-medium text-gray-700 flex-shrink-0">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              className="flex-1 border rounded px-2 py-1.5 text-sm bg-white"
              value={mapping[field.key] ?? -1}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                const newMapping = { ...mapping }
                if (val === -1) {
                  delete newMapping[field.key]
                } else {
                  newMapping[field.key] = val
                }
                onMappingChange(newMapping)
              }}
            >
              <option value={-1}>-- 不映射 --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>{h || `列${i + 1}`}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onConfirm}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          确认映射，开始导入
        </button>
      </div>
    </div>
  )
}
