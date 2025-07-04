# 接続線座標計算問題の修正記録

## 📋 問題の概要

### 発生した問題
1. **接続線が全く繋がらない**: カード間を正しく接続できない
2. **ズーム・パンで線がずれる**: キャンバス変形に追従しない  
3. **CXOカードのドラッグ問題**: ドラッグ後に元の位置に戻る不安定な挙動

## 🔍 問題分析プロセス

### 1. 初期状態の把握
- 接続線は表示されているが、完全に間違った位置
- ズームイン/アウトで線の位置が変化
- カードドラッグ時の線の追従が不安定

### 2. CXOカード問題の特定と修正
**問題**: `handleDragEnd`でドロップゾーン制約により、CXOカードの位置更新が阻害

**修正内容**:
```typescript
// カードの種類を判定
const cardType = active.data.current?.type

// CXOカードや会社カードは常に位置を更新
if (cardType === 'company' || cardType === 'position') {
  // 位置を保存
}
// レイヤー内のカードはドロップゾーン内でのみ位置を更新
else if (over && (over.id === 'business-layer-drop' || over.id === 'management-layer-drop')) {
  // 位置を保存  
}
```

**結果**: ✅ CXOカードの安定したドラッグ&ドロップが実現

### 3. 接続線座標計算の修正試行

#### 修正試行1: キャンバス変形の考慮
```typescript
// キャンバスの変形情報を取得
const matrix = new DOMMatrix(transform)
zoom = matrix.a  // scale値
panX = matrix.e  // translateX値  
panY = matrix.f  // translateY値

// 変形を考慮した座標計算
const startX = (startRect.left + startRect.width / 2 - canvasRect.left - panX) / zoom
```

**問題**: 座標計算が複雑すぎて正確性に欠ける

#### 修正試行2: 接続点の調整
- `startRect.bottom` → `startRect.top + startRect.height / 2` (中心点)
- `endRect.top` → `endRect.top + endRect.height / 2` (中心点)

**問題**: 依然として正しい接続ができない

#### 修正試行3: シンプルな相対座標計算
```typescript
// SVGコンテナを基準とした相対座標
const startX = startRect.left + startRect.width / 2 - svgRect.left
const startY = startRect.top + startRect.height / 2 - svgRect.top
```

**現状**: まだ解決に至っていない

## 🔧 デバッグ情報の活用

### 実装したログ出力
```typescript
console.log(`Connection: ${startElementId} -> ${endElementId}`)
console.log('Start element rect:', startRect)
console.log('End element rect:', endRect) 
console.log('Calculated coordinates:', { startX, startY, endX, endY })
console.log('Generated path:', path)
```

### 判明した事実
- 要素は正しく見つかっている
- ビューポート座標は取得できている
- SVGパス生成も実行されている
- **座標変換の計算ロジックに根本的な問題がある**

## ✅ 解決済みの問題

### 4. 接続線参照先の構造的不整合

**問題**: 接続線がカードの個別移動に追従しない根本原因を特定

#### 根本原因
接続線の参照対象と実際に移動する要素が異なっていた：

```tsx
// 問題のある構造
<div id="6">  ← 接続線が参照（静的位置）
  <DraggableCard>  ← 実際に移動する要素（transform）
    <BusinessCard />
  </DraggableCard>
</div>
```

#### 解決方法

**1. DraggableCardにID付与**:
```tsx
// DraggableCard.tsx
<div
  id={`draggable-${id}`}  // 実際に移動する要素にID付与
  ref={setNodeRef}
  style={style}  // transform: translate3d()
>
```

**2. 接続線参照先変更**:
```tsx
// 修正前
<ConnectionLine startElementId="company-1" endElementId="6" />

// 修正後  
<ConnectionLine startElementId="draggable-company-1" endElementId="draggable-6" />
```

#### 結果
- ✅ **個別カード移動**: 完全に追従
- ✅ **CXO・会社カード**: 正常に追従
- ✅ **コンテナ内カード**: 正常に追従
- ❌ **コンテナ移動への誤追従**: 解消

---

## 🚨 未解決の問題

### 主要課題
1. **ズーム・パン同期**: ズームイン・アウトで線位置がずれる
2. **接続線の初期位置**: カード中心点からの正確な描画

### 次のアプローチ候補
1. **ズーム・パン座標系の統一**: キャンバス変形を考慮した座標計算
2. **接続線描画位置の微調整**: カード中心点の正確な特定

## 📅 作業履歴

- **2025-07-04**: CXOカード問題修正完了
- **2025-07-04**: 接続線座標計算の複数回修正試行  
- **2025-07-04**: デバッグログ実装、Layer 1-4 調査完了
- **2025-07-04**: **構造的不整合を特定・修正完了** ✅
- **2025-07-04**: 接続線のカード追従問題解決 ✅

---

*主要な接続線追従問題は解決済み。残る課題はズーム・パン同期と描画位置の微調整。*