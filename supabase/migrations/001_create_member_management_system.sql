-- ============================================
-- Vision Board メンバー管理システム
-- 初期マイグレーション
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 基本テーブル作成
-- ============================================

-- Companies テーブル
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Layers テーブル
CREATE TABLE layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('business', 'management')),
    display_tab TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses テーブル
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    responsible_person_id UUID, -- 後でメンバーテーブル作成後に外部キー追加
    responsible_person TEXT, -- 後方互換性用（将来廃止）
    category TEXT,
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks テーブル
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    responsible_person_id UUID, -- 後でメンバーテーブル作成後に外部キー追加
    responsible_person TEXT, -- 後方互換性用（将来廃止）
    group_name TEXT,
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. メンバー管理システム
-- ============================================

-- Members テーブル（メンバー基本情報）
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    permission TEXT NOT NULL CHECK (permission IN ('admin', 'viewer', 'restricted')),
    member_type TEXT NOT NULL CHECK (member_type IN ('core', 'business')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_email_per_company UNIQUE(company_id, email)
);

-- Member_Businesses テーブル（メンバー⇄事業の多対多関係）
CREATE TABLE member_businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_member_business UNIQUE(member_id, business_id)
);

-- Member_Roles テーブル（メンバー⇄組織図役割の関係）
CREATE TABLE member_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('position', 'business_manager', 'task_manager')),
    reference_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_member_role UNIQUE(member_id, role_type, reference_id)
);

-- Positions テーブル（経営層）
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (name IN ('CEO', 'CTO', 'CFO', 'COO')),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    person_name TEXT, -- 後方互換性用（将来廃止）
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executors テーブル（将来的に廃止予定、段階的移行用）
CREATE TABLE executors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 外部キー制約の追加
-- ============================================

-- Businesses テーブルの責任者参照を追加
ALTER TABLE businesses 
ADD CONSTRAINT fk_businesses_responsible_person 
FOREIGN KEY (responsible_person_id) REFERENCES members(id) ON DELETE SET NULL;

-- Tasks テーブルの責任者参照を追加
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_responsible_person 
FOREIGN KEY (responsible_person_id) REFERENCES members(id) ON DELETE SET NULL;

-- ============================================
-- 4. インデックス作成
-- ============================================

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_members_company_id ON members(company_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_permission ON members(permission);
CREATE INDEX idx_members_type ON members(member_type);

CREATE INDEX idx_member_businesses_member_id ON member_businesses(member_id);
CREATE INDEX idx_member_businesses_business_id ON member_businesses(business_id);

CREATE INDEX idx_member_roles_member_id ON member_roles(member_id);
CREATE INDEX idx_member_roles_reference ON member_roles(role_type, reference_id);

CREATE INDEX idx_businesses_layer_id ON businesses(layer_id);
CREATE INDEX idx_businesses_responsible_person_id ON businesses(responsible_person_id);

CREATE INDEX idx_tasks_business_id ON tasks(business_id);
CREATE INDEX idx_tasks_layer_id ON tasks(layer_id);
CREATE INDEX idx_tasks_responsible_person_id ON tasks(responsible_person_id);

CREATE INDEX idx_positions_company_id ON positions(company_id);
CREATE INDEX idx_positions_member_id ON positions(member_id);

-- ============================================
-- 5. トリガー関数（updated_at自動更新）
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにupdated_at自動更新トリガーを設定
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_layers_updated_at 
    BEFORE UPDATE ON layers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON businesses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executors_updated_at 
    BEFORE UPDATE ON executors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Row Level Security (RLS) 設定
-- ============================================

-- RLSを有効化（将来の認証連携用）
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE executors ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（認証実装まで一時的に全許可）
CREATE POLICY "Enable all access for authenticated users" ON companies
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON members
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON member_businesses
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON member_roles
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON layers
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON businesses
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON tasks
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON positions
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON executors
    FOR ALL USING (true);

-- ============================================
-- 7. サンプルデータ挿入（開発用）
-- ============================================

-- サンプル会社
INSERT INTO companies (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Empire Art');

-- サンプルレイヤー
INSERT INTO layers (id, company_id, name, type, display_tab) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '事業', 'business', 'company'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Webサービス事業', 'business', '1'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'コンサルティング事業', 'business', '2');

-- サンプル事業
INSERT INTO businesses (id, layer_id, name, goal, responsible_person, category, position_x, position_y) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Webサービス事業', 'ユーザー数100万人達成', '田中太郎', 'デジタル', 100, 400),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'コンサルティング事業', '売上前年比150%', '佐藤花子', 'サービス', 400, 400);

-- サンプルメンバー
INSERT INTO members (id, company_id, name, email, permission, member_type) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '田中太郎', 'tanaka@empire-art.com', 'admin', 'core'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '佐藤花子', 'sato@empire-art.com', 'admin', 'core'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '鈴木一郎', 'suzuki@empire-art.com', 'viewer', 'core'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', '山田太郎', 'yamada@empire-art.com', 'restricted', 'business'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440000', '田中花子', 'hanako@empire-art.com', 'restricted', 'business');

-- サンプル経営陣
INSERT INTO positions (id, company_id, name, member_id, person_name) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'CEO', '550e8400-e29b-41d4-a716-446655440020', '田中太郎'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'CTO', '550e8400-e29b-41d4-a716-446655440021', '佐藤花子'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'CFO', '550e8400-e29b-41d4-a716-446655440022', '鈴木一郎');

-- コアメンバーは全事業に自動追加
INSERT INTO member_businesses (member_id, business_id) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011'),
-- 事業メンバーは特定事業のみ
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440011');

-- ============================================
-- 8. コメント追加
-- ============================================

COMMENT ON TABLE companies IS '会社情報';
COMMENT ON TABLE members IS 'メンバー基本情報';
COMMENT ON TABLE member_businesses IS 'メンバーと事業の多対多関係';
COMMENT ON TABLE member_roles IS 'メンバーと組織図役割の関係';
COMMENT ON TABLE layers IS 'レイヤー（事業/経営の分類）';
COMMENT ON TABLE businesses IS '事業情報';
COMMENT ON TABLE tasks IS '業務情報';
COMMENT ON TABLE positions IS '経営層の役職';
COMMENT ON TABLE executors IS '実行者（廃止予定）';

COMMENT ON COLUMN members.permission IS '権限: admin=管理者, viewer=閲覧者, restricted=制限ユーザー';
COMMENT ON COLUMN members.member_type IS 'タイプ: core=コアメンバー, business=事業メンバー';
COMMENT ON COLUMN member_roles.role_type IS '役割タイプ: position=経営層, business_manager=事業責任者, task_manager=業務責任者';
COMMENT ON COLUMN member_roles.reference_id IS '参照先ID（positions.id, businesses.id, tasks.idのいずれか）';