# 🔄 business_id統合プロジェクト引き継ぎ書

## 📊 現在の進捗状況

### ✅ 完了済み（Phase 1-2）
- **Phase 1**: 統合前テスト・方針確定 ✅
- **Phase 2**: バックエンド統合 ✅ (コミット: `f81edcc`)

### 🚧 進行中（Phase 3）
- **EditNodeModal更新**: 部分完了（Task編集に所属事業選択追加済み）

### ⏳ 未完了（Phase 3-5）
- **Phase 3**: UI統合の残り
- **Phase 4**: データベース統合
- **Phase 5**: 最終検証

## 🎯 統合の全体目標

**attributeとbusiness_idの概念重複を解消し、business_id一本化でシンプルな設計にする。**

### 現在の問題:
```typescript
// 概念の重複
Task {
  business_id: "事業ID",  // データ上の所属
  attribute: "事業ID"     // 表示制御用（重複！）
}
```

### 統合後の理想:
```typescript
// 単一の責任
Task {
  business_id: "事業ID"   // 所属・表示制御両方を担当
}
```

## 📋 残り作業の詳細

## Phase 3: UI統合の残り作業

### 3.1 EditNodeModal更新（進行中）

**ファイル**: `/src/components/flow/EditNodeModal.tsx`

**現状**: Task編集時の所属事業選択フィールド追加済み（312-330行目）

**残り作業**:

#### A) 保存処理でbusiness_idを送信するよう更新
```typescript
// 現在のhandleSubmit処理を以下のように修正が必要:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // formDataにbusiness_idが含まれるようになったので
  // nodeDataService.updateNode()でbusiness_idも送信する
  
  // 特にTaskノードの場合:
  if (nodeData.type === NodeType.TASK) {
    // business_idの妥当性チェック
    // 保存時にbusiness_idとattributeの両方を送信（移行期間中）
  }
}
```

#### B) フォームバリデーション強化
```typescript
// Task編集時: business_idが必須
// 「会社直属」選択時: business_id = null
// 事業選択時: business_id = 選択された事業ID
```

### 3.2 getCurrentAttribute更新

**ファイル**: `/src/components/flow/OrganizationFlowBoard.tsx`

**更新箇所**: 274-281行目

**現在のコード**:
```typescript
const getCurrentAttribute = () => {
  if (viewMode === 'business' && selectedBusinessId) {
    return selectedBusinessId
  }
  return 'company'
}
```

**必要な更新**:
```typescript
// 1. リネーム: getCurrentAttribute → getCurrentBusinessId
const getCurrentBusinessId = () => {
  if (viewMode === 'business' && selectedBusinessId) {
    return selectedBusinessId // 事業IDを返す
  }
  return null // 会社レベルはnull
}

// 2. ノード作成時の自動設定更新 (291-293行目付近)
const currentBusinessId = getCurrentBusinessId()
finalData.business_id = finalData.business_id || currentBusinessId
// finalData.attribute は移行期間中も並行設定（後で削除）
```

### 3.3 InlineCardModal更新

**ファイル**: `/src/components/flow/InlineCardModal.tsx` (存在確認要)

**更新内容**:
- Task作成時にbusiness_id自動設定
- 親ノードからのbusiness_id継承ロジック更新
- attribute設定との並行運用

## Phase 4: データベース統合

### 4.1 現在のデータ状況（確認済み）

**データ品質**: ✅ 良好
- 総業務数: 10個
- 既に整合: 7個 
- company属性だが事業所属: 3個 ← **要修正**
- 孤立ノード: 0個
- 無効参照: 0個

**問題のあるデータ**:
```sql
-- 3つの「新しい業務」
-- 現在: attribute='company', business_id='新しい事業'
-- 問題: 表示は会社タブだが、実際は事業に所属
```

### 4.2 データ移行スクリプト実行

**実行すべきSQL**:
```sql
-- Step 1: 不整合データの修正
UPDATE tasks 
SET attribute = business_id::text
WHERE attribute = 'company' 
  AND business_id IS NOT NULL;

-- Step 2: 整合性確認
SELECT 
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN attribute = business_id::text THEN 1 END) as matching,
  COUNT(CASE WHEN attribute = 'company' AND business_id IS NULL THEN 1 END) as company_tasks
FROM tasks;
-- 期待結果: total_tasks=10, matching=10, company_tasks=0
```

### 4.3 カラム削除

**実行順序** (UI完全移行後):
```sql
-- Phase 4.3.1: テーブルからattributeカラム削除
ALTER TABLE tasks DROP COLUMN attribute;
ALTER TABLE executors DROP COLUMN attribute;  
ALTER TABLE positions DROP COLUMN attribute;
ALTER TABLE businesses DROP COLUMN attribute;
ALTER TABLE layers DROP COLUMN attribute;

-- Phase 4.3.2: 型定義からattribute削除
-- ファイル: /src/types/index.ts
-- ファイル: /src/types/flow.ts
-- 各interfaceからattribute?: stringを削除
```

## Phase 5: 最終検証

### 5.1 機能テスト

**必須テスト項目**:

#### A) ノード表示テスト
- [ ] 全ノードタイプ（Company, CXO, Business, Task, Executor）の表示確認
- [ ] タブ切り替え動作確認
- [ ] business_id=nullノードは会社タブのみ表示
- [ ] 事業ノードは対応する事業タブで表示

#### B) 編集・作成テスト  
- [ ] Task編集: 所属事業選択が正常動作
- [ ] Task作成: 自動business_id設定が動作
- [ ] Executor作成: 親Taskのbusiness_id継承
- [ ] Business編集: business_id=自分自身のID

#### C) エッジテスト
- [ ] エッジ作成・削除の動作確認
- [ ] 表示制御への影響なし
- [ ] エッジ削除の永続化動作

