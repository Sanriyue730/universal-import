interface Props {
  current: number
  total: number
  label?: string
}

export default function ProgressBar({ current, total, label }: Props) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full">
      {label && <p className="text-sm text-gray-600 mb-1">{label}</p>}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-center"
          style={{ width: `${percent}%` }}
        >
          {percent > 15 && <span className="text-xs text-white font-medium">{percent}%</span>}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{current} / {total} 条</p>
    </div>
  )
}
