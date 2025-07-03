'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Company, Position, Layer, Business, Task, Executor } from '@/types'
import { 
  CompanyCard, 
  PositionCard, 
  LayerCard, 
  BusinessCard, 
  TaskCard, 
  ExecutorCard 
} from '@/components/cards'
import DraggableCard from './DraggableCard'
import DropZone from './DropZone'

export default function OrganizationBoard() {
  const [activeId, setActiveId] = useState<string | null>(null)

  // サンプルデータ
  const sampleCompany: Company = {
    id: '1',
    name: 'Empire Art',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const samplePositions: Position[] = [
    {
      id: '2',
      company_id: '1',
      name: 'CEO',
      person_name: '田中太郎',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      company_id: '1',
      name: 'COO',
      person_name: '佐藤花子',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

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
    setActiveId(null)
    
    const { active, over } = event
    
    if (!over) return
    
    console.log('Dragged', active.id, 'to', over.id)
    // ここで実際の位置更新処理を実装
  }

  return (
    <div className="p-6">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-8">
          {/* 会社カード */}
          <div className="flex justify-center">
            <DraggableCard id="company-1" type="company">
              <CompanyCard company={sampleCompany} />
            </DraggableCard>
          </div>

          {/* 役職カード */}
          <div className="flex justify-center gap-8">
            {samplePositions.map((position) => (
              <DraggableCard key={position.id} id={position.id} type="position">
                <PositionCard position={position} />
              </DraggableCard>
            ))}
          </div>

          {/* レイヤーカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sampleLayers.map((layer) => (
              <DropZone 
                key={layer.id} 
                id={layer.id} 
                acceptTypes={['business', 'task']}
                className="min-h-[300px]"
              >
                <LayerCard layer={layer}>
                  {layer.type === 'business' && (
                    <div className="space-y-4">
                      {sampleBusinesses.map((business) => (
                        <DraggableCard key={business.id} id={business.id} type="business">
                          <BusinessCard business={business} />
                        </DraggableCard>
                      ))}
                      {sampleTasks.map((task) => (
                        <div key={task.id} className="space-y-2">
                          <DraggableCard id={task.id} type="task">
                            <TaskCard task={task} />
                          </DraggableCard>
                          {sampleExecutors.map((executor) => (
                            <DraggableCard key={executor.id} id={executor.id} type="executor" className="ml-4">
                              <ExecutorCard executor={executor} />
                            </DraggableCard>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </LayerCard>
              </DropZone>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="card-base opacity-80">
              ドラッグ中...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}