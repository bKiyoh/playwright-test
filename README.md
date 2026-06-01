# Playwright 駆動テストで Todo アプリを作る

この記事では、Vue + Vuetify で作った Todo アプリに Playwright を導入し、E2E テストを通じて実装の不具合を見つけて修正するまでの流れをまとめます。

今回のポイントは、手動でアプリを実装しないことです。Todo アプリの生成、Playwright のシナリオ検討、テスト実装、失敗原因の調査、修正までを Codex に依頼しながら進めました。

## 概要

やったことは大きく3つです。

- Todo アプリを Codex で生成する
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

### Todo App 生成

最初に、Playwright の練習用アプリとして Todo アプリを作成しました。

この時点では、あえて Playwright の導入は Codex に依頼しませんでした。まずはテスト対象となるアプリだけを作り、Playwright 自体はあとから手動で入れる流れにしています。

#### 使用プロンプト

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

#### 実行すると

アプリ自体は起動しましたが、即座に UI を見て違和感に気づきました。

- Todo の入力欄がない
荒いプロンプトだったせいですかね、これもまた勉強が必要です。

<img width="1440" height="785" alt="Image" src="https://github.com/user-attachments/assets/bc22276b-292d-4756-8f6a-2e69e4943443" />

これも後に Playwright を入れることで、こうした問題は「なんとなく動かない」ではなく、失敗するテストとして表面化します。今回の流れでは、ここが一番おもしろいところでした。

### Playwright 導入

Playwright の導入は、勉強も兼ねて手動で行いました。

公式ドキュメントはこちらです。

- https://playwright.dev/docs/intro

Playwright 公式の Installation ページでは、既存プロジェクトへの導入方法として `npm init playwright@latest` や `npm install -D @playwright/test@latest` が案内されています。

今回は導入後、Codex に「実装コードを元にテストシナリオを検討して」と依頼しました。

### Playwright 設定

ここからは再び Codex に作業してもらいました。

#### 使用プロンプト

まず、シナリオ検討を依頼しました。

```text
Playwrightを導入しましたので
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
では書いた内容をPlaywrightを利用してテストを実施し、NGの箇所は修正してください
```

この依頼で、Playwright の設定とテストコードが追加されました。

主な変更は以下です。

- `playwright.config.js` に `baseURL` と `webServer` を設定
- `package.json` に `test:e2e` を追加
- `tests/example.spec.js` を Todo アプリ用のテストに置き換え
- Vuetify の components / directives 登録漏れを修正

### 実行してもらう

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

### 修正してもらう

失敗を追っていく中で、次の問題が見つかりました。

#### 1. 入力欄の locator が Vuetify のDOM構造と合っていなかった

最初は `data-testid="todo-input"` を使って入力しようとしていました。

しかし、Vuetify の `v-text-field` では `data-testid` が実際の `input` ではなく外側の要素に付くことがあり、Playwright の `fill()` 対象として扱いづらい状態でした。

そこで、テスト側では実際のテキスト入力要素を取るようにしました。

```js
function todoInput(page) {
  return page.locator('input[type="text"]').first();
}
```

#### 2. Vuetify コンポーネントが正しく登録されていなかった

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

<img width="1440" height="786" alt="Image" src="https://github.com/user-attachments/assets/89293314-314a-47cc-9b84-def908abf6ae" />

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

今回の流れで特に印象に残ったのは、Codex に実装を任せただけでは見落としやすい問題が、Playwright の実行によって具体的な失敗として見えるようになったことです。

最初に生成された Todo アプリは、一見すると画面が表示されているように見えました。しかし実際に操作しようとすると、入力欄が期待通りに扱えなかったり、Todo が追加されなかったりといった問題がありました。

特に Vuetify のようなコンポーネントライブラリを使う場合、画面上の見た目と実際に生成される DOM が必ずしも直感通りになるとは限りません。

Playwright を使うことで、こうした違和感を「操作できない」「要素が見つからない」「件数が更新されない」といった具体的なテスト失敗として確認できました。近い形で検出できます。

「AI に書かせて終わり」ではなく、「AI に書かせて、E2E テストで動作確認し、失敗を元に直す」流れにすると、学習用途としても実装用途としてもかなり実践的でした。
