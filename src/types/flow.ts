// React Flow用の型定義
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
export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    // 既存のデータ構造を活用
    entity: Company | Position | Layer | Business | Task | Executor;
    // 追加のメタデータ
    label: string;
    color?: string;
    size?: { width: number; height: number };
    // レイヤー特有の属性
    layer?: {
      type: 'business' | 'management';
      containerSize: { width: number; height: number };
    };
    // CXO特有の属性
    ceoName?: string;
  };
  // React Flow固有の属性
  draggable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  parentNode?: string; // レイヤーカード内のノード用
  extent?: 'parent' | [[number, number], [number, number]]; // 移動制限
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
  edges: FlowEdge[];
}