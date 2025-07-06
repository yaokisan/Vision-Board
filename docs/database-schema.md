# Vision Board データベーススキーマ設計

## ERD (Entity Relationship Diagram)

### 既存エンティティ（組織図管理）
```
companies (会社)
├── positions (経営層: CEO/CTO/CFO)
├── layers (レイヤー: 事業/経営)
│   └── businesses (事業)
│       └── tasks (業務)
│           └── executors (実行者) ※廃止→membersに統合
└── members (新規: メンバー管理)
```

### 新規エンティティ（メンバー管理）
```
members (メンバー基本情報)
├── member_businesses (メンバー⇄事業の関係)
├── member_roles (メンバー⇄組織図役割の関係)
└── audit_logs (変更履歴)
```

## テーブル設計

### 1. companies (会社) - 既存
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. members (メンバー) - 新規
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('admin', 'viewer', 'restricted')),
  member_type TEXT NOT NULL CHECK (member_type IN ('core', 'business')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, email) -- 同一会社内でメール重複防止
);
```

### 3. member_businesses (メンバー⇄事業関係) - 新規
```sql
CREATE TABLE member_businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(member_id, business_id) -- 重複関係防止
);
```

### 4. layers (レイヤー) - 既存拡張
```sql
CREATE TABLE layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('business', 'management')),
  display_tab TEXT, -- タブ別表示制御用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. businesses (事業) - 既存
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  responsible_person_id UUID REFERENCES members(id), -- 責任者をmembersテーブルから参照
  category TEXT,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. tasks (業務) - 既存修正
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  responsible_person_id UUID REFERENCES members(id), -- 責任者をmembersテーブルから参照
  group_name TEXT,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. positions (経営層) - 既存修正
```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('CEO', 'CTO', 'CFO', 'COO')),
  member_id UUID REFERENCES members(id), -- メンバーをmembersテーブルから参照
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. member_roles (メンバー⇄役割関係) - 新規
```sql
CREATE TABLE member_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('position', 'business_manager', 'task_manager')),
  reference_id UUID NOT NULL, -- positions.id, businesses.id, tasks.id のいずれか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(member_id, role_type, reference_id) -- 重複割り当て防止
);
```

### 9. executors (実行者) - 廃止予定
```sql
-- このテーブルは段階的にmembersテーブルに統合
-- マイグレーション時にデータ移行が必要
```

## インデックス設計

```sql
-- 検索パフォーマンス向上
CREATE INDEX idx_members_company_id ON members(company_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_member_businesses_member_id ON member_businesses(member_id);
CREATE INDEX idx_member_businesses_business_id ON member_businesses(business_id);
CREATE INDEX idx_member_roles_member_id ON member_roles(member_id);
CREATE INDEX idx_member_roles_reference ON member_roles(role_type, reference_id);
```

## データ制約とビジネスルール

### 1. メンバータイプルール
- `core`: member_businessesに全事業との関係が自動作成される
- `business`: member_businessesに指定事業との関係のみ作成される

### 2. 権限ルール
- `admin`: 全機能アクセス可能
- `viewer`: 全タブ閲覧可能、編集不可
- `restricted`: 所属事業のみ閲覧可能

### 3. 参照整合性
- メンバー削除時、組織図の役割からも自動除外
- 事業削除時、関連するメンバー関係も削除

## マイグレーション戦略

### Phase 1: 新テーブル作成
1. members テーブル作成
2. member_businesses テーブル作成  
3. member_roles テーブル作成

### Phase 2: 既存テーブル更新
1. positions テーブルにmember_id追加
2. businesses テーブルのresponsible_person更新
3. tasks テーブルのresponsible_person更新

### Phase 3: データ移行
1. executors → members へのデータ移行
2. 文字列参照 → member_id参照への変換

### Phase 4: 旧構造削除
1. executors テーブル削除
2. 旧文字列カラム削除