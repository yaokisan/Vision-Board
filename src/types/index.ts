export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  company_id: string;
  name: 'CEO' | 'COO' | 'CTO' | 'CFO';
  member_id?: string; // メンバーテーブルへの参照（新構造）
  person_name: string; // 後方互換性のため残す（将来廃止予定）
  position_x?: number;
  position_y?: number;
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
  displayTab?: string; // タブ別表示制御用（'company' | 事業ID）
}

export interface Business {
  id: string;
  layer_id: string;
  name: string;
  goal: string;
  responsible_person_id?: string; // メンバーテーブルへの参照（新構造）
  responsible_person: string; // 後方互換性のため残す（将来廃止予定）
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
  responsible_person_id?: string; // メンバーテーブルへの参照（新構造）
  responsible_person: string; // 後方互換性のため残す（将来廃止予定）
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

// ============================================
// メンバー管理システムの型定義
// ============================================

/** メンバーの権限レベル */
export type MemberPermission = 'admin' | 'viewer' | 'restricted';

/** メンバーのタイプ */
export type MemberType = 'core' | 'business';

/** 組織図での役割タイプ */
export type RoleType = 'position' | 'business_manager' | 'task_manager';

/** メンバー基本情報 */
export interface Member {
  id: string;
  company_id: string;
  name: string;
  email: string;
  permission: MemberPermission;
  member_type: MemberType;
  created_at: string;
  updated_at: string;
}

/** メンバーと事業の関係 */
export interface MemberBusiness {
  id: string;
  member_id: string;
  business_id: string;
  created_at: string;
}

/** メンバーと組織図役割の関係 */
export interface MemberRole {
  id: string;
  member_id: string;
  role_type: RoleType;
  reference_id: string; // positions.id, businesses.id, tasks.id のいずれか
  created_at: string;
}

/** メンバー作成時のリクエスト */
export interface CreateMemberRequest {
  name: string;
  email: string;
  permission: MemberPermission;
  member_type: MemberType;
  business_ids?: string[]; // 事業メンバーの場合に指定
}

/** メンバー更新時のリクエスト */
export interface UpdateMemberRequest {
  name?: string;
  email?: string;
  permission?: MemberPermission;
  member_type?: MemberType;
  business_ids?: string[]; // 所属事業の変更
}

/** メンバー削除時の警告情報 */
export interface MemberDeletionWarning {
  hasOrganizationRoles: boolean;
  affectedRoles: Array<{
    role_type: RoleType;
    reference_name: string; // 事業名、業務名など
  }>;
}

/** 事業用のメンバーリスト（組織図編集用） */
export interface BusinessMemberList {
  business_id: string;
  core_members: Member[]; // コアメンバー（自動で含まれる）
  business_members: Member[]; // その事業専用メンバー
}

/** 権限チェック結果 */
export interface PermissionCheck {
  can_manage_members: boolean;
  can_view_all_tabs: boolean;
  can_view_member_page: boolean;
  can_edit_organization: boolean;
  accessible_business_ids: string[];
}

/** メンバー管理のサービス操作結果 */
export interface MemberOperationResult {
  success: boolean;
  member?: Member;
  warning?: MemberDeletionWarning;
  assigned_businesses?: string[];
  requires_reload?: boolean;
}

/** 設定ページ用のメンバー一覧データ */
export interface MemberListData {
  core_members: Member[];
  business_members: Array<{
    business_id: string;
    business_name: string;
    members: Member[];
  }>;
}

export type CardType = 'company' | 'position' | 'layer' | 'business' | 'task' | 'executor' | 'member';

export interface CardData {
  id: string;
  type: CardType;
  position_x: number;
  position_y: number;
  data: Company | Position | Layer | Business | Task | Executor | Member;
}

export interface DragItem {
  id: string;
  type: CardType;
  position_x: number;
  position_y: number;
}