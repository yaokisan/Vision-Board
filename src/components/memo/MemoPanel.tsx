'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Note } from '@/types';

interface MemoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

export default function MemoPanel({ isOpen, onClose, width, onWidthChange }: MemoPanelProps) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isResizing, setIsResizing] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Load initial content
  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading note:', error);
        return;
      }

      if (data) {
        setContent(data.content || '');
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
  };

  const saveContent = useCallback(async (newContent: string) => {
    try {
      setSaveStatus('saving');
      
      const { data: existingNote } = await supabase
        .from('notes')
        .select('id')
        .limit(1)
        .single();

      if (existingNote) {
        const { error } = await supabase
          .from('notes')
          .update({ content: newContent })
          .eq('id', existingNote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert({ content: newContent });

        if (error) throw error;
      }

      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('unsaved');
    }
  }, [supabase]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus('unsaved');

    // Debounce auto-save (2 seconds)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      saveContent(newContent);
    }, 2000);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX;
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.5, resizeStartWidth.current + deltaX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // パネルが閉じている時は非表示
  // if (!isOpen) return null;

  // レスポンシブ対応: モバイルでは全画面表示
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1023;
  
  const panelWidth = isMobile ? '100vw' : `${width}px`;
  const panelHeight = isMobile ? '100vh' : 'h-full';

  return (
    <>
      {/* Panel - オーバーレイを削除して、パネルのみ表示 */}
      <div
        className={`fixed ${isMobile ? 'inset-0' : 'top-0 right-0'} ${panelHeight} bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out border-l border-gray-200 ${
          isOpen ? 'transform translate-x-0' : 'transform translate-x-full'
        }`}
        style={{ width: panelWidth }}
      >
        {/* Resize handle - デスクトップのみ表示 */}
        {!isMobile && (
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-gray-200 hover:bg-gray-300 transition-colors"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ⟷
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            📝 メモ
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 p-4">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="メモを入力してください..."
              className="w-full h-full resize-none border-none outline-none text-gray-700 placeholder-gray-400 text-sm leading-relaxed"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            />
          </div>

          {/* Save status indicator */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex justify-end">
              <span className={`text-xs ${
                saveStatus === 'saved' ? 'text-green-600' : 
                saveStatus === 'saving' ? 'text-blue-600' : 
                'text-orange-600'
              }`}>
                {saveStatus === 'saved' ? '保存済み' : 
                 saveStatus === 'saving' ? '保存中...' : 
                 '未保存'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}