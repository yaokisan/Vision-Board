export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  company_id: string;
  name: 'CEO' | 'COO';
  person_name: string;
  created_at: string;
  updated_at: string;
}

export interface Layer {
  id: string;
  company_id: string;
  name: string;
  type: 'business' | 'management';
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  layer_id: string;
  name: string;
  goal: string;
  responsible_person: string;
  category?: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  business_id?: string;
  layer_id: string;
  name: string;
  goal: string;
  responsible_person: string;
  group_name?: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface Executor {
  id: string;
  task_id: string;
  name: string;
  role: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export type CardType = 'company' | 'position' | 'layer' | 'business' | 'task' | 'executor';

export interface CardData {
  id: string;
  type: CardType;
  position_x: number;
  position_y: number;
  data: Company | Position | Layer | Business | Task | Executor;
}

export interface DragItem {
  id: string;
  type: CardType;
  position_x: number;
  position_y: number;
}