# 🔗 エッジ操作永続化プロジェクト引き継ぎ書

## 📊 現在の進捗状況

### ✅ 完了済み
- **要件定義**: エッジ削除・再接続・作成の包括的要件定義完了
- **現状分析**: 既存エッジ処理コードの詳細調査完了
- **EdgeImpactService作成**: エッジ影響分析サービス実装完了
- **NodeDataService更新**: 一部エッジメソッドの影響分析統合完了

### 🚧 進行中
- **OrganizationFlowBoard更新**: エッジ削除処理の影響分析統合（部分完了）

### ⏳ 未完了
- **OrganizationFlowBoard完全統合**: エッジ作成・再接続処理の統合
- **データリロード最適化**: 影響分析後の効率的なUI更新
- **エラーハンドリング強化**: 失敗時のロールバック処理
- **包括的テスト**: 全エッジ操作シナリオのテスト

## 🎯 プロジェクトの全体目標

**エッジ操作の永続化とbusiness_id整合性の確保**

### 現在の問題:
```typescript
// 問題1: エッジ削除が永続化されない
ユーザー操作: 事業→業務エッジを削除
現在の結果: UI上は削除されるが、リロードすると復活
期待する結果: 削除が永続化され、業務がbusiness_id=nullになる

// 問題2: business_id継承が不完全
ユーザー操作: 業務を別事業に接続
現在の結果: エッジは作成されるが、business_idは変更されない
期待する結果: 業務のbusiness_idが新しい事業IDに更新される
```

### 統合後の理想:
```typescript
// エッジ削除: 階層関係の切断とbusiness_idリセット
削除前: 事業A → 業務X (business_id = 事業A)
削除後: 業務X (business_id = null, 会社タブに表示)

// エッジ作成: 新しい階層関係とbusiness_id継承
作成前: 業務X (business_id = null)
作成後: 事業B → 業務X (business_id = 事業B, 事業Bタブに表示)

// カスケード更新: 子孫ノードへの影響伝播
業務移動: 業務X: 事業A → 事業B
影響: 実行者Y,Z (業務Xの子): business_id = 事業A → 事業B
```

## 📋 詳細要件定義

### 1. エッジ操作の種類と要件

#### A) エッジ削除操作
**トリガー**: ユーザーがエッジを選択してDeleteキー押下
**処理フロー**:
1. エッジ情報取得（source_node_id, target_node_id）
2. エッジレコードの削除
3. ターゲットノードのbusiness_id → null
4. ターゲットノードの子孫ノードのbusiness_id → null（再帰的）
5. React Flow状態更新
6. データリロード（表示タブ反映）

#### B) エッジ作成操作
**トリガー**: ユーザーがノード間をドラッグしてエッジ作成
**処理フロー**:
1. エッジレコードの作成
2. ソースノードのbusiness_id取得
3. ターゲットノードのbusiness_id更新
4. ターゲットノードの子孫ノードのbusiness_id更新（再帰的）
5. React Flow状態更新
6. データリロード（表示タブ反映）

#### C) エッジ再接続操作
**トリガー**: ユーザーがエッジの端点をドラッグして別ノードに接続
**処理フロー**:
1. 古いエッジ情報取得
2. エッジレコードの更新
3. 古いターゲットノードのbusiness_id → null（+ 子孫リセット）
4. 新しいターゲットノードのbusiness_id更新（+ 子孫更新）
5. React Flow状態更新
6. データリロード（表示タブ反映）

### 2. カスケード更新の仕様

#### 影響伝播のルール
```
直接影響: エッジで直接接続されたターゲットノード
間接影響: ターゲットノードの子孫ノード（再帰的に全階層）

例: 事業A → 業務X → 実行者Y,Z
業務Xを事業Bに移動した場合:
- 業務X: business_id = 事業A → 事業B
- 実行者Y: business_id = 事業A → 事業B  
- 実行者Z: business_id = 事業A → 事業B
```

#### business_id決定のルール
```typescript
会社ノード: business_id = null
CXOノード: business_id = null
事業ノード: business_id = 自分のID
業務ノード: business_id = 親事業のID
実行者ノード: business_id = 所属業務の事業ID
```

## 🔧 技術実装詳細

### 完了済みファイル

#### 1. EdgeImpactService (`/src/lib/services/edgeImpactService.ts`)
**役割**: エッジ操作による影響分析と一括更新処理

**主要メソッド**:
```typescript
// エッジ削除時の影響処理
static async handleEdgeDeletion(edgeId: string, sourceNodeId: string, targetNodeId: string)

// エッジ作成時の影響処理  
static async handleEdgeCreation(sourceNodeId: string, targetNodeId: string)

// エッジ再接続時の影響処理
static async handleEdgeReconnection(oldTargetNodeId: string, newSourceNodeId: string, newTargetNodeId: string)
```

