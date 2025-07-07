# business_id統合の全体像

## 🎯 統合の目的
attributeとbusiness_idの概念重複を解消し、business_id一本化でシンプルな設計にする。

## 現在の状態

```mermaid
graph TB
    subgraph "現在のデータ構造"
        Task1["業務A<br/>business_id: 事業1<br/>attribute: 事業1"]
        Task2["業務B<br/>business_id: 事業1<br/>attribute: company"]
        Task3["業務C<br/>business_id: null<br/>attribute: company"]
    end
    
    subgraph "表示制御（attribute基準）"
        CompanyTab["会社タブ"]
        BusinessTab1["事業1タブ"]
    end
    
    Task1 --> BusinessTab1
    Task2 --> CompanyTab
    Task3 --> CompanyTab
    
    style Task2 fill:#ffcccc
    style Task3 fill:#ffcccc
```

## 統合後の理想状態

```mermaid
graph TB
    subgraph "統合後のデータ構造"
        Task1New["業務A<br/>business_id: 事業1<br/>attribute: 削除"]
        Task2New["業務B<br/>business_id: 事業1<br/>attribute: 削除"]
        Task3New["業務C<br/>business_id: null<br/>attribute: 削除"]
    end
    
    subgraph "表示制御（business_id基準）"
        CompanyTabNew["会社タブ<br/>(business_id=null)"]
        BusinessTab1New["事業1タブ<br/>(business_id=事業1)"]
    end
    
    Task1New --> BusinessTab1New
    Task2New --> BusinessTab1New
    Task3New --> CompanyTabNew
    
    style Task1New fill:#ccffcc
    style Task2New fill:#ccffcc
    style Task3New fill:#ccffcc
```

## 統合時の判定ロジック変更

```mermaid
flowchart TD
    A[ノード表示判定] --> B{currentTab == 'company'?}
    B -->|Yes| C[全ノード表示]
    B -->|No| D{business_id == null?}
    D -->|Yes| E[会社タブのみ表示]
    D -->|No| F{business_id == currentTab?}
    F -->|Yes| G[表示]
    F -->|No| H[非表示]
    
    subgraph "現在"
        A1[attribute基準判定]
    end
    
    subgraph "統合後"
        A --> A1
    end
```

## 現在のデータ状況（実際のデータ）

```mermaid
graph LR
    subgraph "現在のデータ"
        T1["新しい業務①<br/>business_id: 新しい事業<br/>attribute: company"]
        T2["新しい業務②<br/>business_id: 新しい事業<br/>attribute: company"]
        T3["新しい業務③<br/>business_id: 新しい事業<br/>attribute: company"]
        T4["BR SaaS<br/>business_id: BEAUTY ROAD<br/>attribute: BEAUTY ROAD"]
        T5["BRメディア<br/>business_id: BEAUTY ROAD<br/>attribute: BEAUTY ROAD"]
        T6["BR研修<br/>business_id: BEAUTY ROAD<br/>attribute: BEAUTY ROAD"]
        T7["新しい業務(D2C)<br/>business_id: D2C<br/>attribute: D2C"]
        T8["新しい業務(AIM)<br/>business_id: AIM<br/>attribute: AIM"]
    end
    
    subgraph "統合後"
        T1New["新しい業務①<br/>business_id: 新しい事業"]
        T2New["新しい業務②<br/>business_id: 新しい事業"] 
        T3New["新しい業務③<br/>business_id: 新しい事業"]
        T4New["BR SaaS<br/>business_id: BEAUTY ROAD"]
        T5New["BRメディア<br/>business_id: BEAUTY ROAD"]
        T6New["BR研修<br/>business_id: BEAUTY ROAD"]
        T7New["新しい業務(D2C)<br/>business_id: D2C"]
        T8New["新しい業務(AIM)<br/>business_id: AIM"]
    end
    
    T1 --> T1New
    T2 --> T2New  
    T3 --> T3New
    T4 --> T4New
    T5 --> T5New
    T6 --> T6New
    T7 --> T7New
    T8 --> T8New
    
    style T1 fill:#fff2cc
    style T2 fill:#fff2cc
    style T3 fill:#fff2cc
```

## 統合の主な変更点

### 1. データ構造の変更
- ✅ `attribute`カラム削除
- ✅ `business_id`のみで所属を管理
- ✅ `business_id=null` = 会社レベル

### 2. 表示制御の変更
- ✅ `shouldShowContainer`を`business_id`基準に変更
- ✅ タブ表示判定を`business_id`ベースに統一

### 3. UI変更
- ✅ EditModalで`business_id`選択（attributeの代わり）
- ✅ 自動設定ロジックを`business_id`ベースに変更

### 4. 影響を受ける業務
- **3つの「新しい業務」**: 会社タブ → 「新しい事業」タブに移動
- **その他7つの業務**: 変更なし（既に整合済み）

## 統合フェーズ

### Phase 1: 準備・設計検証 ✅
- 統合前テスト作成
- データ整合性確認
- 統合方針確定

### Phase 2: バックエンド統合 (進行中)
- 表示制御システム更新
- データ取得・保存処理更新

### Phase 3: UI統合
- EditModal更新
- InlineCardModal更新
- 自動設定ロジック更新

### Phase 4: データベース統合
- attributeカラム削除
- 型定義更新

### Phase 5: 最終検証
- 統合後テスト
- 動作確認

## データ品質確認結果

- ✅ **孤立Executor**: 0個
- ✅ **無効business_id**: 0個  
- ✅ **attribute-business_id不整合**: 0個
- ✅ **総業務数**: 10個
- ✅ **既に整合済み**: 7個
- ⚠️ **company属性だが事業所属**: 3個（統合対象）

## 期待される効果

1. **概念の簡素化**: attributeとbusiness_idの重複解消
2. **保守性向上**: 単一の責任（business_idのみ）
3. **バグ減少**: データ不整合のリスク軽減
4. **開発効率**: 新機能実装時の迷いが減る

この統合により、Vision-Boardの設計がよりシンプルで理解しやすくなります。