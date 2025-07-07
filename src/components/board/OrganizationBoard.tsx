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
import ResizableContainer from './ResizableContainer'

export default function OrganizationBoard() {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // カード位置の状態管理
  const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({})
  
  // 接続線強制更新用
  const [connectionUpdateTrigger, setConnectionUpdateTrigger] = useState(0)
  
  // レイヤーコンテナの状態管理
  const [layerContainers, setLayerContainers] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({
    'business-layer': { x: 500, y: 400, width: 450, height: 500 },
    'management-layer': { x: 1050, y: 400, width: 450, height: 500 }
  })
  
  // カード位置を取得する関数
  const getCardPosition = (cardId: string) => {
    return cardPositions[cardId] || { x: 0, y: 0 }
  }

  // レイヤーコンテナの位置変更ハンドラー
  const handleLayerPositionChange = (id: string, x: number, y: number) => {
    setLayerContainers(prev => ({
      ...prev,
      [id]: { ...prev[id], x, y }
    }))
  }

  // レイヤーコンテナのサイズ変更ハンドラー
  const handleLayerSizeChange = (id: string, width: number, height: number) => {
    setLayerContainers(prev => ({
      ...prev,
      [id]: { ...prev[id], width, height }
    }))
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
      company_id: '1',
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
    const { active, delta, over } = event
    const draggedId = active.id as string
    
    setActiveId(null)
    
    if (!delta) return
    
    // カードの種類を判定
    const cardType = active.data.current?.type
    
    // CXOカードや会社カードは常に位置を更新
    if (cardType === 'company' || cardType === 'position') {
      const newPosition = {
        x: (cardPositions[draggedId]?.x || 0) + delta.x,
        y: (cardPositions[draggedId]?.y || 0) + delta.y
      }
      
      setCardPositions(prev => ({
        ...prev,
        [draggedId]: newPosition
      }))
      
      // 接続線を強制更新
      setConnectionUpdateTrigger(prev => prev + 1)
    }
    // レイヤー内のカード（business, task, executor）はドロップゾーン内でのみ位置を更新
    else if (over && (over.id === 'business-layer-drop' || over.id === 'management-layer-drop')) {
      const newPosition = {
        x: (cardPositions[draggedId]?.x || 0) + delta.x,
        y: (cardPositions[draggedId]?.y || 0) + delta.y
      }
      
      setCardPositions(prev => ({
        ...prev,
        [draggedId]: newPosition
      }))
      
      // 接続線を強制更新
      setConnectionUpdateTrigger(prev => prev + 1)
    }
    // レイヤー内カードがドロップゾーン外にドラッグされた場合は位置を保存しない（元に戻る）
  }

  return (
    <ZoomPanCanvas>
      <div className="p-8 min-w-[2000px] min-h-[1500px]">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="relative">
            {/* 統合接続線コンテナ - キャンバス変形内に配置 */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10, overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <ConnectionLine startElementId="draggable-company-1" endElementId="draggable-cto-card" forceUpdate={connectionUpdateTrigger} />
              <ConnectionLine startElementId="draggable-company-1" endElementId="draggable-cfo-card" forceUpdate={connectionUpdateTrigger} />
              <ConnectionLine startElementId="draggable-cto-card" endElementId="draggable-6" forceUpdate={connectionUpdateTrigger} />
              <ConnectionLine startElementId="draggable-6" endElementId="draggable-7" forceUpdate={connectionUpdateTrigger} />
              <ConnectionLine startElementId="draggable-7" endElementId="draggable-8" forceUpdate={connectionUpdateTrigger} />
            </svg>
            
            {/* 会社カード */}
            <div className="flex justify-center mb-12">
              <div id="company-1">
                <DraggableCard id="company-1" type="company" persistedPosition={getCardPosition('company-1')}>
                  <CompanyCard company={sampleCompany} ceoName="田中太郎" />
                </DraggableCard>
              </div>
            </div>

            {/* CXOスペース（オプション） */}
            <div className="flex justify-center gap-8">
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
            {/* 事業レイヤー */}
            <ResizableContainer
              id="business-layer"
              title="事業レイヤー"
              initialX={layerContainers['business-layer'].x}
              initialY={layerContainers['business-layer'].y}
              initialWidth={layerContainers['business-layer'].width}
              initialHeight={layerContainers['business-layer'].height}
              onPositionChange={handleLayerPositionChange}
              onSizeChange={handleLayerSizeChange}
            >
              <DropZone 
                id="business-layer-drop" 
                acceptTypes={['business', 'task', 'executor']}
                className="w-full h-full"
              >
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
              </DropZone>
            </ResizableContainer>

            {/* 経営レイヤー */}
            <ResizableContainer
              id="management-layer"
              title="経営レイヤー"
              initialX={layerContainers['management-layer'].x}
              initialY={layerContainers['management-layer'].y}
              initialWidth={layerContainers['management-layer'].width}
              initialHeight={layerContainers['management-layer'].height}
              onPositionChange={handleLayerPositionChange}
              onSizeChange={handleLayerSizeChange}
            >
              <DropZone 
                id="management-layer-drop" 
                acceptTypes={['task', 'executor']}
                className="w-full h-full"
              >
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
              </DropZone>
            </ResizableContainer>
          </div>

          <DragOverlay>
            {null}
          </DragOverlay>
        </DndContext>
      </div>
    </ZoomPanCanvas>
  )
}