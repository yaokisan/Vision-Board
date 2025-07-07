-- ============================================
-- Vision Board エッジテーブル作成
-- React Flowのエッジ情報を永続化
-- ============================================

-- Edges テーブル作成
CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    edge_type TEXT DEFAULT 'default',
    style JSONB DEFAULT '{"stroke": "#4c6ef5", "strokeWidth": 2, "strokeDasharray": "2,4"}',
    animated BOOLEAN DEFAULT true,
    deletable BOOLEAN DEFAULT true,
    reconnectable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executors テーブルにbusiness_idカラム追加
ALTER TABLE executors 
ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

-- インデックス作成
CREATE INDEX idx_edges_company_id ON edges(company_id);
CREATE INDEX idx_edges_source_node ON edges(source_node_id);
CREATE INDEX idx_edges_target_node ON edges(target_node_id);
CREATE INDEX idx_executors_business_id ON executors(business_id);

-- RLS有効化
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（認証実装まで一時的に全許可）
CREATE POLICY "Enable all access for authenticated users" ON edges
    FOR ALL USING (true);

-- updated_atトリガー追加
CREATE TRIGGER update_edges_updated_at 
    BEFORE UPDATE ON edges 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE edges IS 'React Flowエッジ情報（ノード間の接続）';
COMMENT ON COLUMN edges.source_node_id IS 'ソースノードID（例: company-uuid, business-uuid）';
COMMENT ON COLUMN edges.target_node_id IS 'ターゲットノードID（例: task-uuid, executor-uuid）';
COMMENT ON COLUMN edges.edge_type IS 'エッジタイプ（default, custom等）';
COMMENT ON COLUMN edges.style IS 'エッジスタイル情報（JSON）';
COMMENT ON COLUMN executors.business_id IS '所属事業ID（エッジ継承用）';