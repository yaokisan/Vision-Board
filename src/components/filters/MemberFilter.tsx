'use client';

import React from 'react';
import { Member } from '@/types';

interface MemberFilterProps {
  members: Member[];
  selectedMemberId: string | null;
  onMemberSelect: (memberId: string | null) => void;
  className?: string;
}

export default function MemberFilter({ 
  members, 
  selectedMemberId, 
  onMemberSelect, 
  className = '' 
}: MemberFilterProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedMemberId || ''}
        onChange={(e) => onMemberSelect(e.target.value || null)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors min-w-[140px] max-w-[200px]"
      >
        <option value="">すべて表示</option>
        {members
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
      </select>
      
      {/* カスタムドロップダウン矢印 */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg 
          className="w-4 h-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>
      
      {/* フィルターアイコン */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
        <svg 
          className={`w-4 h-4 transition-colors ${
            selectedMemberId ? 'text-blue-600' : 'text-gray-400'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" 
          />
        </svg>
      </div>
    </div>
  );
}