**実装済み機能**:
- ✅ ノードのbusiness_id取得・更新
- ✅ 子孫ノードの再帰的検索
- ✅ カスケード更新処理
- ✅ エラーハンドリング

#### 2. NodeDataService更新 (`/src/lib/services/nodeDataService.ts`)
**変更内容**: エッジ関連メソッドに影響分析を統合

**更新済みメソッド**:
```typescript
// エッジ保存（影響分析付き）
static async saveEdge() // ✅ 完了

// エッジ削除（影響分析付き）
static async deleteEdge() // ✅ 完了

// エッジ更新（影響分析付き） 
static async updateEdge() // ✅ 完了
```

### 進行中ファイル

#### 3. OrganizationFlowBoard (`/src/components/flow/OrganizationFlowBoard.tsx`)

**✅ 完了済み処理**:
- `onEdgesDelete`: エッジ削除処理の影響分析統合 + データリロード

**⏳ 未完了処理**:
- `onConnect`: エッジ作成処理の影響分析対応 + データリロード
- `onReconnect`: エッジ再接続処理の影響分析対応 + データリロード

## 📋 残り作業の詳細

### Task 1: OrganizationFlowBoard完全統合

#### 1.1 onConnect処理の更新
**ファイル**: `/src/components/flow/OrganizationFlowBoard.tsx` (約200行目)

**現在のコード**:
```typescript
const onConnect = useCallback(async (params: Connection) => {
  // ... エッジ保存処理
  
  // データベース保存成功後、React Flow状態を更新
  setEdges((eds) => addEdge({
    ...params,
    id: saveResult.edgeId!,
    // ...
  }, eds))
}, [setEdges, currentUser.company_id])
```

**必要な修正**:
```typescript
const onConnect = useCallback(async (params: Connection) => {
  // ... 既存のエッジ保存処理（影響分析は既にNodeDataServiceで実行済み）
  
  // React Flow状態更新 + データリロード追加
  setEdges((eds) => addEdge({...}, eds))
  
  // 🔄 追加: business_id変更による影響をリアルタイム反映
  await reloadData()
  console.log('🔄 Data reloaded after edge creation')
}, [setEdges, currentUser.company_id, reloadData]) // reloadDataを依存関係に追加
```

#### 1.2 onReconnect処理の更新
**ファイル**: `/src/components/flow/OrganizationFlowBoard.tsx` (約660行目)

**現在のコード**:
```typescript
const onReconnect = useCallback(async (oldEdge: Edge, newConnection: Connection) => {
  // ... エッジ更新処理
  
  // React Flow状態で更新
  setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
}, [setEdges])
```

**必要な修正**:
```typescript
const onReconnect = useCallback(async (oldEdge: Edge, newConnection: Connection) => {
  // ... 既存のエッジ更新処理（影響分析は既にNodeDataServiceで実行済み）
  
  // React Flow状態更新
  setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
  
  // 🔄 追加: business_id変更による影響をリアルタイム反映
  await reloadData()
  console.log('🔄 Data reloaded after edge reconnection')
}, [setEdges, reloadData]) // reloadDataを依存関係に追加
```

### Task 2: エラーハンドリング強化

#### 2.1 ユーザー向けエラー表示
**課題**: 現在はコンソールログのみで、ユーザーにエラーが伝わらない

**実装箇所**:
- `onEdgesDelete`の`// TODO: ユーザーにエラー表示`部分
- `onConnect`のエラー処理
- `onReconnect`のエラー処理

**実装例**:
```typescript
// エラー状態管理の追加
const [errorMessage, setErrorMessage] = useState<string | null>(null)

// エラー表示コンポーネントの追加
{errorMessage && (
  <div className="error-notification">
    {errorMessage}
    <button onClick={() => setErrorMessage(null)}>✕</button>
  </div>
)}

// エラー処理での状態更新
if (!deleteResult.success) {
  setErrorMessage(`エッジ削除に失敗しました: ${deleteResult.error}`)
  continue
}
```

#### 2.2 ロールバック処理の強化
**課題**: 部分的な失敗時の整合性確保

**強化箇所**:
- `EdgeImpactService`での中間失敗時のロールバック
- `NodeDataService`でのトランザクション的処理

### Task 3: パフォーマンス最適化

#### 3.1 データリロードの最適化
**課題**: `reloadData()`は全データを再取得するため重い

**最適化案**:
```typescript
// 現在: 全データリロード
await reloadData()

// 改善: 影響を受けたノードのみ更新
await reloadAffectedNodes(affectedNodeIds)
```

#### 3.2 バッチ処理の実装
**課題**: 複数エッジの同時削除で個別処理になる

**最適化案**:
```typescript
// EdgeImpactService にバッチ処理メソッド追加
static async handleBatchEdgeDeletion(edges: {id: string, sourceNodeId: string, targetNodeId: string}[])
```

