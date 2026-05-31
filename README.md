# Playwright 駆動テストで Todo アプリを作る

この記事では、Vue + Vuetify で作った Todo アプリに Playwright を導入し、E2E テストを通じて実装の不具合を見つけて修正するまでの流れをまとめます。

今回のポイントは、手動でアプリを実装しないことです。Todo アプリの生成、Playwright のシナリオ検討、テスト実装、失敗原因の調査、修正までを Codex に依頼しながら進めました。

## 概要

やったことは大きく3つです。

- Playwright 練習用の Todo アプリを Codex で生成する
- Playwright は勉強も兼ねて手動で導入する
- 導入後、Codex に E2E テストを作成・実行・修正してもらう

最終的には、Todo の追加、完了切り替え、フィルター、削除、全削除、localStorage への保存・復元、不正な localStorage 値への耐性まで Playwright で確認できるようになりました。

## 使用技術

- Vue 3
- JavaScript
- Vuetify
- Vite
- Playwright

## 工程

## Todo App 生成

最初に、Playwright の練習用アプリとして Todo アプリを作成しました。

この時点では、あえて Playwright の導入は Codex に依頼しませんでした。まずはテスト対象となるアプリだけを作り、Playwright 自体はあとから手動で入れる流れにしています。

### 使用プロンプト

実際に Codex へ渡したプロンプトの要点は以下です。

```text
Vue + Vuetify を使って、Playwright の動作テスト練習用 Todo アプリを作成してください。

技術構成:
- Vue 3
- JavaScript
- Vuetify
- Vite

重要な前提:
Playwright はあとで手動導入するため、今回は Playwright のインストールや設定は行わないでください。

ただし、後から Playwright で E2E テストを書きやすいように、主要な要素には data-testid を付与してください。

機能要件:
- Todo 追加
- Todo 一覧表示
- Todo 完了切り替え
- Todo 削除
- すべて / 未完了 / 完了済み のフィルター
- 全削除

作成しないもの:
- Playwright のインストール
- Playwright の設定ファイル
- E2E テストファイル
- tests ディレクトリ
- playwright.config.js
- Playwright 関連の npm scripts
```

このプロンプトで、`src/App.vue`、`src/main.js`、`src/plugins/vuetify.js`、`src/styles.css` などが生成されました。

### 実行すると

アプリ自体は起動しましたが、実際に触ってみると次の問題がありました。

- Todo の入力欄が分かりにくい、または入力できないように見える
- `data-testid="todo-input"` が Vuetify の外側要素に付き、実際の `input` に届いていない
- localStorage 保存が未実装だった
- Vuetify コンポーネントの登録が不十分で、後の E2E テスト時に実DOMが期待通り生成されない問題があった

この段階では、UI を見て違和感に気づきました。

ただし、後から Playwright を入れることで、こうした問題は「なんとなく動かない」ではなく、失敗するテストとして表面化します。今回の流れでは、ここが一番おもしろいところでした。

### localStorage 保存の追加

入力できない問題を確認したあと、追加で以下を依頼しました。

```text
うーん入力できないよ
ちなみに入力データはローカルストレージに保存するようにしてほしい
```

これにより、Todo の追加・完了切り替え・削除・全削除が localStorage に保存されるようになりました。

保存キーは以下です。

```js
const STORAGE_KEY = "playwright-practice-todos";
```

## Playwright 導入

Playwright の導入は、勉強も兼ねて手動で行いました。

公式ドキュメントはこちらです。

- https://playwright.dev/docs/intro

Playwright 公式の Installation ページでは、既存プロジェクトへの導入方法として `npm init playwright@latest` や `npm install -D @playwright/test@latest` が案内されています。

今回は導入後、Codex に「実装コードを元にテストシナリオを検討して」と依頼しました。

## Playwright 設定

ここからは再び Codex に作業してもらいました。

### 使用プロンプト

まず、シナリオ検討を依頼しました。

```text
playwiteを導入しましたので
実装コードを元にシナリオを検討してください
```

Codex は `src/App.vue` の実装を読み、次のようなテスト観点を洗い出しました。

- 初期表示
- Todo 追加
- 空文字・空白のみの Todo は追加できない
- 完了切り替え
- 未完了 / 完了済み / すべて のフィルター
- 個別削除
- 全削除
- localStorage 復元
- localStorage に不正値がある場合の表示
- Chromium / Firefox / WebKit での確認

