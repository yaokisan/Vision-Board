'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Company, Position, Layer, Business, Task, Executor } from '@/types'
import { 
  CompanyCard, 
  LayerCard, 
  BusinessCard, 
  TaskCard, 
  ExecutorCard,
  CxoCard
} from '@/components/cards'
import DraggableCard from './DraggableCard'
import DropZone from './DropZone'
import ConnectionLine from './ConnectionLine'
import ZoomPanCanvas from './ZoomPanCanvas'

export default function OrganizationBoard() {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // カード位置の状態管理
  const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({})
  
  // ドラッグ可能なカードの状態管理
  const [draggableCards, setDraggableCards] = useState({
    businesses: ['6'],
    tasks: ['7'],
    executors: ['8'],
    cxos: ['cto-card', 'cfo-card']
  })
  
  // カード位置を取得する関数
  const getCardPosition = (cardId: string) => {
    return cardPositions[cardId] || { x: 0, y: 0 }
  }

  // サンプルデータ
  const sampleCompany: Company = {
    id: '1',
    name: 'Empire Art',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const sampleLayers: Layer[] = [
    {
      id: '4',
      company_id: '1',
      name: '事業',
      type: 'business',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      company_id: '1',
      name: '経営',
      type: 'management',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const sampleBusinesses: Business[] = [
    {
      id: '6',
      layer_id: '4',
      name: 'Webサービス事業',
      goal: '月間売上1000万円達成',
      responsible_person: '山田次郎',
      category: 'IT',
      position_x: 0,
      position_y: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const sampleTasks: Task[] = [
    {
      id: '7',
      business_id: '6',
      layer_id: '4',
      name: 'マーケティング',
      goal: '新規顧客獲得100件/月',
      responsible_person: '鈴木三郎',
      group_name: '営業グループ',
      position_x: 0,
      position_y: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const sampleExecutors: Executor[] = [
    {
      id: '8',
      task_id: '7',
      name: '高橋四郎',
      role: 'マーケティングディレクター',
      position_x: 0,
      position_y: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const draggedId = active.id as string
    
    setActiveId(null)
    
    if (!delta) return
    
    // 位置を永続化
    const newPosition = {
      x: (cardPositions[draggedId]?.x || 0) + delta.x,
      y: (cardPositions[draggedId]?.y || 0) + delta.y
    }
    
    
    setCardPositions(prev => ({
      ...prev,
      [draggedId]: newPosition
    }))
  }

  return (
    <ZoomPanCanvas>
      <div className="p-8 min-w-[2000px] min-h-[1500px]">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="relative">
            {/* 接続線 */}
            <ConnectionLine startElementId="company-1" endElementId="cto-card" />
            <ConnectionLine startElementId="company-1" endElementId="cfo-card" />
            <ConnectionLine startElementId="cto-card" endElementId="6" />
            <ConnectionLine startElementId="6" endElementId="7" />
            <ConnectionLine startElementId="7" endElementId="8" />
            
            {/* 会社カード */}
            <div className="flex justify-center mb-12">
              <div id="company-1">
                <DraggableCard id="company-1" type="company" persistedPosition={getCardPosition('company-1')}>
                  <CompanyCard company={sampleCompany} ceoName="田中太郎" />
                </DraggableCard>
              </div>
            </div>

            {/* CXOスペース（オプション） */}
            <div className="flex justify-center gap-8 mb-12">
              <div id="cto-card">
                <DraggableCard id="cto-card" type="position" persistedPosition={getCardPosition('cto-card')}>
                  <CxoCard title="CTO" name="佐藤二郎" />
                </DraggableCard>
              </div>
              <div id="cfo-card">
                <DraggableCard id="cfo-card" type="position" persistedPosition={getCardPosition('cfo-card')}>
                  <CxoCard title="CFO" name="鈴木三郎" />
                </DraggableCard>
              </div>
            </div>

            {/* レイヤーコンテナ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 事業レイヤー */}
              <DropZone 
                id="business-layer" 
                acceptTypes={['business', 'task', 'executor']}
                className=""
              >
                <LayerCard layer={sampleLayers[0]}>
                  {/* 事業カード - ピラミッド構造 */}
                  <div className="flex flex-col items-center space-y-8">
                    {sampleBusinesses.map((business) => (
                      <div key={business.id} className="flex flex-col items-center space-y-6">
                        {/* 事業カード */}
                        <div id={business.id}>
                          <DraggableCard id={business.id} type="business" persistedPosition={getCardPosition(business.id)}>
                            <BusinessCard business={business} />
                          </DraggableCard>
                        </div>
                        
                        {/* 業務カード */}
                        <div className="flex flex-col items-center space-y-4">
                          {sampleTasks.filter(task => task.business_id === business.id).map((task) => (
                            <div key={task.id} className="flex flex-col items-center space-y-3">
                              <div id={task.id}>
                                <DraggableCard id={task.id} type="task" persistedPosition={getCardPosition(task.id)}>
                                  <TaskCard task={task} />
                                </DraggableCard>
                              </div>
                              
                              {/* 実行者カード */}
                              <div className="flex flex-col items-center space-y-2">
                                {sampleExecutors.filter(exec => exec.task_id === task.id).map((executor) => (
                                  <div key={executor.id} id={executor.id}>
                                    <DraggableCard id={executor.id} type="executor" persistedPosition={getCardPosition(executor.id)}>
                                      <ExecutorCard executor={executor} />
                                    </DraggableCard>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </LayerCard>
              </DropZone>

              {/* 経営レイヤー */}
              <DropZone 
                id="management-layer" 
                acceptTypes={['task', 'executor']}
                className=""
              >
                <LayerCard layer={sampleLayers[1]}>
                  {/* 経営レイヤーの業務カード */}
                  <div className="flex flex-col items-center space-y-6">
                    {sampleTasks.filter(task => !task.business_id).map((task) => (
                      <div key={task.id} className="flex flex-col items-center space-y-3">
                        <div id={`mgmt-${task.id}`}>
                          <DraggableCard id={`mgmt-${task.id}`} type="task" persistedPosition={getCardPosition(`mgmt-${task.id}`)}>
                            <TaskCard task={task} />
                          </DraggableCard>
                        </div>
                        
                        {/* 実行者カード */}
                        <div className="flex flex-col items-center space-y-2">
                          {sampleExecutors.filter(exec => exec.task_id === task.id).map((executor) => (
                            <div key={executor.id} id={`mgmt-${executor.id}`}>
                              <DraggableCard id={`mgmt-${executor.id}`} type="executor" persistedPosition={getCardPosition(`mgmt-${executor.id}`)}>
                                <ExecutorCard executor={executor} />
                              </DraggableCard>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </LayerCard>
              </DropZone>
            </div>
          </div>

          <DragOverlay>
            {null}
          </DragOverlay>
        </DndContext>
      </div>
    </ZoomPanCanvas>
  )
}