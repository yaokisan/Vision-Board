'use client'

interface DeleteConfirmPopupProps {
  isOpen: boolean
  position: { x: number; y: number }
  onConfirm: () => void
  onCancel: () => void
  nodeLabel?: string
}

export default function DeleteConfirmPopup({ 
  isOpen, 
  position, 
  onConfirm, 
  onCancel, 
  nodeLabel 
}: DeleteConfirmPopupProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '200px'
      }}
    >
      <div className="text-sm text-gray-800 mb-3">
        <p className="font-medium">削除の確認</p>
        <p className="text-gray-600 mt-1">
          {nodeLabel ? `「${nodeLabel}」を削除しますか？` : 'このノードを削除しますか？'}
        </p>
        <p className="text-xs text-gray-500 mt-1">関連する接続も削除されます。</p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          削除
        </button>
      </div>
    </div>
  )
}