次に、実装作業を依頼しました。

```text
では書いた内容を踏まえて作業してください
```

この依頼で、Playwright の設定とテストコードが追加されました。

主な変更は以下です。

- `playwright.config.js` に `baseURL` と `webServer` を設定
- `package.json` に `test:e2e` を追加
- `tests/example.spec.js` を Todo アプリ用のテストに置き換え
- Vuetify の components / directives 登録漏れを修正

## 実行してもらう

Playwright の実行コマンドは以下です。

```bash
npm run test:e2e
```

最初からすべて成功したわけではありません。

最初の実行では、テストが `todo-checkbox` や削除ボタンを待ち続け、タイムアウトしました。

Playwright レポートには、たとえば次のような失敗が残りました。

```text
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('todo-checkbox')
```

この時のページスナップショットを見ると、入力欄に文字は入っているのに Todo 件数は `0` のままで、リストも表示されていませんでした。

つまり、テストが失敗した直接の理由は「チェックボックスが見つからない」ですが、根本原因は「Todo が追加されていない」ことでした。

## 修正してもらう

失敗を追っていく中で、次の問題が見つかりました。

### 1. 入力欄の locator が Vuetify のDOM構造と合っていなかった

最初は `data-testid="todo-input"` を使って入力しようとしていました。

しかし、Vuetify の `v-text-field` では `data-testid` が実際の `input` ではなく外側の要素に付くことがあり、Playwright の `fill()` 対象として扱いづらい状態でした。

そこで、テスト側では実際のテキスト入力要素を取るようにしました。

```js
function todoInput(page) {
  return page.locator('input[type="text"]').first();
}
```

### 2. Vuetify コンポーネントが正しく登録されていなかった

さらに調べると、`v-text-field` などが本物の Vuetify コンポーネントとして解決されず、DOM にそのまま残る問題がありました。

そのため、`src/plugins/vuetify.js` で Vuetify の components / directives を登録するように修正しました。

```js
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default createVuetify({
  components,
  directives,
});
```

この修正により、Vuetify の入力欄やチェックボックスなどが正しくレンダリングされ、Playwright から操作できるようになりました。

## 完成

最終的に、以下の E2E テストが実装されました。

- 初期表示では空の Todo 一覧と件数が表示される
- Todo を追加すると一覧と件数が更新される
- 空白のみの Todo は追加できない
- Todo の完了状態を切り替えられる
- 未完了と完了済みで Todo を絞り込める
- 個別削除と全削除ができる
- Todo はリロード後も localStorage から復元される
- localStorage に不正な値が入っていても空の一覧で表示される
- localStorage に配列以外の値が入っていても空の一覧で表示される

実行結果は以下です。

```text
npm run build
成功

npm run test:e2e -- --project=chromium
9 passed

npm run test:e2e
27 passed
```

Chromium、Firefox、WebKit の3ブラウザで9本ずつ、合計27本のテストが通りました。

## やってみて分かったこと

今回の流れでは、Codex に実装を任せたことで、ある意味で「AI が作ったコードを AI と Playwright で検証する」形になりました。

最初の Todo アプリ生成だけでは、画面上の違和感や内在バグに気づきにくい部分がありました。特に Vuetify のようなコンポーネントライブラリでは、見た目のコンポーネントと実際の DOM が一致しないことがあります。

Playwright を入れると、そこが明確になります。

- 入力できるはずなのに `fill()` できない
- 追加したはずなのに Todo が増えない
- チェックボックスが存在するはずなのに locator が見つからない

こうした失敗は、実装の曖昧さを具体的なエラーに変えてくれます。

そのため、Codex に実装させる場合でも、Playwright のような E2E テストを組み合わせると安心感が大きく上がると感じました。

## まとめ

今回は、Todo アプリ作成から Playwright による E2E テスト実装、失敗の調査、修正、全ブラウザでの成功までを Codex と進めました。

手動で書いたのは Playwright 導入部分だけで、アプリ実装とテスト実装は Codex に任せています。

Codex に実装を依頼するだけだと、UI の細かい不具合やコンポーネント登録漏れが残ることがあります。しかし、Playwright を組み合わせることで、それらを実際のユーザー操作に近い形で検出できます。

「AI に書かせて終わり」ではなく、「AI に書かせて、E2E テストで動作確認し、失敗を元に直す」流れにすると、学習用途としても実装用途としてもかなり実践的でした。
