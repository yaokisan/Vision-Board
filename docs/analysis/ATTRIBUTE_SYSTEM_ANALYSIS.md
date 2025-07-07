# 属性システム分析レポート

最終更新: 2025-07-07

## 分析概要

Vision Boardアプリケーションの属性システムの現状分析と、自動連動システム実装のための詳細調査結果。

## 現在の属性状況（詳細）

### 事業ノード（正しい状態）
```
BEAUTY ROAD: c6ebb6b3-1185-48ca-b64c-80e116734d1e ✅
D2C: 33b4a8b1-f85e-4db5-9717-b8bdedac354b ✅  
AGA: 54eea9e4-27d7-47fb-9c1a-3f2bd7973eb5 ✅
AIM: b43f539f-2f18-4459-9346-179b680e168e ✅
新しい事業: c4d5638c-c156-440d-8d73-331f01f1a626 ✅
```

### 業務ノード（修正が必要）
```
✅ BR研修: c6ebb6b3-... (BEAUTY ROAD) - 正しい
❌ BRメディア: 54eea9e4-... → c6ebb6b3-... (BEAUTY ROAD)
❌ BR SaaS: c4d5638c-... → c6ebb6b3-... (BEAUTY ROAD)
❌ D2C業務1: 54eea9e4-... → 33b4a8b1-... (D2C)
❌ D2C業務2: c4d5638c-... → 33b4a8b1-... (D2C)
✅ AGA業務: 54eea9e4-... (AGA) - 正しい
❌ AIM業務: NULL → b43f539f-... (AIM)
❌ 孤立業務: 54eea9e4-... → NULL (company)
✅ 孤立業務: NULL (company) - 正しい
```

### 実行者ノード（全て修正が必要）
```
❌ BRメディア実行者「あ」: 54eea9e4-... → 親業務の属性に連動
⚠️ BR研修実行者「あ」: c6ebb6b3-... → 親業務の属性に連動（偶然一致）
⚠️ BR研修実行者「ええ」: c6ebb6b3-... → 親業務の属性に連動（偶然一致）
```

## エッジ関係の詳細マッピング

### Business → Task エッジ（edges テーブル）
```sql
business-c6ebb6b3-... → task-1b6f813b-... (BR研修) ✅
business-c6ebb6b3-... → task-7e7f769f-... (BRメディア) ❌
business-c6ebb6b3-... → task-78749987-... (BR SaaS) ❌
business-33b4a8b1-... → task-33cc6907-... (D2C業務1) ❌
business-33b4a8b1-... → task-d60e0a0e-... (D2C業務2) ❌
business-54eea9e4-... → task-b7e5343a-... (AGA業務) ✅
business-b43f539f-... → task-a8752eb9-... (AIM業務) ❌
```

### Task → Executor 関係（task_id カラム）
```sql
task-7e7f769f-... (BRメディア) → executor-da051ea0-... (あ) ❌
task-1b6f813b-... (BR研修) → executor-15feb24e-... (あ) ⚠️
task-1b6f813b-... (BR研修) → executor-36764b31-... (ええ) ⚠️
```

## 問題の根本原因

### 1. 手動設定による不整合
- 属性が手動で設定されているため、親子関係と一致しない
- エッジ作成後に属性が自動更新されない
- 親ノードの属性変更時に子ノードが連動しない

### 2. 二重管理システム
- エッジテーブル（表示上の接続）
- task_id/business_id（データベース上の関係）
- 両方が属性に影響するが、自動連動していない

### 3. 過去のレイヤーベース設定の残存
- 以前のレイヤーベース属性設定ロジックの影響
- 現在のエッジベースシステムと混在している

## 自動連動システムの要件

### A. エッジ作成時
```javascript
// 事業 → 業務のエッジ作成時
onConnect(businessNode, taskNode) {
  taskNode.attribute = businessNode.attribute
  updateDatabase(taskNode)
}

// 業務 → 実行者のエッジ作成時（task_id更新時）
onTaskIdUpdate(executorNode, taskNode) {
  executorNode.attribute = taskNode.attribute
  updateDatabase(executorNode)
}
```

### B. エッジ削除時
```javascript
// 事業 → 業務のエッジ削除時
onDisconnect(businessNode, taskNode) {
  taskNode.attribute = null // company属性にリセット
  updateDatabase(taskNode)
}
```

### C. 属性変更時の制限
```javascript
// エッジ接続中は属性変更を禁止
canEditAttribute(node) {
  if (hasParentEdge(node)) {
    return false // 親エッジがある場合は編集不可
  }
  return true
}
```

### D. 親ノード属性変更時の連動
```javascript
// 事業ノードの属性変更時（事業は自分自身のIDなので変更なし）
// 業務ノードの属性変更時
onAttributeChange(parentNode) {
  const childNodes = getConnectedChildren(parentNode)
  childNodes.forEach(child => {
    child.attribute = parentNode.attribute
    updateDatabase(child)
  })
}
```

## 実装優先順位

### Phase 1: データ修正
1. エッジ関係に基づく属性の一括修正
2. 孤立ノードの属性リセット

### Phase 2: 基本的な自動連動
1. エッジ作成時の属性継承
2. task_id更新時の実行者属性連動

### Phase 3: 高度な自動連動
1. エッジ削除時の属性リセット
2. エッジ接続中の属性変更禁止
3. 親ノード変更時の子ノード連動

### Phase 4: 特殊ルール
1. 業務ノードの独立属性システム
2. 複雑な継承ルール

## 技術的考慮事項

### React Flow統合
- `onConnect`, `onReconnect`, `onEdgesDelete` イベントの活用
- React状態とデータベースの同期

### データベース整合性
- トランザクション処理
- 同時更新の競合回避
- エラー時のロールバック

### パフォーマンス
- 大量ノード時の一括更新
- リアルタイム更新の最適化
- 不要な再レンダリングの回避