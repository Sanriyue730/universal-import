'use client'
import { useState, useCallback } from 'react'

interface Props {
  onFileSelected: (file: File) => void
  loading: boolean
}

export default function FileUpload({ onFileSelected, loading }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext || '')) {
      alert('仅支持 .xlsx / .xls 格式文件')
      return
    }
    setFileName(file.name)
    onFileSelected(file)
  }, [onFileSelected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <div className="text-4xl mb-4">📁</div>
      {loading ? (
        <p className="text-blue-600 font-medium">正在解析文件...</p>
      ) : fileName ? (
        <p className="text-green-600 font-medium">已选择: {fileName}</p>
      ) : (
        <>
          <p className="text-gray-600 font-medium">拖拽 Excel 文件到此处，或点击选择文件</p>
          <p className="text-gray-400 text-sm mt-2">支持 .xlsx / .xls 格式</p>
        </>
      )}
    </div>
  )
}
