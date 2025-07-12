/**
 * ノード削除確認ダイアログ
 * カスケード削除の影響範囲を表示してユーザーの確認を取得
 */

'use client'

import { useState, useEffect } from 'react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  nodeId: string
  nodeName: string
  relatedEdgesCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmationDialog({
  isOpen,
  nodeId,
  nodeName,
  relatedEdgesCount,
  onConfirm,
  onCancel
}: DeleteConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  // ダイアログが開いたときの初期化
  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    setIsConfirming(true)
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                カードの削除確認
              </h3>
            </div>
          </div>

          {/* メッセージ */}
          <div className="mb-6">
            <p className="text-sm text-gray-700 mb-3">
              <span className="font-medium">{nodeName}</span> を削除しようとしています。
            </p>
            
            {relatedEdgesCount > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <svg 
                    className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">影響範囲</p>
                    <p className="text-yellow-700 mt-1">
                      このカードを削除すると、<span className="font-medium">{relatedEdgesCount}個の接続</span>も同時に削除されます。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                このカードには接続がないため、安全に削除できます。
              </p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isConfirming}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isConfirming ? '削除中...' : '削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}