### 5.2 データ整合性テスト

**実行すべき検証SQL**:
```sql
-- 最終整合性チェック
SELECT 'Final Integration Validation' as test_name;

-- 1. 全業務がbusiness_idベースで正しく分類されているか
SELECT 
  CASE 
    WHEN business_id IS NULL THEN 'Company Level'
    ELSE b.name
  END as display_category,
  COUNT(*) as task_count
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
GROUP BY business_id, b.name
ORDER BY task_count DESC;

-- 2. 孤立ノードがないか
SELECT 'Orphaned nodes check' as check_item, COUNT(*) as count
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.business_id IS NOT NULL AND b.id IS NULL;
```

### 5.3 パフォーマンステスト

**確認項目**:
- [ ] ページロード時間 (< 3秒)
- [ ] タブ切り替え応答性 (< 500ms)
- [ ] ノード大量表示時の性能 (10+ ノード)
- [ ] メモリ使用量の増加なし

## 🔧 重要な技術情報

### 統合済み機能（Phase 2完了）

**shouldShowContainer** (`/src/lib/flow/dataConverter.ts` 9-28行目):
```typescript
// ✅ 完了: business_id優先、attributeフォールバック
static shouldShowContainer(
  container: { business_id?: string | null; attribute?: string },
  currentTab: 'company' | string
): boolean {
  if (currentTab === 'company') return true
  
  const containerBusinessId = container.business_id || container.attribute
  if (!containerBusinessId || containerBusinessId === 'company') {
    return currentTab === 'company'
  }
  return containerBusinessId === currentTab
}
```

**ノードデータ構造** (`/src/lib/flow/dataConverter.ts`):
```typescript
// ✅ 完了: 全ノードでbusiness_id設定済み
// Task: business_id = task.business_id
// Business: business_id = business.id  
// Executor: business_id = task.business_id
```

### 統合対象ファイル一覧

**Phase 2完了**:
- ✅ `/src/lib/flow/dataConverter.ts` - 表示制御統合済み
- ✅ `/src/lib/services/nodeDataService.ts` - 保存処理統合済み
- ✅ `/src/types/flow.ts` - FlowNode型にbusiness_id追加済み

**Phase 3対象**:
- 🚧 `/src/components/flow/EditNodeModal.tsx` - Task編集UI部分完了
- ⏳ `/src/components/flow/OrganizationFlowBoard.tsx` - getCurrentAttribute更新要
- ⏳ `/src/components/flow/InlineCardModal.tsx` - 存在確認・更新要

**Phase 4対象**:
- ⏳ データベース: 3レコードのattribute修正
- ⏳ `/src/types/index.ts` - attribute削除

### データ移行戦略

**段階的アプローチ**:
1. **UI完全移行** → business_idメイン、attributeサブ
2. **データ整合** → 不整合3レコード修正  
3. **attribute削除** → カラム・型定義クリーンアップ

**フォールバック戦略**:
```typescript
// 移行期間中の安全な参照方法
const effectiveBusinessId = node.business_id || node.attribute
```

## 📁 関連ファイル・ドキュメント

### 作成済み分析・テストファイル

**統合分析**:
- `/sql/integration/pre_integration_validation.sql` - 統合前検証
- `/sql/integration/integration_impact_analysis.sql` - 影響分析
- `/docs/integration/business_id_integration_overview.md` - 統合概要図

**TDD移行履歴**:
- `/sql/tests/pre_migration_validation.sql` - 移行前テスト
- `/sql/tests/post_migration_validation.sql` - 移行後テスト  
- `/sql/migration/` - 各種移行スクリプト

### 重要なコミット履歴

- `08ca22d`: TDD移行完了 (Option A → Option B)
- `f81edcc`: Phase 2バックエンド統合完了

## ⚠️ 注意事項・リスク

### 1. データ整合性リスク

**中リスク**: 3つの「新しい業務」の不整合
- **影響**: 会社タブに表示されるが、実際は事業所属
- **対策**: Phase 4.2のSQL実行で解決

### 2. UI移行リスク

**低リスク**: attribute参照の削除漏れ
- **影響**: 表示制御エラー、白画面
- **対策**: 段階的移行、フォールバック機能

### 3. パフォーマンスリスク

**低リスク**: business_id参照追加によるクエリ負荷
- **影響**: 表示速度低下
- **対策**: 既存のbusiness_id使用のため影響軽微

## 🚀 次回作業時の開始手順

### 1. 状況確認
```bash
# リポジトリ状態確認
git status
git log --oneline -5

# 開発サーバー起動
npm run dev
```

### 2. 現在の編集状況確認
```bash
# EditNodeModal の編集状況確認
git diff src/components/flow/EditNodeModal.tsx
```

### 3. Phase 3続行
- EditNodeModal の handleSubmit 処理更新
- OrganizationFlowBoard の getCurrentAttribute 更新
- ビルド・テスト・コミット

## ✅ 最終確認チェックリスト

### Phase 3完了時:
- [ ] Task編集でbusiness_id選択が動作
- [ ] Task作成でbusiness_id自動設定が動作  
- [ ] ビルドエラーなし
- [ ] UIテスト成功

### Phase 4完了時:
- [ ] データ移行SQL実行済み
- [ ] attribute-business_id整合性100%
- [ ] UIでattribute参照削除
- [ ] 型定義からattribute削除

### Phase 5完了時:
- [ ] 全機能動作確認
- [ ] パフォーマンステスト通過
- [ ] ドキュメント更新
- [ ] 最終コミット・タグ付け

---

**この引き継ぎ書に従い、慎重に段階的進行でbusiness_id統合を完了してください。**

**重要**: 各Phase完了時は必ずテスト・コミットを行い、問題発生時のロールバック手段を確保してください。