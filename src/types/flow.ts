// React Flow用の型定義
import { Node, Edge } from '@xyflow/react'
import { Company, Position, Layer, Business, Task, Executor } from './index'

// React Flow用ノードタイプ
export enum NodeType {
  COMPANY = 'company',
  POSITION = 'position',
  CXO = 'cxo',
  CXO_LAYER = 'cxo_layer',
  BUSINESS_LAYER = 'business_layer',
  BUSINESS = 'business',
  TASK = 'task',
  EXECUTOR = 'executor'
}

// React Flow用エッジタイプ
export enum EdgeType {
  HIERARCHY = 'hierarchy',
  MANAGEMENT = 'management',
  EXECUTION = 'execution'
}

// React Flow用ノード構造
export interface FlowNode extends Node {
  type: NodeType;
  data: {
    // 既存のデータ構造を活用
    entity: Company | Position | Layer | Business | Task | Executor | any;
    // 追加のメタデータ
    label: string;
    color?: string;
    size?: { width: number; height: number };
    // レイヤー特有の属性
    type?: 'business' | 'management';
    containerSize?: { width: number; height: number };
    description?: string;
    // business_id統合完了: ノード所属・表示制御の統一識別子
    business_id?: string | null;
    // CXO特有の属性
    ceoName?: string;
  };
  parentNode?: string;
}

// React Flow用エッジ構造
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  data?: {
    label?: string;
    color?: string;
    animated?: boolean;
    strokeWidth?: number;
  };
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  animated?: boolean;
  markerEnd?: {
    type: 'arrow' | 'arrowclosed';
    color?: string;
  };
}

// React Flow統合用の組織図データ
export interface OrganizationFlowData {
  nodes: FlowNode[];
  edges: Edge[];
}