### Task 4: 包括的テスト

#### 4.1 必須テストシナリオ

**A) エッジ削除テスト**
- [ ] 事業→業務エッジ削除：業務がbusiness_id=nullになる
- [ ] 業務→実行者エッジ削除：実行者がbusiness_id=nullになる
- [ ] 削除後リロード：エッジが復活しない
- [ ] カスケード削除：子孫ノードも影響を受ける

**B) エッジ作成テスト**
- [ ] 事業→業務エッジ作成：業務のbusiness_idが事業IDになる
- [ ] 業務→実行者エッジ作成：実行者のbusiness_idが事業IDになる
- [ ] 作成後リロード：エッジが維持される
- [ ] カスケード更新：子孫ノードも影響を受ける

**C) エッジ再接続テスト**
- [ ] 業務を別事業に移動：business_idが新事業IDになる
- [ ] 実行者を別業務に移動：business_idが新業務の事業IDになる
- [ ] 再接続後リロード：変更が維持される
- [ ] 古い接続の影響：元の親から切断される

**D) 表示タブテスト**
- [ ] エッジ削除後：ノードが会社タブに移動
- [ ] エッジ作成後：ノードが対応事業タブに移動
- [ ] エッジ再接続後：ノードが新しい事業タブに移動

#### 4.2 エラーケーステスト
- [ ] ネットワークエラー時の挙動
- [ ] 部分的失敗時のロールバック
- [ ] 無効なノードIDでの操作
- [ ] 循環参照の防止

## 🚀 実装手順

### Phase 1: 基本機能完成
1. **OrganizationFlowBoard完全統合** (1-2時間)
   - onConnect処理の修正
   - onReconnect処理の修正
   - 依存関係の修正

2. **基本動作確認** (30分)
   - エッジ削除の永続化確認
   - エッジ作成のbusiness_id継承確認
   - エッジ再接続の影響確認

### Phase 2: エラーハンドリング強化
3. **ユーザー向けエラー表示** (1時間)
   - エラー状態管理の追加
   - エラー表示コンポーネント
   - 各操作でのエラー処理統合

4. **ロールバック処理強化** (1-2時間)
   - EdgeImpactServiceの中間失敗処理
   - NodeDataServiceのトランザクション化

### Phase 3: 最適化・テスト
5. **パフォーマンス最適化** (1-2時間)
   - データリロードの最適化
   - バッチ処理の実装

6. **包括的テスト** (1-2時間)
   - 全シナリオのテスト実行
   - エラーケースのテスト
   - パフォーマンステスト

## 📁 関連ファイル一覧

### 実装済みファイル
- ✅ `/src/lib/services/edgeImpactService.ts` - エッジ影響分析サービス
- ✅ `/src/lib/services/nodeDataService.ts` - エッジメソッド更新済み

### 作業中ファイル
- 🚧 `/src/components/flow/OrganizationFlowBoard.tsx` - エッジ処理ハンドラー統合

### 関連ファイル
- `/src/lib/flow/dataConverter.ts` - エッジロード処理
- `/src/lib/services/organizationDataService.ts` - データリロード処理
- `/src/types/flow.ts` - FlowEdge型定義

## ⚠️ 重要な注意事項

### 1. データ整合性リスク
**中リスク**: 部分的失敗時のデータ不整合
- **対策**: ロールバック処理の実装
- **監視**: エラーログの詳細記録

### 2. パフォーマンスリスク
**低リスク**: 複雑なカスケード更新による処理遅延
- **対策**: バッチ処理の実装
- **監視**: 操作時間の測定

### 3. UI応答性リスク
**低リスク**: データリロード中のUI無応答
- **対策**: ローディング表示の実装
- **監視**: ユーザー操作の応答時間

## 🔄 次回作業時の開始手順

### 1. 状況確認
```bash
# リポジトリ状態確認
git status
git log --oneline -5

# 開発サーバー起動
npm run dev

# ビルド確認
npm run build
```

### 2. 実装継続
- **Phase 1**: OrganizationFlowBoardの残りメソッド統合
- **動作確認**: エッジ操作の基本テスト
- **Phase 2**: エラーハンドリング強化

### 3. テスト手順
```typescript
// エッジ削除テスト
1. 事業→業務エッジを削除
2. リロードして復活しないことを確認
3. 業務が会社タブに表示されることを確認

// エッジ作成テスト  
1. 業務を別事業に接続
2. business_idが更新されることを確認
3. 新しい事業タブに表示されることを確認
```

---

**この引き継ぎ書に従い、段階的にエッジ操作の永続化を完了してください。**

**重要**: 各Phase完了時は必ずテスト・コミットを行い、問題発生時のロールバック手段を確保してください。